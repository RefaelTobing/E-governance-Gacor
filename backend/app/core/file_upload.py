import io
import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException, status
from PIL import Image
from supabase import create_client, Client
from app.core.config import settings

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]

# Semua gambar disimpan sebagai WebP agar ringan. q82 cukup untuk foto bukti
# laporan tanpa penurunan yang terlihat.
WEBP_QUALITY = 82
WEBP_METHOD = 6


def _webp_dari(data: bytes) -> bytes:
    """Normalkan gambar (JPEG/PNG) ke WebP.

    EXIF dipertahankan supaya ekstraksi GPS bukti laporan (BE-23) tetap bekerja -
    tanpa ini, koordinat EXIF hilang saat transcoding.
    """
    try:
        with Image.open(io.BytesIO(data)) as img:
            exif = img.info.get("exif")
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            keluaran = io.BytesIO()
            opsi = {"format": "WEBP", "quality": WEBP_QUALITY, "method": WEBP_METHOD}
            if exif:
                opsi["exif"] = exif
            img.save(keluaran, **opsi)
            return keluaran.getvalue()
    except Exception as exc:  # noqa: BLE001 - semua kegagalan decode -> 400
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File gambar tidak dapat diproses (isi rusak atau bukan gambar).",
        ) from exc


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

_supabase: Client | None = None


def get_supabase() -> Client:
    """Client Supabase singleton (service_role; melewati RLS untuk upload)."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase


def _nama_bucket(subfolder: str) -> str:
    return getattr(settings, f"SUPABASE_STORAGE_BUCKET_{subfolder.upper().replace('-', '_')}")


def save_upload_file(file: UploadFile, subfolder: str) -> str:
    """Simpan file dan kembalikan URL yang bisa dipakai sebagai foto_url.

    Gambar dinormalkan ke WebP (JPEG/PNG ditranscoding via Pillow, EXIF
    dipertahankan). Bila `SUPABASE_URL` diisi, file diunggah ke Supabase Storage
    dan hasilnya public URL absolut. Bila kosong (mis. saat unit test), file
    ditulis ke filesystem lokal dan hasilnya path relatif `/uploads/...` seperti
    semula. `subfolder` menentukan bucket/target: "laporan" atau "ruang-publik".
    """
    validate_image_upload(file)

    # Ekstensi mengikuti isi file, bukan nama kiriman.
    header = file.file.read(12)
    file.file.seek(0)
    ext = _deteksi_ekstensi(header) or ".jpg"
    data = file.file.read()

    # Semua unggahan disimpan sebagai WebP. WebP yang sudah WebP diteruskan apa
    # adanya agar kualitas tidak turun karena re-encode.
    if ext != ".webp":
        data = _webp_dari(data)

    unique_filename = f"{uuid4().hex}.webp"

    if settings.SUPABASE_URL:
        bucket = _nama_bucket(subfolder)
        supabase = get_supabase()
        supabase.storage.from_(bucket).upload(
            path=unique_filename,
            file=data,
            file_options={"content-type": "image/webp", "upsert": "true"},
        )
        return supabase.storage.from_(bucket).get_public_url(unique_filename)

    # Fallback lokal (tanpa Supabase): simpan di UPLOAD_DIR/<subfolder>.
    dest_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(dest_dir, exist_ok=True)
    with open(os.path.join(dest_dir, unique_filename), "wb") as buffer:
        buffer.write(data)
    return f"/uploads/{subfolder}/{unique_filename}"
