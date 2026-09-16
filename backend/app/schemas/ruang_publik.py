from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.category import CategoryResponse

class RuangPublikBase(BaseModel):
    nama: str
    kategori_id: Optional[str] = None
    wilayah: Optional[str] = None
    alamat: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    deskripsi: Optional[str] = None
    jam_operasional: Optional[str] = None
    tiket_masuk: Optional[str] = None
    akses_disabilitas: Optional[str] = None
    ramah_hewan: Optional[str] = None
    verified: Optional[bool] = False
    status_general: Optional[str] = None
    image_url: Optional[str] = None

class RuangPublikCreate(RuangPublikBase):
    pass

class RuangPublikUpdate(RuangPublikBase):
    nama: Optional[str] = None

class RuangPublikResponse(RuangPublikBase):
    id: str
    created_at: datetime
    updated_at: datetime
    kategori: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
