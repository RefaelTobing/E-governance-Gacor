from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.category import Category
from app.models.ruang_publik import RuangPublik
from app.models.user import User
from app.schemas.ruang_publik import (
    AdminRuangPublikResponse,
    RuangPublikDetailResponse,
    RuangPublikListResponse,
    RuangPublikUpdate,
)
from app.schemas.laporan import LaporanResponse
from app.services import ruang_publik as crud_ruang_publik
from app.services import laporan as crud_laporan

router = APIRouter()
admin_router = APIRouter()


@router.get("", response_model=List[RuangPublikListResponse])
def read_public_spaces(
    lat: Optional[float] = Query(None, ge=-90, le=90, description="Lintang titik acuan"),
    long: Optional[float] = Query(None, ge=-180, le=180, description="Bujur titik acuan"),
    radius: Optional[float] = Query(None, gt=0, description="Radius pencarian dalam km"),
    category: Optional[str] = Query(None, description="Filter kategori_id"),
    facilities: Optional[List[str]] = Query(
        None, description="Filter fasilitas; semua yang diminta harus tersedia"
    ),
    q: Optional[str] = Query(None, description="Cari nama/alamat"),
    wilayah: Optional[str] = Query(None, description="Filter wilayah"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Daftar ruang publik, diurutkan jarak terdekat bila lat/long diberikan."""
    hasil = crud_ruang_publik.search_ruang_publik(
        db,
        lat=lat,
        lng=long,
        radius_km=radius,
        kategori_id=category,
        fasilitas=facilities,
        q=q,
        wilayah=wilayah,
        skip=skip,
        limit=limit,
    )
    return [
        RuangPublikListResponse.model_validate(ruang, from_attributes=True).model_copy(
            update={
                "jarak_km": jarak,
                "stats": crud_ruang_publik.hitung_status_fasilitas(ruang.fasilitas),
            }
        )
        for ruang, jarak in hasil
    ]


@router.get("/stats")
def read_public_spaces_stats(
    q: Optional[str] = Query(None, description="Saring total ruang publik berdasarkan nama/alamat"),
    db: Session = Depends(get_db),
):
    """Ringkasan metrik ruang publik untuk halaman daftar.

    Dideklarasikan sebelum route /{ruang_publik_id} agar path "/stats" tidak
    tertangkap sebagai id ruang publik.
    """
    return crud_ruang_publik.get_public_spaces_stats(db, q=q)


@router.get("/{ruang_publik_id}", response_model=RuangPublikDetailResponse)
def read_public_space(ruang_publik_id: str, db: Session = Depends(get_db)):
    """Detail satu ruang publik beserta fasilitas dan foto resminya."""
    ruang = crud_ruang_publik.get_ruang_publik(db, ruang_publik_id)
    if ruang is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruang publik tidak ditemukan",
        )

    # Galeri digabung dari tabel foto resmi + laporan tayang; `image_url` lama
    # ikut tampil lewat gabung_foto sehingga kontrak response tidak berubah.
    foto = crud_ruang_publik.gabung_foto(db, ruang)
    return RuangPublikDetailResponse.model_validate(ruang, from_attributes=True).model_copy(
        update={
            "foto": foto,
            "stats": crud_ruang_publik.hitung_status_fasilitas(ruang.fasilitas),
        }
    )


@router.get("/{ruang_publik_id}/reports", response_model=List[LaporanResponse])
def read_public_space_reports(
    ruang_publik_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Daftar laporan yang sudah tayang untuk satu ruang publik."""
    ruang = crud_ruang_publik.get_ruang_publik(db, ruang_publik_id)
    if ruang is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruang publik tidak ditemukan",
        )
    return crud_laporan.get_reports_by_ruang_publik(db, ruang_publik_id, skip=skip, limit=limit)


# Endpoint di bawah ini khusus Panel Admin (halaman /dashboard/data-master).

@admin_router.get("", response_model=List[AdminRuangPublikResponse])
def list_ruang_publik_admin(
    q: Optional[str] = Query(None, description="Cari nama/alamat/wilayah"),
    category: Optional[str] = Query(None, description="Filter kategori_id"),
    wilayah: Optional[str] = Query(None, description="Filter wilayah persis"),
    diedit_manual: Optional[bool] = Query(
        None, description="True hanya baris yang pernah diedit admin, False yang masih murni sumber"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Data master lengkap untuk admin, termasuk penanda kolom hasil edit manual."""
    rows = crud_ruang_publik.list_ruang_publik_admin(
        db,
        q=q,
        kategori_id=category,
        wilayah=wilayah,
        diedit_manual=diedit_manual,
        skip=skip,
        limit=limit,
    )
    return [_tampilan_ruang_admin(ruang) for ruang in rows]


@admin_router.patch("/{ruang_publik_id}", response_model=AdminRuangPublikResponse)
def update_ruang_publik(
    ruang_publik_id: str,
    payload: RuangPublikUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Edit manual ruang publik; tiap kolom yang diubah ditandai di `field_source`.

    Field yang tidak dikirim tidak berubah, dan `null` eksplisit juga diperlakukan
    sebagai "tidak diubah": MVP belum mengizinkan mengosongkan kolom lewat API.
    """
    ruang = crud_ruang_publik.get_ruang_publik(db, ruang_publik_id)
    if ruang is None:
        raise HTTPException(status_code=404, detail="Ruang publik tidak ditemukan")

    data = _bersihkan_ruang_publik(payload.model_dump(exclude_unset=True), db)
    ruang = crud_ruang_publik.update_ruang_publik_manual(db, ruang, data)
    return _tampilan_ruang_admin(ruang)


def _bersihkan_ruang_publik(data: dict, db: Session) -> dict:
    """Rapikan field yang dikirim klien; `null` eksplisit dibuang (tidak diubah)."""
    bersih = {}
    for field, value in data.items():
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if not value:
                # Nama wajib bermakna; kolom teks lain yang dikosongkan diabaikan.
                if field == "nama":
                    raise HTTPException(status_code=400, detail="Nama tidak boleh kosong")
                continue
        if field == "nama" and len(value) > 255:
            raise HTTPException(status_code=400, detail="Nama maksimal 255 karakter")
        if field in ("latitude", "longitude"):
            batas = 90 if field == "latitude" else 180
            if not -batas <= float(value) <= batas:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field} harus di antara -{batas} dan {batas}",
                )
        if field == "kategori_id" and db.get(Category, value) is None:
            raise HTTPException(
                status_code=404, detail=f"Kategori {value} tidak ditemukan"
            )
        bersih[field] = value
    return bersih


def _tampilan_ruang_admin(ruang: RuangPublik) -> AdminRuangPublikResponse:
    return AdminRuangPublikResponse.model_validate(ruang, from_attributes=True).model_copy(
        update={
            "jumlah_fasilitas": len(ruang.fasilitas),
            "stats": crud_ruang_publik.hitung_status_fasilitas(ruang.fasilitas),
        }
    )