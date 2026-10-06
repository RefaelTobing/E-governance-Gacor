from typing import Optional, Sequence

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, contains_eager, joinedload, selectinload

from app.models.base import utcnow
from app.models.fasilitas import Fasilitas
from app.models.laporan import Laporan
from app.models.ruang_publik import RuangPublik
from app.models.ruang_publik_foto import RuangPublikFoto
from app.schemas.fasilitas import STATUS_FASILITAS, FasilitasUpdate
from app.schemas.laporan import STATUS_TAYANG

# Radius bumi rata-rata dalam km, dipakai rumus Haversine.
EARTH_RADIUS_KM = 6371.0


def _haversine_km(lat: float, lng: float):
    # Haversine dihitung di SQL supaya penyaringan radius dan pengurutan jarak
    # terjadi di database, bukan setelah semua baris ditarik ke Python.
    lat_rad = func.radians(lat)
    lng_rad = func.radians(lng)
    haversine_mid = (
        func.cos(lat_rad)
        * func.cos(func.radians(RuangPublik.latitude))
        * func.cos(func.radians(RuangPublik.longitude) - lng_rad)
        + func.sin(lat_rad) * func.sin(func.radians(RuangPublik.latitude))
    )
    # case() menggantikan func.least(1.0, ...): MySQL punya LEAST, SQLite tidak,
    # jadi pembatasan kosinus 1.0 diungkap sebagai percabangan portabel.
    return EARTH_RADIUS_KM * func.acos(
        case(
            (haversine_mid > 1.0, 1.0),
            else_=haversine_mid,
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

    # selectinload, bukan joinedload, untuk fasilitas: joinedload koleksi
    # berpadu dengan LIMIT sehingga baris page terpotong di tengah eager load.
    stmt = (
        select(RuangPublik)
        .options(joinedload(RuangPublik.kategori), selectinload(RuangPublik.fasilitas))
    )

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
            (RuangPublik.alamat.ilike(search_pattern)) |
            (RuangPublik.wilayah.ilike(search_pattern))
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


def hitung_status_fasilitas(baris: Sequence[Fasilitas]) -> dict[str, int]:
    """Tiga ember kondisi yang saling lepas, jadi jumlahnya selalu = total baris.

    Nilai di luar kamus dan NULL masuk `perlu_perhatian`; mengabaikannya membuat
    badge di FE menjumlah lebih kecil dari data yang sebenarnya ada.
    """
    hasil = {"baik": 0, "perlu_perhatian": 0, "rusak": 0}
    for fas in baris:
        kunci = fas.status if fas.status in ("baik", "rusak") else "perlu_perhatian"
        hasil[kunci] += 1
    return hasil


def get_ruang_publik(db: Session, ruang_publik_id: str) -> Optional[RuangPublik]:
    stmt = (
        select(RuangPublik)
        .options(joinedload(RuangPublik.kategori), joinedload(RuangPublik.fasilitas))
        .where(RuangPublik.id == ruang_publik_id)
    )
    return db.scalars(stmt).unique().first()


def list_foto_resmi(db: Session, ruang_publik_id: str) -> list[RuangPublikFoto]:
    """Baris foto resmi urut paling tua dulu; `id` sebagai pemecah seri."""
    stmt = (
        select(RuangPublikFoto)
        .where(RuangPublikFoto.ruang_publik_id == ruang_publik_id)
        .order_by(RuangPublikFoto.created_at.asc(), RuangPublikFoto.id.asc())
    )
    return list(db.scalars(stmt).all())


def tambah_foto(db: Session, ruang_publik_id: str, foto_url: str) -> RuangPublikFoto:
    foto = RuangPublikFoto(ruang_publik_id=ruang_publik_id, foto_url=foto_url)
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto


def hapus_foto(db: Session, foto: RuangPublikFoto) -> None:
    db.delete(foto)
    db.commit()


def gabung_foto(db: Session, ruang_publik: RuangPublik) -> list[str]:
    """Galeri publik: foto resmi + foto laporan yang sudah tayang, tanpa duplikat.

    Urutan stabil agar halaman FE tidak berpindah-pindah antar request:
    foto resmi terlama lebih dulu (dengan `image_url` bila berubah setelah
    backfill, diselipkan paling depan), lalu laporan tayang terbaru lebih dulu.
    """
    resmi = [foto.foto_url for foto in list_foto_resmi(db, ruang_publik.id)]

    # image_url bisa diperbarui sumber data tanpa lewat tabel foto, jadi
    # tampilkan sebagai foto pertama bila belum ada barisnya.
    if ruang_publik.image_url and ruang_publik.image_url not in resmi:
        resmi.insert(0, ruang_publik.image_url)

    laporan_stmt = (
        select(Laporan.foto_url)
        .where(
            Laporan.ruang_publik_id == ruang_publik.id,
            Laporan.status.in_(STATUS_TAYANG),
            Laporan.foto_url.isnot(None),
            Laporan.foto_url != "",
        )
        .order_by(Laporan.created_at.desc(), Laporan.id.asc())
    )
    tayang = list(db.scalars(laporan_stmt).all())

    terlihat: set[str] = set()
    hasil: list[str] = []
    for url in resmi + tayang:
        if url not in terlihat:
            terlihat.add(url)
            hasil.append(url)
    return hasil


def list_fasilitas(db: Session) -> list[tuple[str, Optional[str]]]:
    """Daftar fasilitas unik untuk populate filter di FE."""
    stmt = (
        select(Fasilitas.nama, Fasilitas.kategori)
        .distinct()
        .order_by(Fasilitas.nama)
    )
    return [(nama, kategori) for nama, kategori in db.execute(stmt).all()]


def list_fasilitas_admin(
    db: Session,
    q: Optional[str] = None,
    kategori: Optional[str] = None,
    status: Optional[str] = None,
    wilayah: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Fasilitas]:
    """Semua baris fasilitas untuk tabel Kelola Fasilitas, termasuk nama induknya.

    Diurutkan dari yang terbaru dibuat, dengan `id` sebagai pemecah seri supaya
    halaman FE yang menarik data per-batch tidak melewatkan atau mengulang baris.
    """
    # Join eksplisit, bukan joinedload: filter di bawah mereferensikan kolom
    # RuangPublik, dan tanpa join eksplisit SQLAlchemy memasukkannya sebagai
    # FROM tambahan tanpa ON (cartesian product).
    stmt = (
        select(Fasilitas)
        .join(Fasilitas.ruang_publik)
        .options(contains_eager(Fasilitas.ruang_publik))
    )

    if q:
        pola = f"%{q}%"
        stmt = stmt.where(
            or_(
                Fasilitas.nama.ilike(pola),
                RuangPublik.nama.ilike(pola),
            )
        )

    if kategori:
        stmt = stmt.where(Fasilitas.kategori == kategori)

    if status:
        stmt = stmt.where(Fasilitas.status == status)

    if wilayah:
        stmt = stmt.where(RuangPublik.wilayah == wilayah)

    stmt = (
        stmt.order_by(Fasilitas.created_at.desc(), Fasilitas.id)
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).unique().all())


def get_fasilitas(db: Session, fasilitas_id: str) -> Optional[Fasilitas]:
    stmt = (
        select(Fasilitas)
        .options(joinedload(Fasilitas.ruang_publik))
        .where(Fasilitas.id == fasilitas_id)
    )
    return db.scalars(stmt).unique().first()


def normalisasi_status(value: Optional[str]) -> str:
    """Petakan input bebas ke salah satu `STATUS_FASILITAS`; kosong = baik."""
    kandidat = (value or "").strip().lower().replace(" ", "_")
    return kandidat or "baik"


def create_fasilitas(db: Session, payload: dict) -> Fasilitas:
    fasilitas = Fasilitas(**payload)
    db.add(fasilitas)
    db.commit()
    db.refresh(fasilitas)
    return fasilitas


def update_fasilitas(db: Session, fasilitas: Fasilitas, payload: FasilitasUpdate) -> Fasilitas:
    """Patch sebagian field: `None` di payload berarti "tidak diubah", bukan dikosongkan."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(fasilitas, field, value)
    db.commit()
    db.refresh(fasilitas)
    return fasilitas


def count_laporan_fasilitas(db: Session, fasilitas: Fasilitas) -> int:
    return len(fasilitas.laporan)


def delete_fasilitas(db: Session, fasilitas: Fasilitas) -> None:
    db.delete(fasilitas)
    db.commit()


def referensi_ruang_publik(db: Session) -> tuple[set[str], dict[str, tuple[str, int]]]:
    """(semua id ruang publik, peta nama huruf kecil -> (id, jumlah nama yang sama)).

    Dipakai impor CSV: admin mengisi nama, bukan id, jadi nama yang ganda harus
    terdeteksi di sini supaya barisnya ditolak, bukan ditempatkan ke induk yang salah.
    """
    semua_id: set[str] = set()
    peta: dict[str, tuple[str, int]] = {}
    for rp_id, rp_nama in db.execute(select(RuangPublik.id, RuangPublik.nama)).all():
        semua_id.add(rp_id)
        kunci = (rp_nama or "").strip().lower()
        if not kunci:
            continue
        id_pertama, jumlah = peta.get(kunci, (rp_id, 0))
        peta[kunci] = (id_pertama, jumlah + 1)
    return semua_id, peta


def import_fasilitas_csv(db: Session, baris: list[dict]) -> dict:
    """Validasi dan simpan baris CSV impor fasilitas.

    Baris rusak dilaporkan per baris dan baris valid tetap tersimpan, jadi satu
    typo tidak membatalkan seluruh berkas.
    """
    semua_id, peta = referensi_ruang_publik(db)
    created = 0
    errors: list[dict] = []

    for nomor, row in enumerate(baris, start=2):  # baris 1 = header
        nama = (row.get("nama") or "").strip()
        if not nama:
            errors.append({"baris": nomor, "pesan": "Nama fasilitas wajib diisi."})
            continue
        if len(nama) > 255:
            errors.append({"baris": nomor, "pesan": "Nama fasilitas maksimal 255 karakter."})
            continue

        rp_id = (row.get("ruang_publik_id") or "").strip()
        if rp_id:
            if rp_id not in semua_id:
                errors.append({"baris": nomor, "pesan": f"Ruang publik id {rp_id} tidak ditemukan."})
                continue
        else:
            kunci = (row.get("ruang_publik_nama") or "").strip().lower()
            cocok = peta.get(kunci)
            if cocok is None:
                errors.append({
                    "baris": nomor,
                    "pesan": f"Ruang publik \"{row.get('ruang_publik_nama') or ''}\" tidak ditemukan.",
                })
                continue
            if cocok[1] > 1:
                errors.append({
                    "baris": nomor,
                    "pesan": f"Nama ruang publik \"{row.get('ruang_publik_nama')}\" ganda, isi kolom ruang_publik_id.",
                })
                continue
            rp_id = cocok[0]

        status = normalisasi_status(row.get("status"))
        if status not in STATUS_FASILITAS:
            errors.append({
                "baris": nomor,
                "pesan": f"Status \"{row.get('status')}\" tidak dikenal, pilih salah satu: {', '.join(STATUS_FASILITAS)}.",
            })
            continue

        kategori = (row.get("kategori") or "").strip() or None
        if kategori and len(kategori) > 100:
            errors.append({"baris": nomor, "pesan": "Kategori maksimal 100 karakter."})
            continue

        db.add(Fasilitas(
            ruang_publik_id=rp_id,
            nama=nama,
            kategori=kategori,
            status=status,
            deskripsi=(row.get("deskripsi") or "").strip() or None,
        ))
        created += 1

    if created:
        db.commit()
    return {"created": created, "failed": len(errors), "errors": errors}


def get_public_spaces_stats(db: Session, q: Optional[str] = None) -> dict:
    """Ringkasan metrik ruang publik untuk halaman daftar.

    `status_prima` menghitung fasilitas berstatus "baik" saja; NULL tidak
    dihitung sebagai baik. `perlu_perhatian` adalah kebalikannya: semua yang
    bukan "baik", termasuk yang NULL, jadi query-nya harus menangkap NULL
    secara eksplisit karena `status != "baik"` saja tidak menyertakannya.

    `q` hanya menyaring `total_ruang_publik`. Hitungan fasilitas bersifat
    global dan tidak ikut disaring, karena pemakai statistik publik tidak
    pernah mengirim `q`.
    """
    total_stmt = db.query(func.count(RuangPublik.id))
    if q:
        pola = f"%{q}%"
        total_stmt = total_stmt.filter(
            or_(RuangPublik.nama.ilike(pola), RuangPublik.alamat.ilike(pola))
        )
    total_ruang_publik = total_stmt.scalar() or 0

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


KOLOM_BUKAN_DATA = {"id", "field_source", "created_at", "updated_at"}


def edited_fields(ruang_publik: RuangPublik) -> dict[str, str]:
    """Salinan penanda edit manual: {nama kolom: waktu edit ISO-8601}."""
    return dict(ruang_publik.field_source or {})


def is_edited_manually(ruang_publik: RuangPublik, field: str) -> bool:
    """True bila kolom ini pernah disunting admin, jadi ETL dilarang menimpanya."""
    return field in (ruang_publik.field_source or {})


def mark_fields_edited(
    db: Session, ruang_publik: RuangPublik, fields: Sequence[str]
) -> dict[str, str]:
    """Catat kolom yang baru saja diedit manual admin (FEAT-012).

    Dipanggil endpoint edit admin (task BE-33) supaya sinkronisasi ETL kelak
    (task BE-16) bisa membaca kolom mana yang sudah bukan milik sumber resmi.
    Kolom sistem (`id`, `created_at`, `updated_at`, `field_source`) ditolak.
    """
    dikenal = {kolom.name for kolom in RuangPublik.__table__.columns} - KOLOM_BUKAN_DATA
    salah = [field for field in fields if field not in dikenal]
    if salah:
        raise ValueError(f"Kolom tidak dikenal: {', '.join(sorted(salah))}")

    if not fields:
        return edited_fields(ruang_publik)

    penanda = edited_fields(ruang_publik)
    waktu = utcnow().isoformat()
    for field in fields:
        penanda[field] = waktu
    ruang_publik.field_source = penanda
    db.add(ruang_publik)
    db.commit()
    db.refresh(ruang_publik)
    return edited_fields(ruang_publik)