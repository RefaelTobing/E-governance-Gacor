from pydantic import BaseModel


class UploadResponse(BaseModel):
    """Hasil unggahan foto: path relatif yang langsung bisa dipakai sebagai foto_url."""
    url: str
