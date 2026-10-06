import csv
import io
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.fasilitas import Fasilitas
from app.models.user import User
from app.schemas.fasilitas import (
    STATUS_FASILITAS,
    AdminFasilitasResponse,
    FacilitiesImportResult,
    FasilitasCreate,
    FasilitasFilterOption,
    FasilitasUpdate,
)
from app.services import ruang_publik as crud_ruang_publik

MAX_IMPORT_BYTES = 1024 * 1024
MAX_IMPORT_ROWS = 2000

router = APIRouter()
admin_router = APIRouter()


@router.get("", response_model=List[FasilitasFilterOption])
def read_facilities(db: Session = Depends(get_db)):
    """Daftar fasilitas unik untuk populate filter fasilitas di FE."""
    return [
        FasilitasFilterOption(nama=nama, kategori=kategori)
        for nama, kategori in crud_ruang_publik.list_fasilitas(db)
    ]


# Endpoint di bawah ini khusus admin panel (halaman /dashboard/fasilitas).

@admin_router.get("", response_model=List[AdminFasilitasResponse])
def list_fasilitas(
    q: Optional[str] = None,
    kategori: Optional[str] = None,
    status: Optional[str] = None,
    wilayah: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Semua baris fasilitas beserta nama ruang publik induknya."""
    rows = crud_ruang_publik.list_fasilitas_admin(
        db, q=q, kategori=kategori, status=status, wilayah=wilayah, skip=skip, limit=limit
    )
    return [_tampilan(fas) for fas in rows]


@admin_router.post("", response_model=AdminFasilitasResponse, status_code=201)
def create_fasilitas(
    payload: FasilitasCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if crud_ruang_publik.get_ruang_publik(db, payload.ruang_publik_id) is None:
        raise HTTPException(status_code=404, detail="Ruang publik tidak ditemukan")

    data = _bersihkan(payload.model_dump())
    fas = crud_ruang_publik.create_fasilitas(db, {**data, "ruang_publik_id": payload.ruang_publik_id})
    return _tampilan(fas)


@admin_router.patch("/{fasilitas_id}", response_model=AdminFasilitasResponse)
def update_fasilitas(
    fasilitas_id: str,
    payload: FasilitasUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    fas = crud_ruang_publik.get_fasilitas(db, fasilitas_id)
    if fas is None:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    data = _bersihkan(payload.model_dump(exclude_unset=True))
    fas = crud_ruang_publik.update_fasilitas(db, fas, FasilitasUpdate(**data))
    return _tampilan(fas)


@admin_router.delete("/{fasilitas_id}", response_model=AdminFasilitasResponse)
def delete_fasilitas(
    fasilitas_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Hapus permanen. Laporan warga menunjuk ke fasilitas, jadi baris yang
    masih direferensikan ditolak 409 alih-alih ikut terhapus."""
    fas = crud_ruang_publik.get_fasilitas(db, fasilitas_id)
    if fas is None:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    if crud_ruang_publik.count_laporan_fasilitas(db, fas):
        raise HTTPException(
            status_code=409,
            detail="Fasilitas masih menjadi rujukan laporan warga dan tidak bisa dihapus.",
        )

    hasil = _tampilan(fas)
    crud_ruang_publik.delete_fasilitas(db, fas)
    return hasil


@admin_router.post("/import", response_model=FacilitiesImportResult)
def import_fasilitas(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Impor massal dari CSV.

    Baris valid disimpan, baris rusak dikembalikan beserta nomor barisnya, jadi
    admin bisa memperbaiki berkas tanpa mengulang dari nol.
    """
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Berkas harus berformat .csv")

    isi = file.file.read(MAX_IMPORT_BYTES + 1)
    if len(isi) > MAX_IMPORT_BYTES:
        raise HTTPException(status_code=400, detail="Ukuran berkas melebihi 1MB")

    try:
        teks = isi.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Berkas harus CSV teks ber-encoding UTF-8")

    reader = csv.DictReader(io.StringIO(teks))
    kolom = set(reader.fieldnames or [])
    if "nama" not in kolom:
        raise HTTPException(status_code=400, detail='Header wajib punya kolom "nama"')
    if not {"ruang_publik_id", "ruang_publik_nama"} & kolom:
        raise HTTPException(
            status_code=400,
            detail='Header wajib punya kolom "ruang_publik_id" atau "ruang_publik_nama"',
        )

    baris = list(reader)
    if not baris:
        raise HTTPException(status_code=400, detail="Berkas tidak berisi baris data")
    if len(baris) > MAX_IMPORT_ROWS:
        raise HTTPException(
            status_code=400, detail=f"Maksimal {MAX_IMPORT_ROWS} baris per berkas"
        )

    return FacilitiesImportResult(**crud_ruang_publik.import_fasilitas_csv(db, baris))


def _bersihkan(data: dict) -> dict:
    """Rapikan dan validasi field yang benar-benar dikirim klien.

    `exclude_unset=True` dipertahankan saat dipanggil dari PATCH supaya field
    yang tidak dikirim tidak ikut divalidasi apalagi ditimpa.
    """
    if "nama" in data:
        data["nama"] = (data["nama"] or "").strip()
        if not data["nama"]:
            raise HTTPException(status_code=400, detail="Nama fasilitas wajib diisi")
        if len(data["nama"]) > 255:
            raise HTTPException(status_code=400, detail="Nama fasilitas maksimal 255 karakter")
    if "kategori" in data:
        data["kategori"] = (data["kategori"] or "").strip() or None
        if data["kategori"] and len(data["kategori"]) > 100:
            raise HTTPException(status_code=400, detail="Kategori maksimal 100 karakter")
    if "deskripsi" in data:
        data["deskripsi"] = (data["deskripsi"] or "").strip() or None
    if "status" in data:
        data["status"] = crud_ruang_publik.normalisasi_status(data["status"])
        if data["status"] not in STATUS_FASILITAS:
            raise HTTPException(
                status_code=400,
                detail=f"Status tidak dikenal, pilih salah satu: {', '.join(STATUS_FASILITAS)}",
            )
    return data


def _tampilan(fas: Fasilitas) -> AdminFasilitasResponse:
    """Baris respons tabel admin: fasilitas plus nama & wilayah induknya."""
    return AdminFasilitasResponse(
        id=fas.id,
        ruang_publik_id=fas.ruang_publik_id,
        nama=fas.nama,
        kategori=fas.kategori,
        status=fas.status,
        deskripsi=fas.deskripsi,
        created_at=fas.created_at,
        updated_at=fas.updated_at,
        ruang_publik_nama=fas.ruang_publik.nama if fas.ruang_publik else "",
        wilayah=fas.ruang_publik.wilayah if fas.ruang_publik else None,
    )
