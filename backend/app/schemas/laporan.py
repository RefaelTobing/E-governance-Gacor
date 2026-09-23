from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class LaporanBase(BaseModel):
    user_id: Optional[str] = None
    ruang_publik_id: str
    fasilitas_id: Optional[str] = None
    jenis_masalah: Optional[str] = None
    deskripsi: str
    mode_identitas: Optional[str] = "tampilkan_nama"
    nama_pelapor: Optional[str] = None
    foto_url: Optional[str] = None

class LaporanCreate(LaporanBase):
    pass

class LaporanUpdate(BaseModel):
    status: Optional[str] = None
    jenis_masalah: Optional[str] = None
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None

class LaporanResponse(LaporanBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
