# Menjalankan Ruka Jakarta

Butuh tiga terminal (atau tiga tab): satu untuk backend, satu untuk frontend, dan
koneksi ke database Supabase (cloud, tidak perlu dijalankan lokal).

Ringkasnya:

| Lapisan | Port | Perintah |
|---|---|---|
| Database (Supabase Postgres) | 6543 (pooler) | diakses lewat `DATABASE_URL`, tanpa server lokal |
| Backend (FastAPI) | 8000 | `uvicorn app.main:app --reload` |
| Frontend (Vite) | 5173 | `npm run dev` |

> Semua `cd` di bawah memakai tanda kutip karena path repo-nya mengandung spasi
> (`D:\Ruka Jakarta`). Tanpa kutip, PowerShell akan memotong di tengah dan
> gagal dengan `A positional parameter cannot be found`.

---

## 0. Yang perlu terpasang sekali saja

- **Python 3.13** — sudah ada di mesin ini (`python --version`).
- **Node.js 18+** — cek dengan `node --version`.
- **Akun/kredensial Supabase** — isi `backend/.env` (lihat bagian 1).

### Virtual environment backend

```
cd "d:\Ruka Jakarta"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

> Kalau PowerShell menolak menjalankan `Activate.ps1` karena ExecutionPolicy,
> jalankan sekali:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## 1. Database (Supabase Postgres)

Tidak ada Docker/MySQL lokal. Backend terhubung ke Supabase lewat
`DATABASE_URL` di `backend/.env`.

Isi `backend/.env` (contoh, salin dari `backend/.env.example`):

```dotenv
# Connection Pooler Supabase (mode Transaction, port 6543), driver psycopg v3.
# User memakai suffix project-ref: postgres.<project-ref>
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_STORAGE_BUCKET_LAPORAN=laporan
SUPABASE_STORAGE_BUCKET_RUANG_PUBLIK=ruang-publik
```

> **Kenapa Pooler, bukan direct?** Host direct `db.<ref>.supabase.co` hanya
> punya alamat IPv6; jaringan tanpa IPv6 gagal resolve. Pooler punya IPv4 dan
> menahan jumlah koneksi. Karena PgBouncer transaction mode tidak mendukung
> prepared statements, `app/core/database.py` memakai
> `poolclass=NullPool` + `connect_args={"prepare_threshold": None}`.

### Bucket Storage

Di Supabase **Storage**, buat dua bucket **public**: `laporan` dan
`ruang-publik`, lalu jalankan policy baca publik di **SQL Editor**:

```sql
create policy "public read laporan"
  on storage.objects for select
  using (bucket_id = 'laporan');

create policy "public read ruang-publik"
  on storage.objects for select
  using (bucket_id = 'ruang-publik');
```

### Migrasi

Bikin tabel-tabelnya (schema Postgres tunggal, hasil autogenerate dari model):

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m alembic upgrade head
```

Cek statusnya:

```
..\.venv\Scripts\python.exe -m alembic current
```

> Migration MySQL lama diarsipkan di `backend/alembic/versions_mysql_archive/`
> dan tidak lagi dipakai. Skema Postgres dibuat dari nol di
> `backend/alembic/versions/`.

### Isi data awal

Ruang publik & kategori berasal dari file ETL di `data/raw/`. Fasilitas punya
script terpisah (`seed_fasilitas`) karena file Satu Data tidak punya kolom
fasilitas. Jalankan sekali kalau tabel masih kosong, **setelah migrasi di atas**:

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m app.etl.seed_db
..\.venv\Scripts\python.exe -m app.etl.seed_fasilitas
```

Tanpa langkah kedua, `/dashboard/fasilitas`, filter fasilitas publik, dan daftar
fasilitas di halaman detail kosong.

Lihat `backend/docs/features/etl-worker.md` untuk urutan lengkap (`extract_satudata`,
`read_raw`, `transform_rth_raw`). Seed membaca `data/processed/ruang_publik_terbaru.csv`
(1200 baris, semua punya koordinat, sebagian berisi `jam_operasional`). File lain bisa
dipakai lewat `--file`, dan `--reset` mengganti total isi `ruang_publik` + `categories`
(backup DB dulu; perintahnya ditolak kalau masih ada laporan/fasilitas). File kandidat di
`data/processed/kandidat/` (hasil transform, belum direview) ditolak kecuali
`--pakai-kandidat`.

```bash
# pencarian radius sudah hidup, contoh 2 km dari Monas
curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=2"
```

333 baris punya `alamat` NULL, jadi FE menampilkan "Alamat tidak tersedia"
untuk baris itu. Kolom `latitude`/`longitude` tidak ada yang kosong.

---

## 2. Akun admin pertama

Sekali saja, untuk punya jalan masuk ke dashboard:

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m app.etl.seed_admin
```

Nilainya dibaca dari `backend/.env` (`ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`,
`ADMIN_SEED_PASSWORD`). Script aman dijalankan berulang — kalau email-nya sudah
ada, dia keluar tanpa mengubah apa pun.

Default dari repo ini:

| Field | Nilai |
|---|---|
| Email | `petugas@jakarta.go.id` |
| Password | `RukaJakarta2026` |

> **Ganti password ini** kalau nanti repo dipakai di server sungguhan.
> `backend/.env` tidak ikut ter-commit, tapi `.env.example` yang ada di repo
> memuat nilai defaultnya.

---

## 3. Backend

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Buka:

- Server: <http://localhost:8000>
- **Swagger UI** (bisa klik dan coba langsung): <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

`--reload` me-restart otomatis tiap file backend berubah. Biarkan terminal ini
terbuka selama pengembangan.

### Kalau tidak bisa jalan di port 8000

```
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

Kalau gantinya, set juga di `apps/web/.env` supaya frontend ikut tahu:

```
VITE_API_BASE_URL=http://localhost:8001
```

---

## 4. Frontend

```
cd "d:\Ruka Jakarta\apps\web"
npm install
npm run dev
```

Buka <http://localhost:5173>. `npm install` cukup sekali, tidak perlu diulang.

Backend dan frontend **harus jalan bersamaan** — kalau backend mati, halaman
publik yang butuh data akan gagal memuat. `LoginPage` sudah menampilkan
pesan error yang bisa dibaca, bukan `[object Object]`.

---

## Test

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m pytest tests\unit -q
```

> **Harus pakai `.venv`.** Python global di mesin ini punya pasangan
> httpx/starlette yang tidak kompatibel, jadi `TestClient` akan gagal dengan
> `TypeError: Client.__init__() got an unexpected keyword argument 'app'`.
> Test-nya sendiri tidak menyentuh Supabase — pakai SQLite in-memory, dan
> storage di-fallback ke filesystem lokal (fixture `_storage_lokal`).

---

## Yang perlu dinyalakan

| # | Service | Kapan harus hidup |
|---|---|---|
| 1 | Supabase (cloud) | Backend tidak bisa query apa pun tanpa koneksi ini |
| 2 | Backend uvicorn | FE butuh data dari API |
| 3 | Frontend Vite | Untuk buka website |

Yang paling sering bikin bingung: **`/health` hijau bukan berarti database siap.**
Endpoint itu cuma memastikan proses server hidup. Cek database terpisah:

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -c "from app.core.database import engine; from sqlalchemy import text; print(engine.connect().execute(text('select 1')).scalar())"
```

Harapan: mencetak `1`.

---

## Troubleshooting

**`failed to resolve host 'db.<ref>.supabase.co'`**
Itu host direct yang hanya punya IPv6. Pakai host **pooler**
(`aws-0-<region>.pooler.supabase.com:6543`) dengan user `postgres.<project-ref>`.

**`password authentication failed for user "postgres"`**
Password database salah. Reset di Supabase → Project Settings → Database →
Reset database password, lalu perbarui `DATABASE_URL`.

**`prepared statement "s1" already exists`**
Muncul bila memakai pooler transaction mode tanpa `NullPool` /
`prepare_threshold=None`. Sudah ditangani di `app/core/database.py`; jangan
dilepas.

**Upload sukses tapi gambar 404 di browser**
Bucket belum public atau policy `select` belum dibuat. Ulangi bagian bucket di
atas.

**Backend 500 di semua endpoint**
Koneksi Supabase gagal. Cek `DATABASE_URL` di `backend/.env` (host pooler,
password), lalu tes `select 1` seperti di atas.

**Port 8000 dipakai proses lain**

```
netstat -ano | Select-String ":8000.*LISTENING"
```

Lalu `taskkill /F /PID <pid>`. `Stop-Process` kadang tidak melepas socket yang
sedang listen di Windows.

**Frontend bisa dibuka tapi data tidak muncul**
Backend mati, atau `VITE_API_BASE_URL` di `apps/web/.env` tidak cocok dengan
port backend yang dipakai.

**`error reading bcrypt version` muncul di log backend**
Warning dari passlib 1.7.4 yang mencari `bcrypt.__about__`, dihapus di bcrypt
4.x. Tidak berpengaruh ke hashing sandi — login tetap jalan. Jangan diubah,
`bcrypt` sengaja di-pin ke `4.2.1` (lihat komentar di `requirements.txt`).

**Swagger kosong / `/docs` error**
Biasanya karena uvicorn belum selesai start. Tunggu log
`Application startup complete`.
