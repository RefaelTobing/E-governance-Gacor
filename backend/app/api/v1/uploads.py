from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import oauth2_scheme_optional
from app.core.file_upload import save_upload_file
from app.schemas.upload import UploadResponse

router = APIRouter()


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_foto(
    file: UploadFile = File(...),
    _token: Optional[str] = Depends(oauth2_scheme_optional),
):
    """Unggah satu foto bukti. Publik: laporan anonim boleh mengunggah tanpa token."""
    url = save_upload_file(file, "laporan")
    return UploadResponse(url=url)
