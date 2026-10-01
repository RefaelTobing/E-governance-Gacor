from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.fasilitas import Fasilitas
from app.models.ruang_publik import RuangPublik

# Radius bumi rata-rata dalam km, dipakai rumus Haversine.
EARTH_RADIUS_KM = 6371.0


def _haversine_km(lat: float, lng: float):
    # Haversine dihitung di SQL supaya penyaringan radius dan pengurutan jarak
    # terjadi di database, bukan setelah semua baris ditarik ke Python.
    lat_rad = func.radians(lat)
    lng_rad = func.radians(lng)
    return EARTH_RADIUS_KM * func.acos(
        func.least(
            1.0,
            func.cos(lat_rad)
            * func.cos(func.radians(RuangPublik.latitude))
            * func.cos(func.radians(RuangPublik.longitude) - lng_rad)
            + func.sin(lat_rad) * func.sin(func.radians(RuangPublik.latitude)),
        )
    )


def search_ruang_publik(
    db: Session,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    kategori_id: Optional[str] = None,
    fasilitas: Optional[Sequence[str]] = None,
    q: Optional[str] = None,
    wilayah: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[tuple[RuangPublik, Optional[float]]]:
    """Cari ruang publik dengan filter radius, kategori, dan fasilitas.

    Mengembalikan pasangan (RuangPublik, jarak_km). jarak_km None bila lat/lng
    tidak diberikan, karena tanpa titik acuan jarak tidak bisa dihitung.
    """
    jarak = _haversine_km(lat, lng) if lat is not None and lng is not None else None

    stmt = select(RuangPublik).options(joinedload(RuangPublik.kategori))

    # Baris tanpa koordinat tidak bisa diukur jaraknya, jadi selalu dibuang
    # saat pencarian berbasis radius.
    if jarak is not None:
        stmt = stmt.where(RuangPublik.latitude.isnot(None), RuangPublik.longitude.isnot(None))
        if radius_km is not None:
            stmt = stmt.where(jarak <= radius_km)

    if kategori_id:
        stmt = stmt.where(RuangPublik.kategori_id == kategori_id)

    if wilayah:
        stmt = stmt.where(RuangPublik.wilayah == wilayah)

    if q:
        search_pattern = f"%{q}%"
        stmt = stmt.where(
            (RuangPublik.nama.ilike(search_pattern)) |
            (RuangPublik.alamat.ilike(search_pattern))
        )

    if fasilitas:
        # Semua fasilitas yang diminta harus ada (AND), bukan salah satu (OR).
        subq = (
            select(Fasilitas.ruang_publik_id)
            .where(Fasilitas.nama.in_(fasilitas))
            .group_by(Fasilitas.ruang_publik_id)
            .having(func.count(func.distinct(Fasilitas.nama)) == len(set(fasilitas)))
        )
        stmt = stmt.where(RuangPublik.id.in_(subq))

    if jarak is not None:
        stmt = stmt.order_by(jarak)
    else:
        stmt = stmt.order_by(RuangPublik.nama)

    stmt = stmt.offset(skip).limit(limit)

    if jarak is None:
        return [(row, None) for row in db.scalars(stmt).unique().all()]

    stmt = stmt.add_columns(jarak.label("jarak_km"))
    return [(row[0], float(row[1])) for row in db.execute(stmt).unique().all()]


def get_ruang_publik(db: Session, ruang_publik_id: str) -> Optional[RuangPublik]:
    stmt = (
        select(RuangPublik)
        .options(joinedload(RuangPublik.kategori), joinedload(RuangPublik.fasilitas))
        .where(RuangPublik.id == ruang_publik_id)
    )
    return db.scalars(stmt).unique().first()


def list_fasilitas(db: Session) -> list[tuple[str, Optional[str]]]:
    """Daftar fasilitas unik untuk populate filter di FE."""
    stmt = (
        select(Fasilitas.nama, Fasilitas.kategori)
        .distinct()
        .order_by(Fasilitas.nama)
    )
    return [(nama, kategori) for nama, kategori in db.execute(stmt).all()]


def get_public_spaces_stats(db: Session) -> dict:
    """Ringkasan metrik ruang publik untuk halaman daftar.

    `status_prima` menghitung fasilitas berstatus "baik" saja; NULL tidak
    dihitung sebagai baik. `perlu_perhatian` adalah kebalikannya: semua yang
    bukan "baik", termasuk yang NULL, jadi query-nya harus menangkap NULL
    secara eksplisit karena `status != "baik"` saja tidak menyertakannya.
    """
    total_ruang_publik = db.query(RuangPublik).count()

    status_prima = (
        db.query(Fasilitas)
        .filter(Fasilitas.status == "baik")
        .count()
    )

    perlu_perhatian = (
        db.query(Fasilitas)
        .filter(or_(Fasilitas.status != "baik", Fasilitas.status.is_(None)))
        .count()
    )

    return {
        "total_ruang_publik": total_ruang_publik,
        "status_prima": status_prima,
        "perlu_perhatian": perlu_perhatian,
    }