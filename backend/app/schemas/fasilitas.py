from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FasilitasBase(BaseModel):
    ruang_publik_id: str
    nama: str
    kategori: Optional[str] = None
    status: Optional[str] = "baik"
    lokasi_spesifik: Optional[str] = None
    deskripsi: Optional[str] = None

class FasilitasCreate(FasilitasBase):
    pass

class FasilitasUpdate(BaseModel):
    nama: Optional[str] = None
    kategori: Optional[str] = None
    status: Optional[str] = None
    lokasi_spesifik: Optional[str] = None
    deskripsi: Optional[str] = None

class FasilitasResponse(FasilitasBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
