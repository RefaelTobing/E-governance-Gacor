from pydantic import BaseModel, ConfigDict, Field, field_validator
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

# Transisi status yang diizinkan pada PATCH /reports/{id}/status (BE-51).
# Tujuan: cegah lompatan mundur yang merusak stepper/badge FE, sambil tetap
# membuka alur nyata yang dipakai FE (termasuk tolak via PATCH selama FE-25B
# belum pindah ke endpoint reject). Status sama (idempotent) selalu boleh.
TRANSISI_IZIN = {
    "menunggu_verifikasi": {"menunggu_verifikasi", "diverifikasi", "dalam_penanganan", "selesai", "ditolak"},
    "diverifikasi": {"diverifikasi", "dalam_penanganan", "selesai", "ditolak"},
    "dalam_penanganan": {"dalam_penanganan", "selesai", "ditolak"},
    "selesai": {"selesai", "ditolak"},
    # Laporan ditolak boleh ditinjau ulang (approve BE-29), jadi diverifikasi diizinkan.
    "ditolak": {"ditolak", "diverifikasi"},
}


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
    # Titik presisi fasilitas yang dipilih warga pada peta (bukan lokasi HP).
    lat_lokasi_pilihan: Optional[float] = Field(None, ge=-90, le=90)
    long_lokasi_pilihan: Optional[float] = Field(None, ge=-180, le=180)

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

    @field_validator("status")
    @classmethod
    def _status_kanonik(cls, v: str) -> str:
        """BE-51: tolak status di luar kamus kanonik -> 422, dengan pesan berisi
        daftar nilai sah supaya pemanggil API tahu nilai yang benar."""
        if v not in STATUS_KANONIK:
            raise ValueError(
                f"Status tidak dikenal: '{v}'. Nilai yang sah: {', '.join(STATUS_KANONIK)}."
            )
        return v

class LaporanApproveRequest(BaseModel):
    """Body opsional approve (BE-29): catatan petugas untuk timeline persetujuan."""

    description: Optional[str] = None


class LaporanRejectRequest(BaseModel):
    """Body reject (BE-30): alasan wajib, disimpan di kolom `alasan_penolakan`."""

    alasan: str

    @field_validator("alasan")
    @classmethod
    def _alasan_tidak_kosong(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Alasan penolakan wajib diisi.")
        return v

class LaporanResponse(LaporanBase):
    id: str
    status: str
    alasan_penolakan: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ruang_publik_nama: Optional[str] = None
    wilayah: Optional[str] = None
    fasilitas_nama: Optional[str] = None
    # EXIF tidak pernah datang dari klien; hanya dibaca dari file saat upload (BE-21).
    lat_exif: Optional[float] = None
    long_exif: Optional[float] = None
    lat_lokasi_pilihan: Optional[float] = None
    long_lokasi_pilihan: Optional[float] = None
    jarak_browser_rp: Optional[float] = None
    jarak_exif_rp: Optional[float] = None
    # Hanya diisi endpoint daftar flagged admin (BE-31); jalur publik tetap None.
    flag_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class LaporanDetailResponse(LaporanResponse):
    user: Optional[UserResponse] = None
    timeline: List[LaporanTimelineResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class LaporanStatusResponse(BaseModel):
    """Status untuk pelapor (BE-24). Sengaja tidak memuat deskripsi, foto, maupun
    nama pelapor: jalur laporan anonim dibuka hanya dengan bukti kepemilikan id."""

    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    timeline: List[LaporanTimelineResponse] = []

    model_config = ConfigDict(from_attributes=True)


class LaporanFlagResponse(BaseModel):
    """Hasil flag laporan tayang (BE-25). flag_count = jumlah pelapor berbeda."""

    laporan_id: str
    flag_count: int
