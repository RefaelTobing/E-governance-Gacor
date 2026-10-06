from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class FasilitasBase(BaseModel):
    ruang_publik_id: str
    nama: str
    kategori: Optional[str] = None
    status: Optional[str] = "baik"
    deskripsi: Optional[str] = None

class FasilitasCreate(FasilitasBase):
    pass

class FasilitasUpdate(BaseModel):
    nama: Optional[str] = None
    kategori: Optional[str] = None
    status: Optional[str] = None
    deskripsi: Optional[str] = None

class FasilitasResponse(FasilitasBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FasilitasFilterOption(BaseModel):
    nama: str
    kategori: Optional[str] = None


class FasilitasRingkas(BaseModel):
    """Baris fasilitas untuk daftar ruang publik.

    Hanya tiga field yang dipakai chip dan badge di FE. Respons daftar
    memuat 1200 baris per tarikan, jadi `deskripsi`/`created_at` sengaja
    tidak ikut.
    """

    id: str
    nama: str
    status: Optional[str] = "baik"


# Satu-satunya nilai status yang boleh disimpan, supaya badge di FE dan
# hitungan statistik selalu punya arti. Ditulis bebas di CSV, dinormalkan di service.
STATUS_FASILITAS = ("baik", "perlu_perhatian", "rusak")


class AdminFasilitasResponse(FasilitasResponse):
    """Baris tabel Kelola Fasilitas: fasilitas plus nama induknya."""

    ruang_publik_nama: str
    wilayah: Optional[str] = None


class RowImportError(BaseModel):
    baris: int
    pesan: str


class FacilitiesImportResult(BaseModel):
    created: int
    failed: int
    errors: list[RowImportError] = []
