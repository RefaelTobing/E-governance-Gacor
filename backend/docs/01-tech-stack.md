# 01 — Tech Stack Backend

Daftar teknologi, versi persis (dari `backend/requirements.txt`), dan **alasan pemakaiannya**. Jangan menambah library baru tanpa kebutuhan PRD yang jelas — ini project MVP mahasiswa.

---

## 1. Runtime & Framework

| Teknologi | Versi | Alasan |
|---|---|---|
| Python | 3.13 | Runtime resmi project (terpasang di mesin dev). |
| **FastAPI** | 0.109.0 | Framework REST ringan, validasi request/response otomatis via Pydantic, dan **Swagger UI gratis** (`/docs`) yang dipakai untuk pengujian black-box. |
| Uvicorn | 0.27.0 | ASGI server untuk menjalankan FastAPI (mode `--reload` saat dev). |
| Pydantic-settings | 2.1.0 | Membaca variabel `.env` ke objek `Settings` dengan tipe data tervalidasi (`app/core/config.py`). |

## 2. Database & Migrasi

| Teknologi | Versi | Alasan |
|---|---|---|
| **MySQL** | 8.0 (image Docker) | Sesuai PRD (Bagian 6.4). Berjalan sebagai container `raku-db` via `docker-compose.yml` — tidak perlu install MySQL manual. |
| SQLAlchemy | >= 2.0.36 | ORM: pemetaan model Python ↔ tabel MySQL, query dengan `joinedload` (anti N+1), dan kompatibel dengan Alembic. |
| PyMySQL | 1.1.0 | Driver MySQL murni Python (tanpa kompilasi native) yang dipakai SQLAlchemy lewat `DATABASE_URL` dialect `mysql+pymysql://`. |
| Alembic | 1.13.1 | Migrasi database terstruktur. Setiap perubahan skema = 1 file revisi; bisa maju/mundur (`upgrade head` / `downgrade -1`). |

> **Mengapa MySQL, bukan PostgreSQL/PostGIS:** tuntutan PRD saat ini (query radius sederhana dengan Haversine di SQL) cukup dilayani MySQL. Evaluasi spasial lanjutan (PRD Risiko: MySQL vs database GIS) ditunda sampai ada bukti kebutuhan — jangan migrasi tanpa alasan.

## 3. Autentikasi & Keamanan

| Teknologi | Versi | Alasan |
|---|---|---|
| **PyJWT** | 2.8.0 | Membuat/membaca token JWT (HS256). Token stateless 7 hari (`ACCESS_TOKEN_EXPIRE_MINUTES`), subject = `user.id`. |
| passlib[bcrypt] | 1.7.4 | Hash kata sandi. Sandi **tidak pernah** disimpan plaintext. |
| bcrypt | **4.2.1 (di-pin)** | Passlib 1.7.4 tidak kompatibel dengan bcrypt >= 4.3 (perubahan API internal). Pin ini **sengaja** — jangan di-upgrade. (Muncul warning `error reading bcrypt version` di log; tidak berpengaruh ke fungsi — jangan ditangani dengan mengubah versi.) |
| python-multipart | 0.0.9 | Parsing upload file multipart/form-data (endpoint upload foto). |

## 4. ETL & Data

| Teknologi | Versi | Alasan |
|---|---|---|
| pandas | >= 2.2 | Pembacaan & transformasi dataset Satu Data Jakarta (CSV/Excel) di `app/etl/`. |
| lxml | >= 5.0 | Parser untuk file Excel lama format `.xls` (dataset RTH berbentuk Excel). |
| **requests** | **2.34.2 (di-pin)** | Tahap Extract (`app/etl/extract_satudata.py`): unduh dataset dari API Satu Data Jakarta & layer ArcGIS Jakarta Satu. Dipakai untuk retry otomatis (server portal dua kali putus saat pengujian), timeout per request, dan status code yang jelas. |
| **APScheduler** | **3.11.3 (di-pin)** | Penjadwalan pipeline ETL (BE-17) di `app/etl/scheduler.py`: cron `ETL_JADWAL` zona WIB, `max_instances=1` anti tumpang tindih. Proses terpisah dari server, `app/main.py` tidak diubah. Di-pin karena rilis 4.x mengubah API. |
| python-dotenv | 1.0.1 | Fallback pembacaan `.env`. |
| cryptography | >= 42.0 | Dependensi pendukung stack data/keamanan. |

> **Bentuk kerja ETL:** script batch, dijalankan manual (`python -m app.etl.seed_db`) atau dijadwalkan lewat proses terpisah (`python -m app.etl.scheduler`, BE-17), **bukan** worker yang jalan terus-menerus di dalam server. Lihat `features/etl-worker.md`.

## 5. Pengujian

| Teknologi | Versi | Alasan |
|---|---|---|
| pytest | >= 8.0 | Unit test. Jalankan **wajib dengan `.venv`** project, bukan Python global (lihat `06-testing-strategy.md`). |
| email-validator | >= 2.1.0 | Validasi format email Pydantic (`EmailStr`) untuk field registrasi. |

---

## 6. Ekosistem Frontend (rujukan lintas, jangan diubah dari backend)

Ditentukan PRD Bagian 6.4 dan terpasang di `apps/web/package.json`: React 18, Vite 5, React Router 6, Leaflet + react-leaflet (peta), lucide-react (ikon), Swiper (slider). Backend hanya perlu tahu bahwa **kontrak API-nya dikonsumsi dari `apps/web/src/services/*.js`**.

---

## 7. Aturan Penambahan Dependency

Sebelum menambah library ke `requirements.txt`:

1. Apakah kebutuhan ini ada di PRD (FEAT/NFR)? Jika tidak → jangan.
2. Apakah sudah bisa dengan stdlib/library yang ada? (Contoh: rate limiting sederhana bisa cukup dengan middleware sendiri, tanpa dependensi berat.)
3. Jika ya → tambahkan **dengan versi terpin bila pernah ada kasus breaking change** (seperti bcrypt), dokumentasikan alasannya di file ini, lalu pastikan `pip install -r requirements.txt` bersih di `.venv` kosong.

### Keputusan yang sudah diambil

| Library | Aturan 2 (stdlib cukup?) | Alasan pengecualian |
|---|---|---|
| `requests==2.34.2` | Sebenarnya bisa dengan `urllib.request`, tetapi ditolak | PRD §5 mewajibkan unduhan berkala ke dua portal eksternal yang tidak punya SLA. Saat pengujian, koneksi ke `satudata.jakarta.go.id` sempat putus dan timeout. Retry + backoff otomatis lewat `HTTPAdapter` menulis jauh lebih sedikit kode daripada versi `urllib` sendiri, dan biaya dependensinya kecil (murni Python). Keputusan pemilik proyek (2026-10-04). |
| `APScheduler==3.11.3` | Loop stdlib bisa saja ditulis sendiri, tetapi tidak punya ekspresi cron & zona waktu bawaan | Task BE-17 dan JOBDESK menyebut APScheduler secara eksplisit; dibutuhkan cron `ETL_JADWAL` (WIB), `max_instances` anti tumpang tindih, dan `misfire_grace_time` yang sudah tersedia. Berjalan sebagai proses terpisah dari API, jadi server tidak menambah dependensi maupun beban. Keputusan pemilik proyek (2026-10-04). |
