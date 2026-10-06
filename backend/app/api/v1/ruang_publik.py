from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ruang_publik import RuangPublikDetailResponse, RuangPublikListResponse
from app.schemas.laporan import LaporanResponse
from app.services import ruang_publik as crud_ruang_publik
from app.services import laporan as crud_laporan

router = APIRouter()


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
def read_public_spaces_stats(db: Session = Depends(get_db)):
    """Ringkasan metrik ruang publik untuk halaman daftar.

    Dideklarasikan sebelum route /{ruang_publik_id} agar path "/stats" tidak
    tertangkap sebagai id ruang publik.
    """
    return crud_ruang_publik.get_public_spaces_stats(db)


@router.get("/{ruang_publik_id}", response_model=RuangPublikDetailResponse)
def read_public_space(ruang_publik_id: str, db: Session = Depends(get_db)):
    """Detail satu ruang publik beserta fasilitas dan foto resminya."""
    ruang = crud_ruang_publik.get_ruang_publik(db, ruang_publik_id)
    if ruang is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruang publik tidak ditemukan",
        )

    # image_url masih satu kolom tunggal di sumber data; dibungkus jadi list
    # supaya FE bisa merender galeri tanpa perubahan kontrak saat foto bertambah.
    foto = [ruang.image_url] if ruang.image_url else []
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