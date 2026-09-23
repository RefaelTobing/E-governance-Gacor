from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.fasilitas import FasilitasFilterOption
from app.services import ruang_publik as crud_ruang_publik

router = APIRouter()


@router.get("", response_model=List[FasilitasFilterOption])
def read_facilities(db: Session = Depends(get_db)):
    """Daftar fasilitas unik untuk populate filter fasilitas di FE."""
    return [
        FasilitasFilterOption(nama=nama, kategori=kategori)
        for nama, kategori in crud_ruang_publik.list_fasilitas(db)
    ]