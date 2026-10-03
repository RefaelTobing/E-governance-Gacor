# 05 — Environment Setup

Cara menyiapkan dan menjalankan backend secara lokal. Format perintah untuk **Windows PowerShell**; path repo mengandung spasi (`D:\Ruka Jakarta`) → wajib pakai tanda kutip.

Ringkasnya:

| Lapisan | Port | Perintah |
|---|---|---|
| MySQL 8 (Docker) | 3306 | `docker compose up -d` |
| Backend (FastAPI) | 8000 | `uvicorn app.main:app --reload` |
| Frontend (Vite) | 5173 | `npm run dev` (di `apps/web`) |

---

## 1. Prasyarat (sekali saja)

- **Docker Desktop** — dibuka dulu, status "running" sebelum perintah docker. (`docker ps` gagal = belum jalan.)
- **Python 3.13** — `python --version`
- **Node.js 18+** — `node --version` (untuk frontend)

### Virtual environment backend

```powershell
cd "d:\Ruka Jakarta"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

> Kalau PowerShell menolak `Activate.ps1`: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

⚠ **Selama sesi backend, semua perintah python/pip/pytest/alembic wajib lewat `.venv`** — Python global di mesin ini punya pasangan httpx/starlette tidak kompatibel (test akan gagal `TypeError: Client.__init__()...`). Perintah dari folder `backend/`: `..\.venv\Scripts\python.exe -m ...`

---

## 2. Database (MySQL)

```powershell
cd "d:\Ruka Jakarta"
docker compose up -d          # start pertama
# docker compose start        # kalau container sudah pernah ada (data di volume mysql-data tidak hilang)
docker ps                     # harus ada container "raku-db" status "healthy"
```

> MySQL butuh **~30 detik** inisialisasi saat volume masih kosong. Status `starting` belum bisa dipakai.

### Migrasi

```powershell
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m alembic current    # verifikasi: head (b7e2c1049a3f)
```

### Isi data awal

Ruang publik & kategori berasal dari hasil ETL di `data/processed/` — jalankan **setelah migrasi**, sekali saat tabel kosong (idempoten, aman diulang):

```powershell
..\.venv\Scripts\python.exe -m app.etl.seed_db
```

Fasilitas tidak punya sumber data resmi (file Satu Data tak punya kolom fasilitas), jadi diisi terpisah oleh `seed_fasilitas` — data contoh per ruang publik, dilewati untuk lokasi yang sudah punya fasilitas (termasuk buatan admin):

```powershell
..\.venv\Scripts\python.exe -m app.etl.seed_fasilitas
```

Tanpa langkah kedua ini, `/dashboard/fasilitas`, filter fasilitas publik, dan daftar fasilitas di halaman detail kosong.

Detail pipeline: `features/etl-worker.md`.

---

## 3. Akun Admin Pertama (FEAT-014)

```powershell
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m app.etl.seed_admin
```

Nilai dibaca dari `backend/.env` (`ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`). Script idempoten — email sudah ada → keluar tanpa mengubah apa pun.

Default dari repo:

| Field | Nilai |
|---|---|
| Email | `petugas@jakarta.go.id` |
| Password | `RukaJakarta2026` |

> **Ganti** sebelum dipakai di server sungguhan. `backend/.env` tidak ikut ter-commit; `.env.example` memuat nilai contohnya.

---

## 4. Variabel `.env` Backend

Salin `.env.example` → `.env` di folder `backend/`. Semua dibaca `app/core/config.py` (pydantic-settings, file `.env` di folder kerja `backend/`).

| Variabel | Wajib | Fungsi |
|---|---|---|
| `DATABASE_URL` | ✅ | `mysql+pymysql://user:password@localhost/raku_db` — sesuai user Docker compose |
| `SECRET_KEY` | ✅ | Kunci tanda tangan JWT HS256. **Jangan** pakai nilai default di produksi; ganti = token lama hangus |
| `FRONTEND_PUBLIC_URL` | — | Origin FE yang diizinkan CORS (default `http://localhost:5173`) |
| `FRONTEND_ADMIN_URL` | — | Default `http://localhost:5174` — satu server FE memakai 5173, jadi cukup pastikan origin yang dipakai tercantum |
| `ADMIN_SEED_NAME/EMAIL/PASSWORD` | — | Hanya untuk `python -m app.etl.seed_admin`; hapus setelah admin pertama dibuat |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | — | Default 7 hari (10080); ada di kode `config.py` |
| `UPLOAD_DIR` | — | Default `storage` (di-mount sebagai `/uploads`) |
| `MAX_UPLOAD_SIZE` | — | Default 5 MB (validasi upload foto) |

Env var frontend (`VITE_API_BASE_URL`, dll.) ada di `apps/web/.env` — urusan workflow frontend, jangan diubah dari sini.

---

## 5. Menjalankan Backend

```powershell
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- Server: <http://localhost:8000> — pastikan log `Application startup complete`
- **Swagger**: <http://localhost:8000/docs> (pengujian black-box utama)
- OpenAPI: <http://localhost:8000/api/v1/openapi.json>
- Health: <http://localhost:8000/health> → `{"status":"ok",...}`

Port 8000 terpakai? Pakai `--port 8001` lalu **sesuaikan** `apps/web/.env` → `VITE_API_BASE_URL=http://localhost:8001`.

---

## 6. Yang Harus Hidup Bersamaan

| # | Service | Kapan |
|---|---|---|
| 1 | Docker Desktop | Selalu, sebelum command docker |
| 2 | `raku-db` MySQL | Tanpa ini semua query 500 |
| 3 | uvicorn backend | FE butuh data API |
| 4 | Vite frontend | Buka website |

> ⚠ **`/health` hijau ≠ database siap.** Endpoint itu tetap `ok` saat MySQL mati. Cek DB terpisah: `docker ps` harus `healthy`.

---

## 7. Troubleshooting

| Gejala | Penyebab / Solusi |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop belum jalan / masih starting |
| Backend 500 di semua endpoint | MySQL mati → `docker compose up -d`, tunggu `healthy` |
| Port 8000 terpakai | `netstat -ano \| Select-String ":8000.*LISTENING"` → `taskkill /F /PID <pid>` (`Stop-Process` kadang melepas socket) |
| `error reading bcrypt version` di log | Warning passlib 1.7.4 vs bcrypt 4.x — **tidak berpengaruh ke login**, jangan diubah (bcrypt di-pin `4.2.1`) |
| `/docs` kosong / error | uvicorn belum selesai start — tunggu `Application startup complete` |
| `Pencarian radius selalu []` | Koordinat kosong? Cek dulu — saat ini CSV sudah berkoordinat semua; pastikan `seed_db` terbaru sudah jalan |
| Test gagal `Client.__init__() ... 'app'` | Memakai Python global → ulangi dengan `.venv` |
| FE gagal memuat data | Backend mati / `VITE_API_BASE_URL` tidak cocok dengan port backend |

---

## 8. Checklist Setup Baru (mesin baru)

- [ ] Docker Desktop jalan, `docker compose up -d` → `raku-db` healthy
- [ ] `.venv` dibuat + `pip install -r backend/requirements.txt` sukses
- [ ] `backend/.env` ada (salin `.env.example`, isi `SECRET_KEY` sendiri)
- [ ] `alembic upgrade head` sukses, `alembic current` = head
- [ ] `python -m app.etl.seed_db` (data terisi), `python -m app.etl.seed_fasilitas` (fasilitas contoh), `python -m app.etl.seed_admin` (akun admin)
- [ ] uvicorn start → `/health` 200, `/docs` terbuka
- [ ] Smoke: `curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3"` → array berisi
