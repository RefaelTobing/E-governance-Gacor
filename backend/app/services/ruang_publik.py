from typing import Optional, Sequence

from sqlalchemy import func, select
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