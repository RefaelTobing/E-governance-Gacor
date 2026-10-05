import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]


def _deteksi_ekstensi(header: bytes) -> str | None:
    """Kenali tipe file dari magic bytes. Bukan dari nama/konten kiriman,
    karena keduanya bisa dipalsukan (mis. teks ber-ekstensi .jpg)."""
    if header[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if header[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return ".webp"
    return None


def validate_image_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file tidak diizinkan. Harap upload gambar (JPEG, PNG, WEBP)."
        )

    # Validasi ukuran file
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > settings.MAX_UPLOAD_SIZE:
        max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ukuran file melebihi batas maksimal {max_size_mb:.0f}MB."
        )

    header = file.file.read(12)
    file.file.seek(0)
    if _deteksi_ekstensi(header) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Isi file bukan gambar asli (magic bytes tidak cocok)."
        )

def save_upload_file(file: UploadFile, subfolder: str) -> str:
    """
    Menyimpan file ke folder yang ditentukan dan mengembalikan path relatif-nya
    (misal: /uploads/laporan/namafile.jpg)
    """
    validate_image_upload(file)

    # Ekstensi mengikuti isi file, bukan nama kiriman.
    header = file.file.read(12)
    file.file.seek(0)
    ext = _deteksi_ekstensi(header) or ".jpg"
    unique_filename = f"{uuid4().hex}{ext}"

    # Direktori tujuan: misal storage/laporan
    dest_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(dest_dir, exist_ok=True)

    # Path absolut untuk menyimpan file
    file_path = os.path.join(dest_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Return path publik yang bisa diakses via web
    return f"/uploads/{subfolder}/{unique_filename}"
