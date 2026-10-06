from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.laporan_timeline import LaporanTimelineResponse
from app.schemas.user import UserResponse

STATUS_KANONIK = (
    "menunggu_verifikasi",
    "diverifikasi",
    "dalam_penanganan",
    "selesai",
    "ditolak",
)
STATUS_TAYANG = ("diverifikasi", "dalam_penanganan", "selesai")


class LaporanBase(BaseModel):
    user_id: Optional[str] = None
    ruang_publik_id: str
    fasilitas_id: Optional[str] = None
    jenis_masalah: Optional[str] = None
    deskripsi: str
    mode_identitas: Optional[str] = "tampilkan_nama"
    nama_pelapor: Optional[str] = None
    foto_url: Optional[str] = None
    # Rentang dicek di sini (422); pasangan lengkap lat+long dicek di service (400).
    lat_user: Optional[float] = Field(None, ge=-90, le=90)
    long_user: Optional[float] = Field(None, ge=-180, le=180)

class LaporanCreate(LaporanBase):
    pass

class LaporanUpdate(BaseModel):
    status: Optional[str] = None
    jenis_masalah: Optional[str] = None
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None

class LaporanStatusUpdate(BaseModel):
    status: str
    title: Optional[str] = "Status diperbarui"
    description: Optional[str] = None

class LaporanResponse(LaporanBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    ruang_publik_nama: Optional[str] = None
    wilayah: Optional[str] = None
    fasilitas_nama: Optional[str] = None
    # EXIF tidak pernah datang dari klien; hanya dibaca dari file saat upload (BE-21).
    lat_exif: Optional[float] = None
    long_exif: Optional[float] = None
    jarak_browser_rp: Optional[float] = None
    jarak_exif_rp: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class LaporanDetailResponse(LaporanResponse):
    user: Optional[UserResponse] = None
    timeline: List[LaporanTimelineResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
