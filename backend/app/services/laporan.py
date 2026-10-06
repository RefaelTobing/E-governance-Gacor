import os
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.exif_utils import extract_gps_from_file
from app.core.utils import haversine_km
from app.models.laporan import Laporan
from app.models.laporan_timeline import LaporanTimeline
from app.models.ruang_publik import RuangPublik
from app.schemas.laporan import LaporanCreate, LaporanUpdate, STATUS_TAYANG
from app.services import ruang_publik as crud_ruang_publik
from app.services import user as crud_user

def create_report(
    db: Session, 
    laporan_in: LaporanCreate,
    user_id: Optional[str] = None
) -> Laporan:
    # Foto wajib dan harus hasil unggahan sistem sendiri, bukan URL bebas.
    if not laporan_in.foto_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Foto bukti fisik wajib diunggah."
        )
    if not laporan_in.foto_url.startswith("/uploads/laporan/") or ".." in laporan_in.foto_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL foto tidak valid (harus berada di /uploads/laporan/)."
        )
    rel_path = laporan_in.foto_url.removeprefix("/uploads/")
    if not os.path.isfile(os.path.join(settings.UPLOAD_DIR, rel_path)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File foto tidak ditemukan di server."
        )

    # Koordinat opsional sampai BE-23, tapi kalau diisi harus berpasangan.
    if (laporan_in.lat_user is None) != (laporan_in.long_user is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Koordinat lokasi harus lengkap (latitude dan longitude)."
        )

    # Validasi: mode tampilkan_nama memerlukan autentikasi.
    if laporan_in.mode_identitas == "tampilkan_nama" and not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Untuk menampilkan nama, silakan login. Atau pilih mode anonim."
        )
    
    # Isi nama pelapor dari user terautentikasi saat mode tampilkan_nama.
    # Abaikan laporan_in.nama_pelapor dari payload untuk mencegah spoofing.
    nama_pelapor = None
    if laporan_in.mode_identitas == "tampilkan_nama" and user_id:
        user = crud_user.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Untuk menampilkan nama, akun Anda tidak ditemukan. Silakan login ulang, atau pilih mode anonim."
            )
        nama_pelapor = user.name

    db_laporan = Laporan(
        user_id=user_id,
        ruang_publik_id=laporan_in.ruang_publik_id,
        fasilitas_id=laporan_in.fasilitas_id,
        jenis_masalah=laporan_in.jenis_masalah,
        deskripsi=laporan_in.deskripsi,
        mode_identitas=laporan_in.mode_identitas,
        nama_pelapor=nama_pelapor,
        foto_url=laporan_in.foto_url,
        lat_user=laporan_in.lat_user,
        long_user=laporan_in.long_user,
        status="menunggu_verifikasi"
    )
    db.add(db_laporan)
    db.commit()
    db.refresh(db_laporan)
    
    timeline = LaporanTimeline(
        laporan_id=db_laporan.id,
        status="menunggu_verifikasi",
        title="Laporan dikirim",
        description="Laporan baru dikirim oleh warga"
    )
    db.add(timeline)
    db.commit()

    exif_path = os.path.join(settings.UPLOAD_DIR, laporan_in.foto_url.removeprefix("/uploads/"))
    lat_exif, lon_exif = extract_gps_from_file(exif_path)
    if lat_exif is not None and lon_exif is not None:
        db_laporan.lat_exif = lat_exif
        db_laporan.long_exif = lon_exif

    rp = crud_ruang_publik.get_ruang_publik(db, laporan_in.ruang_publik_id)
    if rp and rp.latitude is not None and rp.longitude is not None:
        rp_lat = float(rp.latitude)
        rp_lon = float(rp.longitude)
        if laporan_in.lat_user is not None and laporan_in.long_user is not None:
            db_laporan.jarak_browser_rp = haversine_km(
                laporan_in.lat_user, laporan_in.long_user, rp_lat, rp_lon
            )
        if lat_exif is not None and lon_exif is not None:
            db_laporan.jarak_exif_rp = haversine_km(
                lat_exif, lon_exif, rp_lat, rp_lon
            )

    # BE-23: auto-tayang hanya bila kedua jarak (browser & EXIF) ada dan <= ambang.
    # Selain itu tetap menunggu_verifikasi: tanpa EXIF, tanpa koordinat browser,
    # RP tanpa koordinat, atau salah satu/kedua jarak melampaui ambang.
    ambang_km = settings.FAKE_GPS_THRESHOLD_M / 1000
    jarak_browser = db_laporan.jarak_browser_rp
    jarak_exif = db_laporan.jarak_exif_rp
    lolos_validasi = (
        jarak_browser is not None
        and jarak_exif is not None
        and jarak_browser <= ambang_km
        and jarak_exif <= ambang_km
    )
    if lolos_validasi:
        db_laporan.status = "diverifikasi"
        db.add(LaporanTimeline(
            laporan_id=db_laporan.id,
            status="diverifikasi",
            title="Lolos validasi lokasi",
            description=(
                f"Jarak browser {jarak_browser * 1000:.0f} m dan EXIF "
                f"{jarak_exif * 1000:.0f} m dari ruang publik (ambang "
                f"{settings.FAKE_GPS_THRESHOLD_M} m) - laporan otomatis tayang."
            ),
        ))

    db.commit()
    db.refresh(db_laporan)

    return db_laporan

def get_report_by_id(db: Session, laporan_id: str) -> Optional[Laporan]:
    stmt = (
        select(Laporan)
        .options(
            joinedload(Laporan.user),
            joinedload(Laporan.timeline),
            joinedload(Laporan.ruang_publik),
            joinedload(Laporan.fasilitas)
        )
        .where(Laporan.id == laporan_id)
    )
    return db.scalars(stmt).unique().first()

def get_reports(
    db: Session,
    status: Optional[str] = None,
    wilayah: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None
) -> list[Laporan]:
    stmt = select(Laporan).options(
        joinedload(Laporan.user),
        joinedload(Laporan.ruang_publik),
        joinedload(Laporan.fasilitas)
    )
    
    conditions = []
    if user_id:
        conditions.append(Laporan.user_id == user_id)
    if status and status != "semua":
        conditions.append(Laporan.status == status)
    if wilayah:
        conditions.append(Laporan.ruang_publik.has(RuangPublik.wilayah == wilayah))
    if q:
        search_pattern = f"%{q}%"
        conditions.append(
            (Laporan.jenis_masalah.ilike(search_pattern)) |
            (Laporan.deskripsi.ilike(search_pattern))
        )
    
    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    stmt = stmt.order_by(Laporan.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).unique().all())

def update_report_status(
    db: Session,
    laporan_id: str,
    status: str,
    title: str = "Status diperbarui",
    description: Optional[str] = None
) -> Optional[Laporan]:
    db_laporan = get_report_by_id(db, laporan_id)
    if not db_laporan:
        return None
    
    db_laporan.status = status
    db.commit()
    db.refresh(db_laporan)
    
    timeline = LaporanTimeline(
        laporan_id=laporan_id,
        status=status,
        title=title,
        description=description or f"Status diubah menjadi {status}"
    )
    db.add(timeline)
    db.commit()
    
    return db_laporan

def get_reports_by_ruang_publik(
    db: Session, ruang_publik_id: str, skip: int = 0, limit: int = 100
) -> list[Laporan]:
    stmt = (
        select(Laporan)
        .options(
            joinedload(Laporan.ruang_publik),
            joinedload(Laporan.fasilitas)
        )
        .where(
            Laporan.ruang_publik_id == ruang_publik_id,
            Laporan.status.in_(STATUS_TAYANG)
        )
        .order_by(Laporan.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).unique().all())

def get_dashboard_stats(db: Session) -> dict:
    total = db.query(Laporan).count()
    menunggu = db.query(Laporan).filter(Laporan.status == "menunggu_verifikasi").count()
    dalam_penanganan = db.query(Laporan).filter(Laporan.status == "dalam_penanganan").count()
    selesai = db.query(Laporan).filter(Laporan.status == "selesai").count()
    
    return {
        "total_laporan": total,
        "menunggu_verifikasi": menunggu,
        "dalam_penanganan": dalam_penanganan,
        "selesai": selesai
    }

def get_moderasi_stats(db: Session) -> dict:
    menunggu = db.query(Laporan).filter(Laporan.status == "menunggu_verifikasi").count()

    # Awal pekan = Senin 00:00:00 pada minggu berjalan.
    now = datetime.now()
    awal_pekan = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Hitung dari LaporanTimeline: kapan status benar-benar berubah menjadi
    # "selesai", bukan kapan laporan dibuat (Laporan.created_at).
    selesai_pekan_ini = (
        db.query(LaporanTimeline)
        .filter(
            LaporanTimeline.status == "selesai",
            LaporanTimeline.created_at >= awal_pekan,
        )
        .count()
    )

    return {
        "antrian_moderasi": menunggu,
        "selesai_pekan_ini": selesai_pekan_ini,
    }
