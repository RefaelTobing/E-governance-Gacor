from pydantic import BaseModel, ConfigDict
from typing import Dict, Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.category import CategoryResponse
from app.schemas.fasilitas import FasilitasResponse, FasilitasRingkas

class RuangPublikBase(BaseModel):
    nama: str
    kategori_id: Optional[str] = None
    wilayah: Optional[str] = None
    kecamatan: Optional[str] = None
    kelurahan: Optional[str] = None
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
    field_source: Optional[Dict[str, str]] = None

    model_config = ConfigDict(from_attributes=True)

class RuangPublikListResponse(BaseModel):
    id: str
    nama: str
    kategori_id: Optional[str] = None
    kategori: Optional[CategoryResponse] = None
    wilayah: Optional[str] = None
    alamat: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    verified: Optional[bool] = False
    image_url: Optional[str] = None
    jarak_km: Optional[float] = None
    fasilitas: List[FasilitasRingkas] = []
    stats: Dict[str, int] = {}

    model_config = ConfigDict(from_attributes=True)

class FotoGaleriItem(BaseModel):
    """Satu foto galeri ruang publik beserta status like-nya.

    `sumber`: `laporan` (dokumentasi warga), `resmi` (unggahan admin/Satu Data),
    atau `utama` (kolom `image_url` lama yang belum punya baris foto).
    `liked_by_me` hanya terisi bila pemanggil membawa token.
    """

    url: str
    sumber: str
    like_count: int = 0
    liked_by_me: Optional[bool] = None


class RuangPublikDetailResponse(RuangPublikResponse):
    fasilitas: List[FasilitasResponse] = []
    foto: List[str] = []
    # FE-44 revisi: metadata per foto galeri (sumber + jumlah like) supaya
    # tombol hati tidak perlu menebak dari daftar laporan.
    foto_meta: List[FotoGaleriItem] = []
    stats: Dict[str, int] = {}


class FotoLikeRequest(BaseModel):
    """Body like foto galeri; URL harus benar-benar ada di galeri ruang publik."""

    foto_url: str


class FotoLikeResponse(BaseModel):
    """Hasil like/unlike foto galeri (BE-58 revisi).

    `liked_by_me` menyatakan keadaan setelah aksi: True setelah like,
    False setelah unlike. `like_count` = total like foto itu saat ini.
    """

    foto_url: str
    like_count: int
    liked_by_me: bool


class AdminRuangPublikResponse(RuangPublikResponse):
    """Baris tabel Data Master admin.

    `field_source` dari parent adalah penanda kolom hasil edit manual; `stats`
    memakai tiga ember yang sama dengan response publik supaya badge FE konsisten.
    """

    jumlah_fasilitas: int = 0
    stats: Dict[str, int] = {}


class RuangPublikFotoResponse(BaseModel):
    id: str
    ruang_publik_id: str
    foto_url: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
