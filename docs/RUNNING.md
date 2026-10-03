# Menjalankan Ruka Jakarta

Butuh tiga terminal (atau tiga tab) + Docker Desktop: satu untuk database, satu
untuk backend, satu untuk frontend.

Ringkasnya:

| Lapisan | Port | Perintah |
|---|---|---|
| MySQL 8 (Docker) | 3306 | `docker compose up -d` |
| Backend (FastAPI) | 8000 | `uvicorn app.main:app --reload` |
| Frontend (Vite) | 5173 | `npm run dev` |

> Semua `cd` di bawah memakai tanda kutip karena path repo-nya mengandung spasi
> (`D:\Ruka Jakarta`). Tanpa kutip, PowerShell akan memotong di tengah dan
> gagal dengan `A positional parameter cannot be found`.

---

## 0. Yang perlu terpasang sekali saja

- **Docker Desktop** — untuk MySQL. Pastikan sudah dibuka dan statusnya
  "Docker Desktop is running" sebelum lanjut. Kalau belum, `docker ps` akan
  gagal.
- **Python 3.13** — sudah ada di mesin ini (`python --version`).
- **Node.js 18+** — cek dengan `node --version`.

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

## 1. Database (MySQL)

```
cd "d:\Ruka Jakarta"
docker compose up -d
```

Cek sudah siap:

```
docker ps
```

Yang diharapkan: satu container bernama `raku-db` dengan status `healthy`.

> **MySQL butuh ~30 detik** untuk inisialisasi saat volume masih kosong.
> `docker ps` yang statusnya `starting` (bukan `healthy`) belum bisa dipakai.

Kalau `raku-db` sudah pernah jalan, cukup `docker compose start` — data di
`mysql-data` tidak hilang.

### Migrasi

Bikin dulu tabel-tabelnya:

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m alembic upgrade head
```

Cek statusnya:

```
..\.venv\Scripts\python.exe -m alembic current
```

### Isi data awal

Ruang publik & kategori berasal dari file ETL di `data/raw/`. Fasilitas punya
script terpisah (`seed_fasilitas`) karena file Satu Data tidak punya kolom
fasilitas. Jalankan sekali kalau tabel masih kosong, **setelah migrasi di atas**:

```
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m app.etl.seed_db
..\.venv\Scripts\python.exe -m app.etl.seed_fasilitas
```

Tanpa langkah kedua, `/dashboard/fasilitas` dan filter fasilitas publik kosong.

Lihat `app/etl/` untuk script yang tersedia (`read_raw`, `transform_rth_raw`,
`transform_rth`). Seed membaca `data/processed/ruang_publik.csv` (1200
baris, semua punya koordinat). File lain bisa dipakai lewat `--file`, dan
`--reset` mengganti total isi `ruang_publik` + `categories` (backup DB dulu;
perintahnya ditolak kalau masih ada laporan/fasilitas).

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
> Test-nya sendiri tidak menyentuh MySQL — pakai SQLite in-memory.

---

## Yang perlu dinyalakan

| # | Service | Kapan harus hidup |
|---|---|---|
| 1 | Docker Desktop | Selalu, sebelum command docker apa pun |
| 2 | `raku-db` (MySQL) | Backend tidak bisa query apa pun tanpa ini |
| 3 | Backend uvicorn | FE butuh data dari API |
| 4 | Frontend Vite | Untuk buka website |

Yang paling sering bikin bingung: **`/health` hijau bukan berarti database siap.**
Endpoint itu cuma memastikan proses server hidup, dan tetap mengembalikan `ok`
kalau MySQL mati. Cek database terpisah:

```
docker ps
```

---

## Troubleshooting

**Docker: `Cannot connect to the Docker daemon`**
Docker Desktop belum jalan. Buka aplikasinya, tunggu sampai ikonnya tidak
lagi menunjukkan "starting".

**Backend 500 di semua endpoint**
MySQL mati. `docker compose up -d` lalu tunggu sampai status container
`healthy`.

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
