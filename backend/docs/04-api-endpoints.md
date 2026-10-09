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
| **Kelola Fasilitas (Admin)** ||||
| `GET` | `/api/v1/admin/facilities` | **Admin** | Semua baris fasilitas + nama induk (`q`/`kategori`/`status`/`wilayah`, `skip`/`limit`) |
| `POST` | `/api/v1/admin/facilities` | **Admin** | Tambah fasilitas; `201`, `404` induk tak ada, `400` body tak valid |
| `PATCH` | `/api/v1/admin/facilities/{id}` | **Admin** | Ubah sebagian field (nama, kategori, status, deskripsi, induk) |
| `DELETE` | `/api/v1/admin/facilities/{id}` | **Admin** | Hapus; `409` kalau masih jadi rujukan laporan |
| `POST` | `/api/v1/admin/facilities/import` | **Admin** | Impor CSV `multipart/form-data`; hasil parsial `{created, failed, errors}` |
| **Sinkronisasi Satu Data (Admin)** ||||
| `POST` | `/api/v1/admin/sync-data` | **Admin** | Trigger manual pipeline ETL penuh; `409` bila run lain masih berjalan |
| `GET` | `/api/v1/admin/sync-data` | **Admin** | Riwayat run ETL terakhir (`limit` 1..200, default 20), terbaru di atas |
| **Ruang Publik** ||||
| `GET` | `/api/v1/public-spaces` | — | Daftar + pencarian + radius + filter (`fasilitas[]` ringkas + `stats{}` per baris) |
| `GET` | `/api/v1/public-spaces/stats` | — | Metrik halaman daftar (FEAT-002) |
| `GET` | `/api/v1/public-spaces/{id}` | — | Detail + `fasilitas[]` + `foto[]` (resmi + laporan tayang, BE-48) + `stats{}` |
| `GET` | `/api/v1/public-spaces/{id}/reports` | — | Laporan tayang per ruang publik (filter `STATUS_TAYANG`, BE-47) |
| **Kelola Foto Ruang Publik (Admin)** ||||
| `GET` | `/api/v1/admin/public-spaces/{id}/photos` | **Admin** | Daftar foto resmi, urut terlama |
| `POST` | `/api/v1/admin/public-spaces/{id}/photos` | **Admin** | Unggah foto resmi (multipart `file`) → `201` |
| `DELETE` | `/api/v1/admin/public-spaces/{id}/photos/{foto_id}` | **Admin** | Hapus satu foto resmi; `404` bila tak ada |
| **Laporan** ||||
| `POST` | `/api/v1/reports` | Token opsional | Kirim laporan (anonim tanpa token) |
| `GET` | `/api/v1/reports` | - | Daftar laporan **tayang saja** (filter status/wilayah/q) |
| `GET` | `/api/v1/reports/mine` | **Login** | Riwayat laporan milik pemanggil, semua status (BE-50) |
| `GET` | `/api/v1/reports/{id}` | Pemilik/Anonim/Admin | Detail + timeline; berpemilik lain -> 403 (BE-52) |
| `GET` | `/api/v1/reports/{id}/status` | Token opsional | Status + timeline untuk pelapor (BE-24) |
| `POST` | `/api/v1/reports/{id}/flag` | **Login** | Tandai laporan tayang tidak pantas (BE-25) |
| `PATCH` | `/api/v1/reports/{id}/status` | **Admin** | Update status + tulis timeline |
| `GET` | `/api/v1/reports/stats/dashboard` | **Admin** | 4 kartu statistik dashboard |
| `GET` | `/api/v1/reports/stats/moderasi` | **Admin** | Antrian moderasi + selesai pekan ini |
| `GET` | `/api/v1/admin/reports` | **Admin** | Antrian tinjauan: semua status, filter `status` kanonik/`semua` (BE-28/BE-52) |
| `GET` | `/api/v1/admin/reports/flagged` | **Admin** | Daftar laporan ter-flag pengguna lain + `flag_count`, urut terbanyak (BE-31) |
| `POST` | `/api/v1/admin/reports/{id}/approve` | **Admin** | Setujui laporan: status -> `diverifikasi` + timeline (BE-29) |
| `POST` | `/api/v1/admin/reports/{id}/reject` | **Admin** | Tolak laporan: status -> `ditolak` + alasan wajib tersimpan (BE-30) |
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
| **Upload & Static** ||||
| `POST` | `/api/v1/uploads` | - | Upload file bukti foto laporan (JPEG/PNG/WebP, <= 5MB) |
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
Response: array `RuangPublikListResponse`: `id, nama, kategori_id, kategori{...}, wilayah, alamat, latitude, longitude, verified, jarak_km, fasilitas[{id, nama, status}], stats{baik, perlu_perhatian, rusak}`.

Catatan: Haversine dihitung **di SQL** (bukan Python). Baris tanpa koordinat selalu dibuang saat pencarian radius. Tanpa `lat/long` → `jarak_km: null`, urutan alfabet.

`fasilitas` sengaja ringkas (3 field) karena tarikan bisa sampai 500 baris; `deskripsi`/`created_at` tidak ikut. `stats` adalah tiga ember yang **saling lepas**; jumlahnya selalu = jumlah baris `fasilitas`, berbeda dengan `GET /public-spaces/stats` yang menghitung dua ember.

### `GET /api/v1/public-spaces/stats`
```json
{ "total_ruang_publik": 5542, "status_prima": 120, "perlu_perhatian": 45 }
```
`status_prima` = fasilitas `status="baik"`; `perlu_perhatian` = semua yang **bukan** baik (termasuk `NULL`).

### `GET /api/v1/public-spaces/{id}`
Detail `RuangPublikDetailResponse` = field list + `kecamatan`/`kelurahan` (BE-16) + `fasilitas: [...]` (penuh) + `foto: ["..."]` + `stats{...}` (versi penuh dari `fasilitas`, kunci sama dengan list) + `field_source: {...}` (penanda kolom hasil edit admin, `null` bila belum pernah diedit, sesuai FEAT-012). `404` bila id tak ada.

`foto[]` = **galeri gabungan** hasil `services/ruang_publik.gabung_foto` (BE-48): foto resmi dari tabel
`ruang_publik_foto` (urut terlama, `image_url` lama ikut bila belum punya baris) + `foto_url` laporan
ber-status `STATUS_TAYANG` (urut terbaru), duplikat dibuang. Kontrak tetap `list[str]`.

### `GET /api/v1/public-spaces/{id}/reports`
Laporan tayang untuk 1 ruang publik, query `skip`/`limit`. Filter memakai `STATUS_TAYANG`
(`diverifikasi`/`dalam_penanganan`/`selesai`, definisi tunggal di `schemas/laporan.py`) — bug lama
(`status IN ("disetujui","tayang_otomatis")` yang selalu menghasilkan `[]`) sudah diperbaiki oleh **BE-47**;
regresinya dijaga `tests/unit/test_public_space_reports.py`.

### Data master ruang publik (admin, BE-32)

Prefix `/api/v1/admin/public-spaces`, semua butuh role `admin`; tanpa token → `401`, warga → `403`.

| Endpoint | Query | Catatan |
|---|---|---|
| `GET /admin/public-spaces` | `?q=&category=&wilayah=&diedit_manual=&skip=&limit=` | `limit` 1..500 (default 100). Semua kolom `RuangPublikResponse` + `field_source` + `jumlah_fasilitas` + `stats{baik, perlu_perhatian, rusak}` |

`q` mencari nama/alamat/wilayah (LIKE, case-insensitive). `category` = `kategori_id` (nama sama dengan endpoint publik). `diedit_manual=true` hanya baris yang pernah disunting admin (`field_source` terisi), `false` yang masih murni sumber. Urut `nama`, `id` sebagai pemecah seri. `field_source` adalah penanda kolom hasil edit manual (FEAT-012, lihat §4 strategi merge).

### Kelola foto resmi (admin, BE-48)
Prefix `/api/v1/admin/public-spaces`, semua butuh role `admin`; tanpa token → `401`, warga → `403`.

| Endpoint | Body | Catatan |
|---|---|---|
| `GET /admin/public-spaces/{id}/photos` | — | `404` bila ruang publik tak ada. Response `list[RuangPublikFotoResponse]` |
| `POST /admin/public-spaces/{id}/photos` | `multipart` field `file` | Validasi gambar (MIME + magic bytes + ukuran), disimpan ke `uploads/ruang-publik/`; `201` |
| `DELETE /admin/public-spaces/{id}/photos/{foto_id}` | — | `404` bila foto tak ada atau bukan milik `{id}`. File di disk dibiarkan |

### `GET /api/v1/facilities`
```json
[ { "nama": "Bangku Taman", "kategori": "Perabot" }, { "nama": "Pohon Peneduh", "kategori": "Tanaman" } ]
```
Katalog hasil `SELECT DISTINCT nama, kategori ... ORDER BY nama`: saat ini 12 baris dari `data/processed/fasilitas.csv`, dipakai FE mengisi dropdown filter.

### `GET /api/v1/categories`
Query `skip` (0), `limit` (100) → `[{ "id": "taman", "label": "Taman", "icon_name": null }]`.
`POST /api/v1/categories` body `{ "id": "...", "label": "...", "icon_name": "..." }` — **masih tanpa proteksi auth** (harusnya `get_current_admin`, gap FEAT-014).

---

## 4. Laporan & Upload

### `POST /api/v1/uploads` (BE-49)
Upload berkas foto bukti fisik masalah fasilitas (multipart/form-data). Endpoint publik tanpa mewajibkan auth (mendukung pelaporan anonim). Berkas disimpan di `storage/laporan/<uuid.hex><ext>` dengan nama acak.

- **Content-Type:** `multipart/form-data`
- **Field:** `file` (`UploadFile`)
- **Format diizinkan:** `image/jpeg`, `image/png`, `image/webp`
- **Batas ukuran:** 5 MB (`settings.MAX_UPLOAD_SIZE`)
- **Validasi:** MIME whitelist, ukuran berkas, dan magic bytes header.

**Response Berhasil (201 Created):**
```json
{
  "url": "/uploads/laporan/9fd34df4046e45458173186dfa329515.jpg"
}
```

| Status | Kapan |
|---|---|
| `201` | Berkas valid tersimpan di disk, mengembalikan URL unik |
| `400` | Ekstensi/MIME non-gambar, berkas > 5MB, atau magic bytes rusak/samaran |
| `422` | Request tanpa field `file` |
| `429` | Melewati rate limit (BE-26): 10 percobaan `POST /reports` + `POST /uploads` per kunci per 10 menit; header `Retry-After` berisi sisa detik |

### `POST /api/v1/reports` (BE-20 / BE-46)
Body JSON `LaporanCreate`:

```json
{
  "ruang_publik_id": "rth-1a407d88182a",
  "fasilitas_id": "seed-ebf61eee35566d78-1",
  "jenis_masalah": "Fasilitas Rusak",
  "deskripsi": "Lampu jalan taman mati sejak minggu lalu",
  "mode_identitas": "anonim",
  "foto_url": "/uploads/laporan/9fd34df4046e45458173186dfa329515.jpg",
  "lat_user": -6.192,
  "long_user": 106.823
}
```

| Status | Kapan |
|---|---|
| `201` | Berhasil — status awal `menunggu_verifikasi`, timeline `Laporan dikirim` dibuat |
| `400` | Foto wajib belum diunggah, `foto_url` tidak berprefix `/uploads/laporan/`, file foto tidak ditemukan di disk, mode `tampilkan_nama` tanpa token, atau koordinat parsial |
| `422` | Koordinat `lat_user` / `long_user` di luar rentang valid (-90..90 dan -180..180) |
| `429` | Melewati rate limit (BE-26) — hitungan gabungan dengan `POST /uploads`; kunci = user id (token valid) atau IP; header `Retry-After` |

Aturan:
- Dependency auth memakai `oauth2_scheme_optional` agar pengguna anonim tanpa token **tidak tertolak 401**.
- Rate limit in-process (BE-26, NFR-002): `POST /reports` dan `POST /uploads` berbagi satu hitungan per kunci — 10 percobaan / 10 menit, semua percobaan dihitung (termasuk 400/422). Mati-matian lewat `RATE_LIMIT_ENABLED`.
- Foto bukti fisik **wajib diunggah** (`foto_url` tidak boleh kosong).
- Koordinat browser pengguna bersifat opsional (dapat dikirim null jika browser menolak izin lokasi), namun bila salah satu diisi maka keduanya wajib lengkap.
- `nama_pelapor` **tidak pernah** diambil dari payload klien; jika login, diambil aman dari database akun user aktif (anti-spoofing).

### `GET /api/v1/reports`
Query: `status` (persis, `"semua"` = tanpa filter), `wilayah`, `q` (LIKE jenis_masalah/deskripsi), `skip`, `limit`.
> **Sejak BE-52:** hanya mengembalikan laporan **tayang** (`STATUS_TAYANG`: `diverifikasi`, `dalam_penanganan`, `selesai`) tanpa peduli token. Antrian moderasi (semua status) pindah ke `GET /admin/reports`.

### `GET /api/v1/reports/mine` (BE-50, FEAT-013)
Riwayat "Laporan Saya": daftar laporan milik pemanggil, **semua status** (termasuk `menunggu_verifikasi`/`ditolak`). Auth wajib (`Bearer` token) → `401` tanpa token atau token rusak. Query sama dengan `GET /reports` (`status`, `wilayah`, `q`, `skip`, `limit`) dan tetap terkombinasi dengan pemilik. Laporan anonim yang dibuat sambil login tetap muncul di sini (`user_id` terisi, identitas tetap tertutup untuk publik). Admin melihat laporan dia sendiri; semua-laporan-admin = `GET /admin/reports` (BE-52).

### `GET /api/v1/reports/{id}`
`LaporanDetailResponse` = field laporan + `user{...}` (bisa null) + `timeline[{status,title,description,created_at,...}]`.

Aturan akses (BE-52, helper `_boleh_lihat` - sama dengan `GET /{id}/status`):
- Laporan berpemilik: hanya pemilik atau admin (token wajib); selain itu `403`; tanpa token `403`.
- Laporan anonim penuh (`user_id` null): terbuka dengan bukti id UUID (`200` tanpa token).
- Id tidak dikenal: `404`.

### `GET /api/v1/admin/reports` - **Admin** (BE-28 / BE-52)
Antrian tinjauan admin - menggantikan pemakaian `GET /reports` untuk moderasi.

- **Auth:** `Depends(get_current_admin)` → `401` tanpa token, `403` untuk role selain admin.
- **Query:** `status` (harus `STATUS_KANONIK` atau `"semua"`; nilai lain → `422`), `wilayah`, `q`, `skip`, `limit` - sama dengan `GET /reports`.
- **Response:** `List[LaporanResponse]` identik (FE cukup ganti URL).
- **Catatan:** parameter `flagged` menyusul di `GET /admin/reports/flagged` (BE-31).

| Status | Kapan |
|---|---|
| `200` | Daftar laporan sesuai filter (semua status bila tanpa filter) |
| `401` | Tanpa token |
| `403` | Token bukan admin / akun nonaktif |
| `422` | `status` di luar kanonik (mis. `menunggu_tinjauan`) |

### `GET /api/v1/admin/reports/flagged` - **Admin** (BE-31)
Daftar laporan yang di-flag pengguna lain (hasil `POST /reports/{id}/flag`), terpisah dari antrian.

- **Auth:** `Depends(get_current_admin)` → `401` tanpa token, `403` untuk role selain admin.
- **Query:** `skip`, `limit` (1..500, default 100). Tanpa filter status/wilayah.
- **Response:** `List[LaporanResponse]` dengan field tambahan `flag_count` (= jumlah pelapor berbeda).
- **Urutan:** `flag_count` desc, lalu waktu flag terbaru desc (laporan paling bermasalah di atas).
- **Catatan:** `flag_count` hanya terisi di endpoint ini; jalur publik tetap `null`.

| Status | Kapan |
|---|---|
| `200` | Daftar laporan ter-flag (kosong `[]` bila belum ada) |
| `401` | Tanpa token |
| `403` | Token bukan admin / akun nonaktif |

### `POST /api/v1/admin/reports/{id}/approve` - **Admin** (BE-29)
Setujui laporan: status jadi `diverifikasi` (tayang) + baris timeline berjudul "Laporan disetujui".

- **Auth:** `Depends(get_current_admin)` → `401` tanpa token, `403` untuk role selain admin.
- **Body (opsional):** `{ "description": "catatan petugas" }`; tanpa body memakai deskripsi default `Status diubah menjadi diverifikasi`.
- **Response:** `LaporanDetailResponse` (sama dengan `PATCH /{id}/status`).
- **Guard:** hanya laporan `menunggu_verifikasi` atau `ditolak`; status lain (termasuk sudah tayang) → `409`.

| Status | Kapan |
|---|---|
| `200` | Berhasil; laporan kini tayang dan muncul di `GET /reports` publik |
| `401` | Tanpa token |
| `403` | Token bukan admin / akun nonaktif |
| `404` | Id tidak dikenal |
| `409` | Status sekarang di luar `menunggu_verifikasi`/`ditolak` |

### `POST /api/v1/admin/reports/{id}/reject` - **Admin** (BE-30)
Tolak laporan: status jadi `ditolak` (hilang dari daftar publik) + baris timeline "Laporan ditolak".

- **Auth:** `Depends(get_current_admin)` → `401` tanpa token, `403` untuk role selain admin.
- **Body (wajib):** `{ "alasan": "foto tidak sesuai lokasi" }`; kosong/whitespace → `422`.
- **Response:** `LaporanDetailResponse`; field `alasan_penolakan` terisi dan ikut terlihat di daftar/detail.
- **Guard:** semua status boleh ditolak (laporan tayang boleh diturunkan); yang sudah `ditolak` → `409`.

| Status | Kapan |
|---|---|
| `200` | Berhasil; laporan `ditolak`, `alasan_penolakan` tersimpan, timeline +1 |
| `401` | Tanpa token |
| `403` | Token bukan admin / akun nonaktif |
| `404` | Id tidak dikenal |
| `409` | Laporan sudah `ditolak` |
| `422` | `alasan` tidak dikirim / kosong |

### `GET /api/v1/reports/{id}/status` (BE-24, FEAT-010)
`LaporanStatusResponse` = `id`, `status`, `created_at`, `updated_at`, `timeline[...]`. Tanpa deskripsi, foto, dan nama pelapor.

Aturan akses (`app/api/v1/laporan.py::read_report_status`):
- Laporan berpemilik: token wajib, hanya pemilik atau admin yang akunnya aktif; selain itu `403`.
- Laporan anonim penuh (`user_id` null): cukup id UUID-nya, tanpa token (`200`).
- Id tidak dikenal: `404`.

```bash
curl http://localhost:8000/api/v1/reports/<id>/status -H "Authorization: Bearer <token>"
```

### `PATCH /api/v1/reports/{id}/status` — **Admin** (FEAT-011, BE-51)
```json
{ "status": "dalam_penanganan", "title": "Status diperbarui", "description": "Opsional" }
```
→ update status + tambah baris timeline.

Aturan (BE-51, 2026-10-08):
- `status` **wajib** salah satu `STATUS_KANONIK` (`menunggu_verifikasi`, `diverifikasi`, `dalam_penanganan`, `selesai`, `ditolak`) → nilai lain `422`.
- **Transisi** dijaga (`TRANSISI_IZIN`): lompatan mundur (`selesai`/`dalam_penanganan` → `menunggu_verifikasi`/`diverifikasi`) → `422`; `ditolak` dari status mana pun, `ditolak` → `diverifikasi`, dan status sama (idempotent) diizinkan.
- `401` tanpa token · `403` bukan admin · `404` id tidak dikenal.

### `POST /api/v1/reports/{id}/flag` — **Login** (BE-25, FEAT-011)
Tanpa body. Response `201` `{ "laporan_id": "...", "flag_count": 2 }` (`flag_count` = jumlah pelapor berbeda).

Aturan akses (`services/laporan.py::flag_laporan`):
- Wajib `Authorization: Bearer <token>` → tanpa token `401`.
- Hanya laporan `STATUS_TAYANG` (`diverifikasi`/`dalam_penanganan`/`selesai`) → selain itu `400`.
- Pelapor sendiri tidak boleh melaporkan laporannya sendiri → `403`.
- Satu flag per pengguna (unique `uq_laporan_flag_pengguna`) → dobel `409`.
- Id tidak dikenal `404`. Flag **tidak** mengubah status laporan; daftar hasilnya = BE-31.

```bash
curl -X POST http://localhost:8000/api/v1/reports/<id>/flag -H "Authorization: Bearer <token>"
```

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

## 7. Kelola Fasilitas (Admin, BE-53)

Prefix `/api/v1/admin/facilities`, semua butuh role `admin` (`get_current_admin`); tanpa token → `401`, warga → `403`.

| Endpoint | Body / Query | Catatan |
|---|---|---|
| `GET /admin/facilities` | `?q=&kategori=&status=&wilayah=&skip=&limit=` | `limit` 1..500 (default 100). Response punya `ruang_publik_nama` via join |
| `POST /admin/facilities` | `{ nama, ruang_publik_id, kategori?, status?, deskripsi? }` | `201`; `400` status di luar `baik/perlu_perhatian/rusak`; `404` induk tak ada |
| `PATCH /admin/facilities/{id}` | sebagian field di atas | Field kosong/diisi ulang dinormalisasi (strip, status di-lowercase) |
| `DELETE /admin/facilities/{id}` | — | `409` bila `laporan.fasilitas_id` masih menunjuk baris ini |
| `POST /admin/facilities/import` | `file` CSV multipart | Wajib `.csv` ≤1MB, ≤2000 baris, header `nama` + `ruang_publik_id`\|`ruang_publik_nama`; dibuat per baris, baris gagal dikembalikan di `errors` |

Keputusan path (nested `POST /public-spaces/{id}/fasilitas` ditolak): `features/data-master-service.md` §2.2.

---

## 8. Sinkronisasi Satu Data (Admin, BE-18 / BE-19)

Prefix `/api/v1/admin/sync-data`, butuh role `admin` (`get_current_admin`); tanpa token → `401`, warga → `403`.

| Endpoint | Body / Query | Catatan |
|---|---|---|
| `POST /admin/sync-data` | - (tanpa body) | Jalankan pipeline penuh extract → transform → seed (sama seperti scheduler BE-17, `--once`). `409` bila run manual lain masih berjalan (`threading.Lock` di proses API). Run selesai dengan tahap gagal tetap `200` + `status: "gagal"` |
| `GET /admin/sync-data` | `limit` (1..200, default 20) | Riwayat baris `etl_run`, urut id menurun (terbaru di atas). Response `list[RiwayatItem]` |

Response `SyncResult` (`app/schemas/sync.py`):

```json
{
  "status": "sukses",
  "mulai": "2026-10-04T08:00:00Z",
  "selesai": "2026-10-04T08:00:19Z",
  "total_detik": 19,
  "tahap": [
    { "tahap": "extract_satudata", "status": "sukses", "detik": 12, "log": ["..."] },
    { "tahap": "transform_rth_raw", "status": "sukses", "detik": 4, "log": ["..."] },
    { "tahap": "seed_db", "status": "sukses", "detik": 3, "log": ["..."] }
  ],
  "tahap_gagal": null
}
```

`log` dipotong ke 100 baris terakhir per tahap. `tahap_gagal` terisi (dan tahap berikutnya tidak
dijalankan) bila ada tahap yang gagal. Lock hanya se-proses API: run scheduler terjadwal (proses
terpisah) tidak saling terkunci.

Response `RiwayatItem` (`app/schemas/sync.py`) untuk `GET`:

```json
[
  {
    "id": 3,
    "pemicu": "sekali",
    "status": "sukses",
    "mulai": "2026-10-05T05:03:34Z",
    "selesai": "2026-10-05T05:04:02Z",
    "tahap_gagal": null,
    "hitung": { "baru": 0, "diupdate": 0, "tanpa_perubahan": 1200 },
    "tahap": [
      { "tahap": "extract_satudata", "status": "sukses", "detik": 23, "log": ["..."] },
      { "tahap": "transform_rth_raw", "status": "sukses", "detik": 1, "log": ["..."] },
      { "tahap": "seed_db", "status": "sukses", "detik": 1, "log": ["..."] }
    ]
  }
]
```

`pemicu` berisi `manual` (BE-18), `terjadwal` (BE-17), atau `sekali` (`--once`). `hitung` terisi
hanya bila tahap `seed_db` sukses; `tahap_gagal` berisi nama tahap pada run `gagal`, dan
`selesai` masih `null` selama statusnya `berjalan`. Waktu dikirim ber-UTC (akhiran `Z`) supaya
browser membaca zona waktu yang benar.

---

## 9. Gap Endpoint (belum ada — dibutuhkan PRD/FE)

| Gap | FEAT | Konsumen FE | Rencana |
|---|---|---|---|
| Edit ruang publik (admin) | 012 | `/dashboard/data-master` | `PATCH /admin/public-spaces/{id}` (BE-33); list admin sudah ada §3 (BE-32) |
| Proteksi `POST /categories` | 014 | — | `features/admin-auth.md` |
| Validasi enum status PATCH | 011 | stepper/badge FE | `features/moderation-service.md` |
| Refresh/logout token | — | sesi aman | `features/admin-auth.md` (opsional) |

---

## 10. Verifikasi Kontrak

1. Nyalakan backend (`05-environment-setup.md`).
2. Buka `/docs` → bandingkan daftar operasi dengan §1 — tidak boleh ada endpoint aktif yang tidak terdokumentasi di sini.
3. Jalankan minimal satu curl per grup (auth, public-spaces, reports, users-admin) dan cocokkan status code dengan tabel.
4. Bila menambah/mengubah endpoint: perbarui tabel ini **dan** `docs/API.md` di sesi yang sama.
