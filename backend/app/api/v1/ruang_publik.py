from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ruang_publik import RuangPublikListResponse
from app.services import ruang_publik as crud_ruang_publik

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
        skip=skip,
        limit=limit,
    )
    return [
        RuangPublikListResponse.model_validate(ruang, from_attributes=True).model_copy(
            update={"jarak_km": jarak}
        )
        for ruang, jarak in hasil
    ]