# 04 — Daftar Endpoint API

Kontrak API **diambil dari kode aktif** (`backend/app/api/v1/` + registrasi `api.py`), bukan dari asumsi. Semua path berprefix `/api/v1`.

> **Peringatan kedaluwarsa:** `docs/API.md` (di folder `docs/`) masih menyebut endpoint laporan "belum ada" — itu sudah tidak berlaku; router `laporan` dan `statistics` **sudah aktif**. File ini yang dipakai. Sinkronkan `docs/API.md` setiap ada perubahan (lihat `GIT_WORKFLOW.md`).

Cara cepat melihat kontrak selalu-ikut-kode:

```
GET http://localhost:8000/api/v1/openapi.json
Swagger UI (bisa dicoba langsung): http://localhost:8000/docs
```

---

## 1. Ringkasan Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/health` | — | Liveness (server hidup ≠ DB siap) |
| **Auth** ||||
| `POST` | `/api/v1/auth/login` | — | Tukar email+sandi → token (OAuth2 form) |
| `POST` | `/api/v1/auth/register` | — | Daftar warga baru (role dipaksa `warga`) |
| `GET` | `/api/v1/auth/me` | Token | Profil user yang sedang login |
| **Kategori & Fasilitas** ||||
| `GET` | `/api/v1/categories` | — | Daftar kategori ruang publik |
| `POST` | `/api/v1/categories` | **— ⚠️ BELUM DILINDUNGI** | Buat kategori (seharusnya admin — gap FEAT-014) |
| `GET` | `/api/v1/facilities` | — | Opsi filter fasilitas (aggregate unik) |
| **Ruang Publik** ||||
| `GET` | `/api/v1/public-spaces` | — | Daftar + pencarian + radius + filter |
| `GET` | `/api/v1/public-spaces/stats` | — | Metrik halaman daftar (FEAT-002) |
| `GET` | `/api/v1/public-spaces/{id}` | — | Detail + `fasilitas[]` + `foto[]` |
| `GET` | `/api/v1/public-spaces/{id}/reports` | — | Laporan tayang per ruang publik **(bermasalah, lihat §4)** |
| **Laporan** ||||
| `POST` | `/api/v1/reports` | Token opsional | Kirim laporan (anonim tanpa token) |
| `GET` | `/api/v1/reports` | — | Daftar laporan (filter status/wilayah/q) |
| `GET` | `/api/v1/reports/{id}` | — | Detail + timeline |
| `PATCH` | `/api/v1/reports/{id}/status` | **Admin** | Update status + tulis timeline |
| `GET` | `/api/v1/reports/stats/dashboard` | **Admin** | 4 kartu statistik dashboard |
| `GET` | `/api/v1/reports/stats/moderasi` | **Admin** | Antrian moderasi + selesai pekan ini |
| **Statistik Publik** ||||
| `GET` | `/api/v1/statistics/summary` | — | Ringkasan homepage (total, selesai, %) |
| `GET` | `/api/v1/statistics/testimonials` | — | Testimoni (masih hardcode) |
| `GET` | `/api/v1/statistics/hero-slides` | — | Slide hero (masih hardcode) |
| **Kelola Petugas (Admin)** ||||
| `GET` | `/api/v1/users` | **Admin** | Daftar petugas (`?include_inactive=true`) |
| `POST` | `/api/v1/users` | **Admin** | Tambah petugas (role dipaksa `admin`) |
| `PATCH` | `/api/v1/users/{user_id}` | **Admin** | Ganti nama / reset sandi |
| `DELETE` | `/api/v1/users/{user_id}` | **Admin** | Nonaktifkan (bukan hapus) |
| `POST` | `/api/v1/users/{user_id}/activate` | **Admin** | Aktifkan kembali |
| **Static** ||||
| `GET` | `/uploads/<path>` | — | File upload dari `storage/` (via `UPLOAD_DIR`) |

---

## 2. Auth

### `POST /api/v1/auth/login`
Content-Type **`application/x-www-form-urlencoded`** (bukan JSON). Field mengikuti OAuth2 password flow → field `username` diisi **email**.

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=petugas@jakarta.go.id&password=RukaJakarta2026"
```
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```
| Status | Kapan |
|---|---|
| `200` | Berhasil |
| `400` | Email/sandi salah |
| `403` | Akun `is_active=false` |

Token berlaku **7 hari** (`ACCESS_TOKEN_EXPIRE_MINUTES`), subject = `user.id`, HS256 + `SECRET_KEY`.

### `POST /api/v1/auth/register`
Body JSON. Role selalu dipaksa `warga` — nilai lain ditolak `400` (keamanan: admin tidak bisa dibuat dari sini).

```json
{ "name": "Budi Santoso", "email": "budi@contoh.id", "password": "sandi-minimal-8", "role": "warga" }
```
| Status | Kapan |
|---|---|
| `201` | Terdaftar |
| `400` | Email terpakai / role di luar daftar publik |
| `422` | Email tidak valid / sandi < 8 karakter |

### `GET /api/v1/auth/me`
Header `Authorization: Bearer <token>` → response `UserResponse` (id, name, email, role, is_active, created_at, updated_at). `401` tanpa/ kedaluwarsa token; `403` akun dinonaktifkan.

---

## 3. Ruang Publik

### `GET /api/v1/public-spaces` — pencarian utama

| Query | Tipe | Default | Keterangan |
|---|---|---|---|
| `lat` / `long` | float | — | Titik acuan (wajib berdua untuk jarak) |
| `radius` | float | — | **Satuan KM**, harus > 0 |
| `category` | string | — | Filter `kategori_id` |
| `facilities` | string[] | — | **Semua** wajib tersedia (AND); ulang per nilai |
| `q` | string | — | Cari nama/alamat (LIKE, case-insensitive) |
| `wilayah` | string | — | Filter wilayah persis |
| `skip` / `limit` | int | 0 / 100 | `limit` 1..500 |

```bash
curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3&category=taman"
```
Response: array `RuangPublikListResponse` — `id, nama, kategori_id, kategori{...}, wilayah, alamat, latitude, longitude, verified, jarak_km`.

Catatan: Haversine dihitung **di SQL** (bukan Python). Baris tanpa koordinat selalu dibuang saat pencarian radius. Tanpa `lat/long` → `jarak_km: null`, urutan alfabet.

### `GET /api/v1/public-spaces/stats`
```json
{ "total_ruang_publik": 5542, "status_prima": 120, "perlu_perhatian": 45 }
```
`status_prima` = fasilitas `status="baik"`; `perlu_perhatian` = semua yang **bukan** baik (termasuk `NULL`).

### `GET /api/v1/public-spaces/{id}`
Detail `RuangPublikDetailResponse` = field list + `fasilitas: [...]` + `foto: ["..."]` (dibungkus dari `image_url` tunggal) + `field_source: {...}` (penanda kolom hasil edit admin, `null` bila belum pernah diedit — FEAT-012). `404` bila id tak ada.

### `GET /api/v1/public-spaces/{id}/reports`
Laporan tayang untuk 1 ruang publik, query `skip`/`limit`.
> ⚠ **Bug terverifikasi:** filter di service memakai `status IN ("disetujui","tayang_otomatis")` — nilai itu tidak pernah ada di DB → selalu `[]`. Perbaikan: `features/moderation-service.md` (FEAT-010).

### `GET /api/v1/facilities`
```json
[ { "nama": "Toilet Umum", "kategori": "Sanitasi" } ]
```

### `GET /api/v1/categories`
Query `skip` (0), `limit` (100) → `[{ "id": "taman", "label": "Taman", "icon_name": null }]`.
`POST /api/v1/categories` body `{ "id": "...", "label": "...", "icon_name": "..." }` — **masih tanpa proteksi auth** (harusnya `get_current_admin`, gap FEAT-014).

---

## 4. Laporan

### `POST /api/v1/reports` (FEAT-008/009)
Body JSON `LaporanCreate`:

```json
{
  "ruang_publik_id": "rth-1a407d88182a",
  "fasilitas_id": null,
  "jenis_masalah": "Fasilitas Rusak",
  "deskripsi": "Lampu jalan taman mati sejak minggu lalu",
  "mode_identitas": "anonim",
  "foto_url": null
}
```
| Status | Kapan |
|---|---|
| `201` | Berhasil — status awal `menunggu_verifikasi`, timeline `Laporan dikirim` dibuat |
| `400` | Mode `tampilkan_nama` tapi tanpa token / user tidak ditemukan |

Aturan: token **opsional** (kirim header `Authorization` bila login). `nama_pelapor` **tidak pernah** diambil dari payload — diisi server dari user login (anti-spoofing).
> `foto_url` masih selalu `null` karena **endpoint upload belum ada** — gap FEAT-008.

### `GET /api/v1/reports`
Query: `status` (persis, `"semua"` = tanpa filter), `wilayah`, `q` (LIKE jenis_masalah/deskripsi), `skip`, `limit`.
> ⚠ **Gap FEAT-013:** belum ada param pemilik → "Laporan Saya" akan melihat semua laporan. Service `get_reports()` **sudah menerima `user_id`** — tinggal router. Rincian: `features/report-service.md`.

### `GET /api/v1/reports/{id}`
`LaporanDetailResponse` = field laporan + `user{...}` (bisa null) + `timeline[{status,title,description,created_at,...}]`. `404` bila tak ada.

### `PATCH /api/v1/reports/{id}/status` — **Admin** (FEAT-011)
```json
{ "status": "dalam_penanganan", "title": "Status diperbarui", "description": "Opsional" }
```
→ update status + tambah baris timeline. `404` bila laporan tak ada.
> ⚠ **Gap:** `status` belum divalidasi terhadap enum → bisa menulis nilai sembarangan. Perbaikan: `features/moderation-service.md`.

### `GET /api/v1/reports/stats/dashboard` — Admin
```json
{ "total_laporan": 42, "menunggu_verifikasi": 7, "dalam_penanganan": 5, "selesai": 30 }
```

### `GET /api/v1/reports/stats/moderasi` — Admin
```json
{ "antrian_moderasi": 7, "selesai_pekan_ini": 3 }
```
`selesai_pekan_ini` dihitung dari `laporan_timeline` (kapan status benar jadi `selesai`), awal pekan = Senin.

---

## 5. Statistik Publik

### `GET /api/v1/statistics/summary`
```json
{ "total_ruang_publik": 5542, "total_laporan_selesai": 30, "laporan_bulan_ini": 12, "tingkat_penyelesaian_persen": 71 }
```
`/statistics/testimonials` dan `/statistics/hero-slides` → masih **hardcode di kode**, testimonials mengandung karakter emoji rusak (mojibake) — lihat gap di `features/moderation-service.md` §Statistik.

---

## 6. Kelola Petugas (Admin, FEAT-014)

Semua butuh role `admin` **dan** `is_active=true`; warga → `403`.

| Endpoint | Body / Query | Catatan |
|---|---|---|
| `GET /users` | `?include_inactive=true` | Default hanya aktif |
| `POST /users` | `{ name, email, password }` | Role **dipaksa `admin`** (schema `AdminCreate` tanpa field role) → `201`; `400` email terpakai |
| `PATCH /users/{id}` | `{ name? , password? }` | Email tidak bisa diganti; boleh ubah akun sendiri |
| `DELETE /users/{id}` | — | **Nonaktifkan** (`is_active=false`); `409` admin aktif terakhir; `400` akun sendiri |
| `POST /users/{id}/activate` | — | Kembalikan akses |

Detail logika & urutan pengerjaan gap: `features/admin-auth.md`.

---

## 7. Gap Endpoint (belum ada — dibutuhkan PRD/FE)

| Gap | FEAT | Konsumen FE | Rencana |
|---|---|---|---|
| Upload foto (`multipart`) → `{ url }` | 008 | `FormLaporPage` (foto wajib) | `features/report-service.md` |
| Filter laporan per-pengguna (`mine=true` / `/reports/mine`) | 013 | `getUserReports` → Laporan Saya | `features/report-service.md` |
| CRUD ruang publik & fasilitas (admin) | 012 | `/dashboard/data-master`, `/dashboard/fasilitas` | `features/data-master-service.md` |
| Proteksi `POST /categories` | 014 | — | `features/admin-auth.md` |
| Validasi enum status PATCH | 011 | stepper/badge FE | `features/moderation-service.md` |
| Rate limit `POST /reports` | NFR-002 | — | `features/report-service.md` |
| Refresh/logout token | — | sesi aman | `features/admin-auth.md` (opsional) |
| Galeri foto laporan lolos moderasi | 007 | halaman detail | `features/public-space-service.md` |

---

## 8. Verifikasi Kontrak

1. Nyalakan backend (`05-environment-setup.md`).
2. Buka `/docs` → bandingkan daftar operasi dengan §1 — tidak boleh ada endpoint aktif yang tidak terdokumentasi di sini.
3. Jalankan minimal satu curl per grup (auth, public-spaces, reports, users-admin) dan cocokkan status code dengan tabel.
4. Bila menambah/mengubah endpoint: perbarui tabel ini **dan** `docs/API.md` di sesi yang sama.
