# WORKFLOW_BACKEND.md — Panduan Pengerjaan Backend (RuangTerbuka)

> Dokumen ini adalah instruksi kerja **langkah demi langkah untuk AI coding agent** (atau manusia) yang mengerjakan backend FastAPI repo ini.
> Sumber kumpulan aturan: `docs/PRD.md`, `docs/API.md`, `docs/RUNNING.md`, `docs/schema.sql`, `docs/Structure.md` — digabung dan diverifikasi ke kode aktual.
> Frontend punya workflow sendiri: [`docs/WORKFLOW_FRONTEND.md`](WORKFLOW_FRONTEND.md). Jangan mencampur scope keduanya.

---

## 1. Tujuan

Menyelaraskan backend (`backend/`) dengan kebutuhan frontend dan PRD secara **terverifikasi**, dengan urutan kerja yang jelas, setiap fase punya gerbang verifikasi, dan kontrak API tidak pernah rusak diam-diam.

Proses wajib setiap kali: **BACA → AUDIT → PERBAIKI → VERIFIKASI → DOKUMENTASIKAN**.
Jangan langsung menulis kode endpoint sebelum membaca kode yang sudah ada.

---

## 2. Ruang Lingkup

**Boleh dikerjakan:**

- `backend/app/api/**` — router & endpoint
- `backend/app/services/**` — logika bisnis (CRUD, pencarian, statistik)
- `backend/app/models/**` — model SQLAlchemy
- `backend/app/schemas/**` — skema Pydantic (kontrak request/response)
- `backend/app/core/**` — config, database, security, file upload
- `backend/app/etl/**` — pipeline data masuk
- `backend/alembic/**` — migrasi database
- `backend/tests/**` — unit test
- `backend/.env.example`, `backend/requirements.txt`
- `docs/API.md` — wajib diperbarui bila kontrak endpoint berubah

**TIDAK boleh:**

- Mengubah apa pun di `apps/web/` (frontend urusan workflow frontend)
- Menghapus/mengubah nama endpoint yang sudah dipanggil frontend tanpa mencatat konflik dan menyinkronkan `docs/API.md`
- Menambah dependency berat (microservice, ORM baru, Redis, Celery) — ini project MVP mahasiswa
- Mengganti MySQL atau struktur database yang sudah bermigrasi tanpa alasan PRD yang jelas

---

## 3. Sumber Kebenaran & Prioritas

| Prioritas | Sumber | Menjawab |
|---|---|---|
| 1 | **Kode aktual di `backend/app/`** | Apa yang benar-benar ada sekarang (kontrak akhir) |
| 2 | `docs/PRD.md` (FEAT-001..012, NFR) | Apa yang *harus* ada |
| 3 | `docs/API.md` | Kontrak endpoint untuk frontend — **sebagian kedaluwarsa, cek §4** |
| 4 | `docs/schema.sql` + `backend/alembic/versions/` | Skema database |
| 5 | `docs/RUNNING.md` | Cara menjalankan & operasi |
| 6 | Kebutuhan frontend (`docs/WORKFLOW_FRONTEND.md`, pemanggilan di `apps/web/src/services/`) | Endpoint apa yang FE butuhkan |

**Aturan konflik:** bila `API.md` dan kode berbeda, **kode yang menang** — lalu `API.md` wajib diperbaiki di fase dokumentasi.

---

## 4. Fakta Kedaluwarsa yang Sudah Teridentifikasi (baca sebelum mulai)

Dokumen lama berisi klaim yang sudah tidak berlaku. Jangan mengulang audit dari nol:

1. **`API.md` bagian "Belum Ada" sudah kedaluwarsa sebagian.**
   Router laporan **sudah aktif** di `backend/app/api/v1/api.py` (`/reports` + `/statistics`). Warga sudah bisa kirim laporan lewat `POST /api/v1/reports`.
   Yang **masih benar** dari daftar itu: CRUD admin ruang publik belum ada (fasilitas sudah ada lewat `/api/v1/admin/facilities`, 2026-10-04), refresh/logout token belum ada.
2. **Catatan "koordinat kosong" sudah tidak berlaku.** Sumber seed `data/processed/ruang_publik.csv` berisi **1200 baris, semuanya punya `latitude`/`longitude`**. Pencarian radius sudah hidup. (File lama `ruang_publik.json` dan `ruang_publik_merged.json` sudah dihapus dari `data/processed`; versi lama tetap ada di git history.)
3. **`docs/Structure.md` menggambarkan kondisi awal (folder `.gitkeep` semua)** — kondisi aktual sudah jauh lebih maju. Anggap hanya sebagai peta lokasi folder, bukan status.
4. **`pytest.ini` menunjuk `testpaths = tests`, tetapi folder `backend/tests/` tidak ada** (terhapus di commit lama). Menjalankan pytest sekarang menghasilkan "no tests ran". Fase testing wajib membuat ulang folder ini.

---

## 5. Audit Repo Sebelum Menulis Kode

Jalankan urutan ini pada sesi kerja pertama (lewati bila sudah pernah di sesi yang sama):

1. Baca `backend/app/api/v1/api.py` → daftar router yang aktif.
2. Baca `backend/app/api/deps.py` → pola auth: `get_db`, `get_current_user`, `get_current_active_user`, `get_current_admin`, `oauth2_scheme`.
3. Baca `backend/app/core/config.py` → semua settings (DATABASE_URL, SECRET_KEY, CORS, UPLOAD_DIR, MAX_UPLOAD_SIZE, ADMIN_SEED_*).
4. Baca `backend/app/core/security.py` → hash & JWT (PyJWT, subject = user.id, masa berlaku 7 hari).
5. Cek skema: `backend/app/models/__init__.py` + `docs/schema.sql` + `alembic current`.
6. Cek status migrasi & data:
   ```
   docker ps                                # container raku-db harus healthy
   ..\.venv\Scripts\python.exe -m alembic current
   ```
   (perintah dijalankan dari `backend/`)
7. Baca `apps/web/src/services/*.js` (**baca saja, jangan ubah**) untuk tahu endpoint apa yang FE panggil dan bentuk field yang diharapkan.
8. Buka Swagger: <http://localhost:8000/docs> — bandingkan dengan `docs/API.md`.

---

## 6. Konvensi Kode Backend

Ikuti pola yang sudah ada — jangan membuat pola baru:

- **Layer:** Router (`app/api/v1/*.py`) → dependency (`app/api/deps.py`) → Service/CRUD (`app/services/*.py`) → Model (`app/models/*.py`). Router **tipis**: validasi HTTP + Depends; logika bisnis di service.
- **Skema:** request/response Pydantic di `app/schemas/*.py`, selalu pakai `model_config = ConfigDict(from_attributes=True)` untuk response.
- **Auth:** pakai `Depends(get_current_admin)` untuk endpoint admin, `Depends(get_current_active_user)` untuk user login. **Jangan** cek role manual di dalam body fungsi.
- **Error:** `raise HTTPException(status_code=..., detail=...)` dengan pesan dalam bahasa Indonesia (ikuti pesan yang sudah ada).
- **DB:** selalu `Session = Depends(get_db)`; jangan buat `SessionLocal()` langsung di router.
- **Query N+1:** gunakan `joinedload` untuk relasi yang ikut di-response (lihat pola di `app/services/laporan.py`).
- **Penamaan:** fungsi service `get_/create_/update_/delete_ + entitas`; endpoint path kebab-case (`/public-spaces`, `/stats/dashboard`).
- **Enum status laporan (kanonik, jangan dilepas):**
  `menunggu_verifikasi` → `diverifikasi` → `dalam_penanganan` → `selesai`, plus `ditolak`.
  Nilai default ada di `models/laporan.py` (`menunggu_verifikasi`). Label tampilan ada di FE (`StatusBadge.jsx`) — jangan ganti nilai key tanpa koordinasi FE.
- **Migration:** setiap perubahan skema = file alembic baru (`alembic revision --autogenerate -m "pesan"`), jangan edit migrasi lama, jangan ALTER manual di MySQL.

---

## 7. Kontrak API — Status Aktual

### 7.1 Sudah ada dan berfungsi

| Method | Path | Auth | Catatan |
|---|---|---|---|
| GET | `/health` | — | Hidup ≠ DB siap |
| POST | `/api/v1/auth/login` | — | form-encoded, field `username` = email |
| POST | `/api/v1/auth/register` | — | role dipaksa `warga` |
| GET | `/api/v1/auth/me` | Token | |
| GET | `/api/v1/categories` | — | |
| POST | `/api/v1/categories` | **— (BELUM DILINDUNGI)** | lihat Fase 1c |
| GET | `/api/v1/facilities` | — | aggregate untuk filter FE |
| GET | `/api/v1/public-spaces` | — | `lat,long,radius(km),category,facilities,q,wilayah,skip,limit`; Haversine di SQL |
| GET | `/api/v1/public-spaces/stats` | — | metrik halaman daftar |
| GET | `/api/v1/public-spaces/{id}` | — | + `fasilitas`, `foto[]` |
| GET | `/api/v1/public-spaces/{id}/reports` | — | **bermasalah, lihat Fase 1b** |
| GET/POST/PATCH/DELETE | `/api/v1/users*` | Admin | kelola petugas, nonaktifkan (bukan hapus) |
| POST | `/api/v1/reports` | Token opsional | anonim tanpa token; `tampilkan_nama` wajib token |
| GET | `/api/v1/reports` | — | filter `status,wilayah,q` — **belum bisa per-pengguna, lihat Fase 1a** |
| GET | `/api/v1/reports/stats/dashboard` | Admin | 4 kartu statistik |
| GET | `/api/v1/reports/stats/moderasi` | Admin | antrian + selesai pekan ini |
| GET | `/api/v1/reports/{id}` | — | + timeline |
| PATCH | `/api/v1/reports/{id}/status` | Admin | tulis timeline otomatis |
| GET | `/api/v1/statistics/summary` | — | dipakai homepage |
| GET | `/api/v1/statistics/testimonials` | — | masih hardcode |
| GET | `/api/v1/statistics/hero-slides` | — | masih hardcode (emoji rusak, lihat Fase 5) |
| GET | `/uploads/<path>` | — | static file dari `storage/` |
| POST | `/api/v1/uploads` | - | Upload file bukti foto laporan (JPEG/PNG/WebP, <= 5MB) |

### 7.2 Belum ada — dibutuhkan frontend/PRD

| Kebutuhan | PRD | Dibutuhkan oleh | Fase |
|---|---|---|---|
| Filter laporan per-pengguna | FEAT-010 | `getUserReports` → "Laporan Saya" | 1a |
| CRUD ruang publik (admin) | FEAT-012 | halaman `/dashboard/data-master` | 3 |
| Rate limiting endpoint laporan | NFR-002 | PRD | 4 |
| Refresh/logout token | — | keamanan sesi (token stateless 7 hari) | 4 |

---

## 8. Database & Data (ETL)

**Tabel** (lihat `docs/schema.sql` + model di `app/models/`):
`categories`, `users`, `ruang_publik`, `fasilitas`, `laporan`, `laporan_timeline`.

**Relasi kunci:** `ruang_publik.kategori_id → categories.id`; `laporan → users (opsional), ruang_publik (wajib), fasilitas (opsional)`; `laporan_timeline → laporan` (cascade delete).

**Pipeline ETL** (`backend/app/etl/`):

1. `extract_satudata.py` — unduh 5 dataset dari Satu Data Jakarta + Geoportal ke `data/raw/` (+ `.meta.json`)
2. `read_raw.py` — baca file mentah di `data/raw/`
3. `transform_rth_raw.py` — olah jadi `data/processed/ruang_publik_terbaru.csv` (1200 baris, id identik master) + `kandidat/ruang_publik_kandidat.csv` (baris baru, `verified=False`) + `transform_laporan.json`; koordinat hilang/luar rentang & baris di luar 4 kategori dibuang
4. `seed_db.py` — masukkan kategori + ruang publik ke MySQL dari `data/processed/ruang_publik_terbaru.csv` (cadangan `ruang_publik.csv`; idempoten: baris yang sudah ada dicocokkan id → natural key → nama, lalu hanya kolom `ETL_OWNED` yang disegarkan; `--file` ganti sumber, `--reset` ganti total isi, file kandidat ditolak kecuali `--pakai-kandidat`)
5. `scheduler.py` — jalankan pipeline (1) -> (3) -> (4) berkala dengan APScheduler, proses terpisah dari server API; jadwal `ETL_JADWAL` (cron WIB, default 02:00), `--once` untuk sekali jalan (BE-17)
6. `seed_admin.py` — buat admin pertama dari `ADMIN_SEED_*` di `.env` (idempoten)

Aturan: **perubahan manual admin terhadap data ETL tidak boleh hilang** saat seed ulang (FEAT-012) — kolom yang pernah diedit tercatat di `ruang_publik.field_source` dan ETL menahannya; kolom `ETL_OWNED` tetap disegarkan dari sumber. Pemetaan kolom: `backend/docs/features/data-master-service.md` §4.

---

## 9. Fase Implementasi (urut, jangan lompat)

### FASE 0 — Fondasi Hidup
**Kerjakan:** nyalakan stack sesuai `docs/RUNNING.md` (Docker → alembic upgrade → seed → uvicorn).
**Verifikasi (gerbang):**
- [ ] `docker ps` → `raku-db` healthy
- [ ] `GET /health` → 200
- [ ] `GET /api/v1/openapi.json` bisa diakses, Swagger `/docs` terbuka
- [ ] `GET /api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3` mengembalikan data (koordinat sudah terisi)

### FASE 1 — Perbaiki Kontrak yang Salah / Bocor
**1a. Laporan per-pengguna (FEAT-010).**
`GET /api/v1/reports` tidak punya parameter pemilik → "Laporan Saya" di FE menampilkan semua laporan. Service `get_reports()` di `app/services/laporan.py` **sudah menerima `user_id`** — yang belum ada param-nya di router. **Selesai BE-50 (2026-10-08):** dipilih `GET /api/v1/reports/mine` (token wajib, `get_current_active_user`), semua status milik sendiri, filter `status/q/wilayah` terkombinasi, tercatat di `docs/API.md` + `04-api-endpoints.md`.
- **Verifikasi (lulus):** login 2 user, kirim laporan masing-masing, endpoint hanya mengembalikan laporan milik pemanggil; tanpa token → 401.

**1b. Fix filter laporan per-ruang publik.**
`get_reports_by_ruang_publik()` menyaring `status IN ("disetujui", "tayang_otomatis")` — nilai itu **tidak pernah ada** di database (kamus status di §6). Akibatnya `GET /public-spaces/{id}/reports` selalu `[]`.
- Ganti dengan logika yang benar menurut PRD FEAT-010: laporan **tayang publik setelah lolos moderasi** → `status IN ("diverifikasi","dalam_penanganan","selesai")` (kecuali keputusan produk lain, catat bila beda).
- **Verifikasi:** setujui satu laporan via PATCH status, lalu cek endpoint ini mengembalikan laporan itu; laporan `menunggu_verifikasi` tidak tayang.

**1c. Proteksi `POST /api/v1/categories`.**
Endpoint ini terbuka tanpa auth (sudah dicatat di `API.md`) — publik bisa membuat kategori.
- Tambahkan `Depends(get_current_admin)`.
- **Verifikasi:** tanpa token → 403; dengan token admin → 201.

**1d. Validasi enum status di `PATCH /reports/{id}/status`.**
Saat ini payload `status` bebas string apa pun → admin bisa menulis status tak dikenal yang merusak tampilan FE.
- Validasi terhadap daftar status kanonik (§6), tolak selain itu dengan 422/400.

### FASE 2 — Upload Foto (FEAT-008, NFR-002)
`app/core/file_upload.py` **sudah siap** (`validate_image_upload`: MIME jpg/png/webp + batas 5MB; `save_upload_file` → path `/uploads/<subfolder>/<nama-unik>`), tetapi **belum dipakai endpoint mana pun**.
- Buat endpoint upload (mis. `POST /api/v1/uploads` dengan `UploadFile`, mengembalikan `{ "url": "/uploads/laporan/xxx.jpg" }`), auth opsional mengikuti kebijakan laporan anonim.
- Pertimbangkan menyimpan foto ke folder `storage/laporan/` sesuai `UPLOAD_DIR` yang sudah di-mmount di `main.py`.
- **Verifikasi:** upload JPEG 600KB → 201 + URL bisa dibuka; upload `.txt` → 400; upload >5MB → 400.
- Setelah endpoint ini hidup, **catat di `API.md`** agar frontend menghubungkan `FormLaporPage` (lihat workflow FE Fase 3).

### FASE 3 — CRUD Admin Data Master (FEAT-012)
Halaman FE `/dashboard/data-master` kini hanya membaca via `GET /public-spaces`. Tambahkan endpoint tulis (semua `get_current_admin`):
- `PUT/PATCH /public-spaces/{id}` — edit manual ruang publik
- Fasilitas **sudah selesai** (2026-10-04): `/api/v1/admin/facilities` (`GET`/`POST`/`PATCH`/`DELETE` + `POST /import` CSV), lihat `backend/docs/04-api-endpoints.md` §7
- (opsional, bila disepakati) endpoint impor/refresh ETL dari Satu Data
- **Aturan FEAT-012:** perubahan manual tidak boleh hilang saat sinkronisasi ETL berikutnya — pertahankan pola seed idempoten; bila ada kolom yang di-ETL, tentukan strategi merge (minimal: seed tidak menimpa ID yang sudah ada + dokumentasikan).
- **Verifikasi:** edit nama ruang publik via API → berubah di DB → tidak kembali lagi setelah `seed_db` dijalankan ulang.

### FASE 4 — Keamanan (NFR-002)
- Rate limiting pada `POST /api/v1/reports` (mis. middleware sederhana per-IP; tanpa dependency berat bila bisa) untuk cegah spam. **Selesai BE-26:** `RateLimitMiddleware` ASGI di `app/middleware/rate_limit.py`, juga menutup `POST /uploads`, kunci hybrid user/IP, 10 percobaan / 10 menit, balas `429` + `Retry-After`.
- Audit singkat: semua endpoint admin wajib `get_current_admin` (khususnya yang baru); CORS hanya origin FE yang terdaftar; `SECRET_KEY` tidak boleh default di produksi; sandi selalu hash (sudah, passlib+bcrypt — **jangan** sentuh pin `bcrypt==4.2.1`).
- **Verifikasi:** kirim >N laporan cepat dari IP sama → di-throttle; endpoint admin tanpa token → 403.

### FASE 5 — Statistik & Data Dinamis
- `statistics/testimonials` dan `hero-slides` masih hardcode — ada **karakter emoji rusak (mojibake)** di response testimonials. Perbaiki encoding-nya minimal; idealnya pindahkan ke tabel/seed agar bisa diedit.
- **Verifikasi:** response testimonials valid UTF-8 saat dirender FE.

### FASE 6 — Testing
- Buat ulang struktur `backend/tests/` (`unit/`, dst. sesuai `Structure.md`) beserta `conftest.py` (SQLite in-memory, pola lama sebelum folder terhapus).
- Test minimal per PRD Bagian 8: pencarian radius, filter kategori, submit laporan, proteksi endpoint admin, filter status moderasi.
- **Verifikasi (gerbang):**
  ```
  cd "d:\Ruka Jakarta\backend"
  ..\.venv\Scripts\python.exe -m pytest tests\unit -q
  ```
  (Wajib `.venv` — Python global punya httpx/starlette tak kompatibel, lihat `RUNNING.md`.)

### FASE 7 — Dokumentasi Sinkron
- Perbarui `docs/API.md`: tambahkan endpoint baru (uploads, filter mine, CRUD data-master), hapus/hentikan bagian "Belum Ada" yang sudah tidak berlaku, koreksi catatan koordinat.
- **Verifikasi:** tiap baris tabel di `API.md` cocok dengan `/docs` Swagger; tidak ada endpoint aktif yang tidak terdokumentasi.

---

## 10. Aturan Konflik & Catatan Deviasi

Bila temukan pertentangan (mis. `API.md` vs kode vs kebutuhan FE), **jangan pilih diam-diam**. Tulis catatan pendek di tempat kerja/dokumen:

```
Konflik: API.md bilang endpoint X belum ada, kode sudah punya.
Keputusan: pakai kode, perbarui API.md di Fase 7.
```

---

## 11. Dilarang (Banned)

- Endpoint/admin bypass auth
- Menyimpan/mental, API key, atau password apa pun di kode (hanya `.env`, tidak di-commit)
- Menghapus endpoint lama tanpa sinkronisasi FE + `API.md`
- Menambah dependency yang tidak masuk `requirements.txt` tanpa kebutuhan PRD jelas
- Fitur di luar PRD: SLA countdown, penugasan teknisi, kode aset, audit log petugas, dispatch — di luar MVP (pantau juga di UI lewat workflow FE)
- Mengubah response field yang sudah dipakai FE tanpa konflik tercatat

---

## 12. Checklist Penyelesaian Backend

Sebelum menyatakan backend selesai:

- [ ] Stack hidup: Docker sehat, `alembic current` di head, seed jalan
- [ ] Fase 1 selesai: laporan per-pengguna, filter tayang per-ruang publik benar, `POST /categories` terproteksi, enum status tervalidasi
- [x] Upload foto berfungsi (MIME + 5MB tervalidasi, URL bisa diakses)
- [ ] CRUD data-master admin tersedia dan terproteksi
- [x] Rate limiting laporan aktif (BE-26: 10 percobaan / 10 menit per user/IP, `POST /reports` + `POST /uploads`)
- [ ] `pytest tests\unit` hijau di `.venv`
- [ ] `docs/API.md` 100% sinkron dengan Swagger
- [ ] Semua endpoint admin manggil `get_current_admin` (audit grep)
- [ ] Tidak ada file di `apps/web/` yang berubah karena pekerjaan backend ini
