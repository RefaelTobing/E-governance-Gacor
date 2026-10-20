# Migrasi Ruka Jakarta ke Supabase

Dokumen ini adalah checklist eksekusi untuk memindahkan backend Ruka Jakarta
dari **MySQL 8.0 (Docker lokal)** ke **Supabase Postgres**, sekaligus
memindahkan penyimpanan foto dari filesystem lokal ke **Supabase Storage**.

Auth tetap memakai JWT kustom (PyJWT + bcrypt) — tidak ada perubahan pada
alur login, role, atau token blacklist.

## Keputusan Arsitektur

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Database | MySQL 8.0 (Docker, `mysql+pymysql://...`) | Supabase Postgres via Connection Pooler (`postgresql+psycopg://...`) |
| Driver | `PyMySQL` | `psycopg` (v3) |
| Migrasi | 13 migration MySQL | 1 migration baru digenerate dari model |
| Data | Seed/ETL lokal | Di-regenerate ulang (bukan dimigrasi) |
| Storage | Filesystem `backend/storage/` + mount `/uploads` | Supabase Storage (SDK `supabase-py`) |
| Auth | JWT kustom + bcrypt | **Tidak berubah** |

> **Catatan data:** isi MySQL saat ini hanya hasil `seed_db` / ETL dari
> `data/processed/*.csv` plus admin seed. Karena itu tidak ada langkah
> pemindahan data — tabel dibuat kosong lalu diisi ulang dari sumber.

---

## Fase 0 — Persiapan Supabase

### 0.1 Buat project

1. Buat project baru di <https://supabase.com/dashboard>.
2. Catat tiga nilai berikut dari **Project Settings → API / Database**:

| Nilai | Lokasi di dashboard | Contoh |
|---|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL | `https://abcdefgh.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Project Settings → API → `service_role` secret | `eyJhbGci...` (rahasia!) |
| Connection string | Project Settings → Database → Connection Pooler | lihat 0.2 |

> `service_role` key **melewati Row Level Security**. Jangan pernah ditaruh di
> frontend atau commit ke git. Hanya dipakai backend.

### 0.2 Connection string Pooler

Ambil dari **Project Settings → Database → Connection Pooler**. Pilih mode
**Transaction** (port `6543`).

Format Supabase:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Ubah skema menjadi `postgresql+psycopg://` untuk SQLAlchemy:

```
postgresql+psycopg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

> **Kenapa pooler, bukan direct (5432)?** Pooler (PgBouncer) menahan jumlah
> koneksi dan cocok untuk backend web yang membuka banyak koneksi pendek.
> Direct connection dibatasi jumlahnya dan cepat habis saat scale.

### 0.3 Buat bucket Storage

Di **Storage → New bucket**, buat dua bucket:

| Bucket | Public | Isi |
|---|---|---|
| `laporan` | Ya | foto bukti laporan warga |
| `ruang-publik` | Ya | foto resmi ruang publik |

Bucket publik butuh policy agar bisa dibaca tanpa auth. Jalankan di
**SQL Editor**:

```sql
-- Baca publik untuk kedua bucket
create policy "public read laporan"
  on storage.objects for select
  using (bucket_id = 'laporan');

create policy "public read ruang-publik"
  on storage.objects for select
  using (bucket_id = 'ruang-publik');
```

Upload dilakukan backend memakai `service_role` key, jadi policy `insert`
tidak diperlukan (service_role melewati RLS).

---

## Fase 1 — Dependency & Config

### 1.1 `backend/requirements.txt`

Hapus baris `PyMySQL==1.1.0`. Tambahkan:

```diff
- PyMySQL==1.1.0
+ psycopg[binary]>=3.1
+ supabase>=2.0
```

Lalu install:

```powershell
pip install -r requirements.txt
```

> `psycopg[binary]` memasang wheel yang sudah berisi libpq, jadi tidak perlu
> build tools di Windows.

### 1.2 `backend/app/core/config.py`

Tambahkan blok konfigurasi Supabase di dalam `class Settings`:

```python
    # Supabase Storage (upload foto). DB sendiri memakai DATABASE_URL.
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET_LAPORAN: str = "laporan"
    SUPABASE_STORAGE_BUCKET_RUANG_PUBLIK: str = "ruang-publik"
```

### 1.3 `backend/.env` dan `backend/.env.example`

Ganti `DATABASE_URL` dan tambahkan variabel Supabase:

```dotenv
# Connection Pooler (transaction mode, port 6543), driver psycopg v3
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Supabase Storage
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_STORAGE_BUCKET_LAPORAN=laporan
SUPABASE_STORAGE_BUCKET_RUANG_PUBLIK=ruang-publik
```

`.env.example` tetap memakai placeholder (jangan taruh key asli).

---

## Fase 2 — Engine Postgres

### 2.1 `backend/app/core/database.py`

PgBouncer transaction mode tidak mendukung prepared statements. Dengan
psycopg3, aktifkan autocommit-style pooler-safe lewat `NullPool` +
`prepare_threshold=None`. Ganti isi file menjadi:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

# PgBouncer (Supabase Pooler, transaction mode) tidak mendukung prepared
# statements lintas transaksi. NullPool + prepare_threshold=None mencegah
# error "prepared statement already exists".
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args={"prepare_threshold": None},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

> Jika Anda memilih **direct connection (5432)** dan bukan pooler, `NullPool`
> dan `prepare_threshold` tidak diperlukan — cukup
> `pool_size=5, max_overflow=10, pool_recycle=300`.

### 2.2 `backend/app/models/user.py`

`server_default="1"` valid di MySQL/Postgres hanya karena coercion; di
Postgres boolean lebih eksplisit dengan `true`. Ubah baris 15:

```diff
-    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
+    is_active = Column(Boolean, nullable=False, default=True, server_default=sa.text("true"))
```

Lalu tambahkan import di bagian atas file:

```python
from sqlalchemy import Boolean, Column, String, DateTime, text
```

dan ganti `sa.text` menjadi `text`:

```python
    is_active = Column(Boolean, nullable=False, default=True, server_default=text("true"))
```

> Cek juga model lain yang memakai `server_default="0"` / `"1"`. Cari dengan:
> `Get-ChildItem -Recurse backend\app\models | Select-String 'server_default'`

### 2.3 `backend/app/models/base.py`

Docstring `utcnow()` masih menyebut MySQL DATETIME. Perbarui komentarnya:

```diff
-    """Waktu UTC tanpa tzinfo, sesuai kolom MySQL DATETIME yang tidak menyimpan zona waktu."""
+    """Waktu UTC tanpa tzinfo, konsisten dengan kolom timestamp yang naive."""
```

Nilai naive UTC tetap dipertahankan agar kode tidak berubah perilaku.

---

## Fase 3 — Migration Fresh untuk Postgres

13 migration lama ditulis dengan asumsi MySQL dan memuat perubahan yang tidak
relevan. Karena tidak ada data yang perlu dijaga, buat satu migration bersih
dari model.

### 3.1 Arsipkan migration lama

```powershell
New-Item -ItemType Directory -Path "backend\alembic\versions_mysql_archive" -Force
Move-Item -Path "backend\alembic\versions\*.py" -Destination "backend\alembic\versions_mysql_archive\"
```

> File `backend\alembic\script.py.mako` **jangan** dipindah — itu template.

### 3.2 Generate migration baru

Jalankan dari folder `backend\` (Alembic membaca `settings.DATABASE_URL` dari
`.env`, jadi pastikan sudah menunjuk ke Supabase):

```powershell
python -m alembic revision --autogenerate -m "initial postgres schema"
```

### 3.3 Review hasil autogenerate

Buka file baru di `backend\alembic\versions\`. Pastikan:

- [ ] Semua 11 tabel ada: `categories`, `users`, `ruang_publik`,
      `ruang_publik_foto`, `fasilitas`, `laporan`, `laporan_timeline`,
      `laporan_flag`, `etl_run`, `token_blacklist`.
- [ ] Kolom `JSON` (mis. `ruang_publik.field_source`, `etl_run.hitung`) menjadi
      `sa.JSON()` — Postgres akan memakai `JSON`/`JSONB`.
- [ ] `DECIMAL(10, 8)` / `DECIMAL(11, 8)` pada latitude/longitude tetap ada.
- [ ] `is_active` punya `server_default=sa.text('true')`.
- [ ] Tidak ada sisa tipe MySQL (mis. `mysql.*`, `LONGTEXT`, `TINYINT`).

### 3.4 Jalankan migration

```powershell
python -m alembic upgrade head
```

Verifikasi di Supabase **Table Editor**: 11 tabel muncul.

---

## Fase 4 — Seed Ulang Data

Jalankan ketiga script ETL berurutan dari folder `backend\`:

```powershell
python -m app.etl.seed_db        # ~1200 ruang publik dari data/processed/*.csv
python -m app.etl.seed_fasilitas # fasilitas standar
python -m app.etl.seed_admin     # admin pertama dari ADMIN_SEED_* di .env
```

Verifikasi:

```sql
-- Jalankan di Supabase SQL Editor
select count(*) from ruang_publik;  -- harapan ~1200
select count(*) from fasilitas;
select email, role from users;      -- ada 1 admin
```

---

## Fase 5 — Pindahkan Storage ke Supabase

### 5.1 `backend/app/core/file_upload.py`

Ganti `save_upload_file` agar mengunggah ke Supabase Storage. Sisakan
`validate_image_upload` dan `_deteksi_ekstensi` apa adanya. Tambahkan client
Supabase di atas file:

```python
import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException, status
from supabase import create_client, Client
from app.core.config import settings

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]

# ... _deteksi_ekstensi dan validate_image_upload tetap ...

_supabase: Client | None = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase

_BUCKET_MAP = {
    "laporan": lambda: settings.SUPABASE_STORAGE_BUCKET_LAPORAN,
    "ruang-publik": lambda: settings.SUPABASE_STORAGE_BUCKET_RUANG_PUBLIK,
}

def save_upload_file(file: UploadFile, subfolder: str) -> str:
    """Unggah ke Supabase Storage, kembalikan public URL."""
    validate_image_upload(file)

    header = file.file.read(12)
    file.file.seek(0)
    ext = _deteksi_ekstensi(header) or ".jpg"
    unique_filename = f"{uuid4().hex}{ext}"
    content_type = file.content_type or "image/jpeg"
    data = file.file.read()

    bucket = _BUCKET_MAP[subfolder]()
    supabase = get_supabase()
    supabase.storage.from_(bucket).upload(
        path=unique_filename,
        file=data,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return supabase.storage.from_(bucket).get_public_url(unique_filename)
```

> Cara import bisa berbeda antar versi `supabase-py`:
> - `supabase>=2.0`: `create_client`, `get_public_url()`.
> - Versi lebih lama memakai `get_public_url` sebagai string, atau
>   `storage.from_(bucket).get_public_url(path)` mengembalikan string langsung.
>   Sesuaikan bila terjadi `AttributeError`.

### 5.2 `backend/app/main.py`

Hapus static mount dan pembuatan folder lokal. Ganti baris 9–12 dan 20:

```diff
-# Pastikan folder penyimpanan ada
-os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
-os.makedirs(os.path.join(settings.UPLOAD_DIR, "laporan"), exist_ok=True)
-os.makedirs(os.path.join(settings.UPLOAD_DIR, "ruang-publik"), exist_ok=True)
-
 app = FastAPI(
     title=settings.PROJECT_NAME,
     openapi_url=f"{settings.API_V1_STR}/openapi.json"
 )
-
-# Mount direktori upload untuk diserve sebagai static file di path /uploads
-app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
```

Hapus juga import yang jadi tidak terpakai:

```diff
-import os
 from fastapi import FastAPI
-from fastapi.staticfiles import StaticFiles
 from fastapi.middleware.cors import CORSMiddleware
```

### 5.3 Cek pemakai lain

Cari referensi ke storage lokal, `/uploads`, atau `UPLOAD_DIR`:

```powershell
Get-ChildItem -Recurse backend\app | Select-String -Pattern 'save_upload_file|/uploads|UPLOAD_DIR|storage'
```

File yang perlu diperiksa:

| File | Yang dicek |
|---|---|
| `backend\app\api\v1\uploads.py` | `save_upload_file(file, "laporan")` — tetap, signature tidak berubah |
| `backend\app\api\v1\foto_ruang_publik.py` | `save_upload_file(file, "ruang-publik")` — tetap |
| `backend\app\etl\import_photos.py` | apakah menulis ke `storage/` langsung? Jika ya, arahkan ke Supabase |

### 5.4 Docker Compose (opsional)

MySQL tidak lagi diperlukan untuk development. `docker-compose.yml` boleh
dipertahankan sebagai fallback lokal, tapi bisa juga dihapus. Jika dipertahankan,
tidak ada perubahan yang wajib.

---

## Fase 6 — Dokumentasi & Verifikasi

### 6.1 Update dokumen lain

| File | Perubahan |
|---|---|
| `README.md` | Ganti langkah "MySQL Docker" jadi "Supabase"; hapus terminal MySQL |
| `docs/RUNNING.md` | Update setup DB, connection string, perintah migration |
| `docs/schema.sql` | Regenerate sebagai DDL Postgres (atau tandai sebagai arsip MySQL) |

### 6.2 Verifikasi koneksi DB

```powershell
python -c "from app.core.database import engine; from sqlalchemy import text; print(engine.connect().execute(text('select 1')).scalar())"
```

Harapan: mencetak `1` tanpa error.

### 6.3 Smoke test endpoint

Jalankan server:

```powershell
uvicorn app.main:app --reload --port 8000
```

Uji berurutan:

- [ ] `GET /health` → `{"status":"ok"}`
- [ ] `POST /api/v1/auth/login` dengan admin seed → dapat `access_token`
- [ ] `GET /api/v1/public-spaces` → data ruang publik termuat
- [ ] `POST /api/v1/uploads` dengan file JPG → respons `url` berupa
      `https://<ref>.supabase.co/storage/v1/object/public/laporan/...`
- [ ] Buka URL tersebut di browser → gambar tampil (bucket public bekerja)
- [ ] `POST /api/v1/reports` → laporan masuk dengan `foto_url` Supabase

### 6.4 Jalankan unit test

Test memakai SQLite in-memory dan tidak menyentuh Supabase, tapi pastikan
refactor tidak merusak apa pun:

```powershell
python -m pytest
```

---

## Rollback Plan

Jika migrasi gagal dan perlu kembali ke MySQL lokal:

1. Kembalikan `backend\requirements.txt` (tambah `PyMySQL==1.1.0`).
2. Kembalikan `DATABASE_URL` di `.env` ke
   `mysql+pymysql://user:password@localhost/raku_db`.
3. Kembalikan `backend\app\core\database.py` (hapus `NullPool` +
   `prepare_threshold`).
4. Kembalikan migration: pindahkan `versions_mysql_archive\*.py` kembali ke
   `versions\`, hapus migration Postgres.
5. Jalankan `docker-compose up -d db`, lalu `python -m alembic upgrade head`.
6. Untuk storage: kembalikan `file_upload.py` versi filesystem dan static mount
   di `main.py`.

> Simpan versi kode lama sebelum mulai (git branch / commit) supaya rollback
> cukup `git checkout`.

---

## Troubleshooting

### `prepared statement "s1" already exists`

Muncul saat memakai Pooler **transaction mode** tanpa `NullPool` /
`prepare_threshold=None`. Pastikan `database.py` sudah menerapkan keduanya
(Fase 2.1). Alternatif cepat: pakai **session mode** pooler (port `5432` lewat
pooler, bukan direct).

### `too many connections` / `connection limit reached`

Pooler kehabisan slot. Kurangi `max_overflow`, pastikan `NullPool` (tidak
menahan koneksi idle), dan pastikan tidak ada proses yang membocorkan session.
Cek `get_db()` selalu di-`finally: db.close()`.

### `SSL connection is required`

Tambahkan `?sslmode=require` di `DATABASE_URL` bila provider menolak koneksi
non-TLS. Supabase biasanya sudah memaksa TLS di pooler.

### `ModuleNotFoundError: No module named 'psycopg'`

Dependency belum terpasang. Jalankan `pip install -r requirements.txt` dari
folder `backend\`. Jangan lupa hapus cache bila sebelumnya pernah ada
`PyMySQL`.

### Upload sukses tapi gambar 404 di browser

- Bucket belum public, atau policy `select` belum dibuat. Ulangi Fase 0.3.
- `get_public_url` mengembalikan path salah. Cek nilai `SUPABASE_URL` tidak ada
  trailing slash ganda.

### `new row violates row-level security policy` saat upload

Backend memakai key `anon` atau `authenticated`, bukan `service_role`.
Pastikan `SUPABASE_SERVICE_KEY` berisi **service_role secret**, bukan anon key.

### Autogenerate menghasilkan migration kosong

Alembic tidak menemukan model. Pastikan `backend\alembic\env.py` mengimpor
`app.models` (sudah ada), dan migration baru dijalankan setelah file lama
dipindah (Fase 3.1) supaya `down_revision` tidak menggantung.

---

## Ringkasan Checklist

- [ ] Fase 0 — Project Supabase, connection string pooler, dua bucket + policy
- [ ] Fase 1 — `psycopg` + `supabase-py`, config, `.env`
- [ ] Fase 2 — `database.py` pooler-safe, `user.py` `server_default`
- [ ] Fase 3 — Arsip migration lama, generate + jalankan migration Postgres
- [ ] Fase 4 — `seed_db`, `seed_fasilitas`, `seed_admin`
- [ ] Fase 5 — Storage ke Supabase, hapus static mount
- [ ] Fase 6 — Update docs, verifikasi koneksi, smoke test, pytest
