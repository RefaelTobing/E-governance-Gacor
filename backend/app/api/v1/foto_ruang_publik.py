from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.file_upload import save_upload_file
from app.models.ruang_publik import RuangPublik
from app.models.ruang_publik_foto import RuangPublikFoto
from app.models.user import User
from app.schemas.ruang_publik import RuangPublikFotoResponse
from app.services import ruang_publik as crud_ruang_publik

admin_router = APIRouter()


def _wajib_ada(db: Session, ruang_publik_id: str) -> RuangPublik:
    ruang = crud_ruang_publik.get_ruang_publik(db, ruang_publik_id)
    if ruang is None:
        raise HTTPException(status_code=404, detail="Ruang publik tidak ditemukan")
    return ruang


def _foto_wajib_ada(db: Session, ruang_publik_id: str, foto_id: str) -> RuangPublikFoto:
    foto = db.get(RuangPublikFoto, foto_id)
    if foto is None or foto.ruang_publik_id != ruang_publik_id:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    return foto


@admin_router.get("/{ruang_publik_id}/photos", response_model=list[RuangPublikFotoResponse])
def list_photos(
    ruang_publik_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Daftar foto resmi (tabel ruang_publik_foto), bukan foto laporan."""
    _wajib_ada(db, ruang_publik_id)
    return crud_ruang_publik.list_foto_resmi(db, ruang_publik_id)


@admin_router.post(
    "/{ruang_publik_id}/photos",
    response_model=RuangPublikFotoResponse,
    status_code=201,
)
def upload_photo(
    ruang_publik_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Unggah satu gambar; disimpan ke folder uploads/ruang-publik."""
    _wajib_ada(db, ruang_publik_id)
    foto_url = save_upload_file(file, "ruang-publik")
    return crud_ruang_publik.tambah_foto(db, ruang_publik_id, foto_url)


@admin_router.delete(
    "/{ruang_publik_id}/photos/{foto_id}",
    response_model=RuangPublikFotoResponse,
)
def delete_photo(
    ruang_publik_id: str,
    foto_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Hapus satu foto resmi. File di disk dibiarkan agar laporan yang
    kebetulan menunjuk path yang sama tidak rusak."""
    _wajib_ada(db, ruang_publik_id)
    foto = _foto_wajib_ada(db, ruang_publik_id, foto_id)
    hasil = RuangPublikFotoResponse.model_validate(foto, from_attributes=True)
    crud_ruang_publik.hapus_foto(db, foto)
    return hasil
