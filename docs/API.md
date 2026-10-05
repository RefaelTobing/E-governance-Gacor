# Daftar Endpoint API

Semua endpoint diawali `/api/v1`. Dokumentasi ini diambil dari OpenAPI server
yang sedang jalan (`/api/v1/openapi.json`), bukan dari asumsi.

Cara cepat melihat daftar yang selalu ikut sinkron dengan kode:

```
GET http://localhost:8000/api/v1/openapi.json
```

Swagger UI: <http://localhost:8000/docs>

---

## Ringkasan

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `POST` | `/api/v1/auth/login` | — | Tukar email+sandi jadi token |
| `POST` | `/api/v1/auth/register` | — | Daftar warga baru |
| `GET` | `/api/v1/auth/me` | Token | Profil user yang sedang login |
| `GET` | `/api/v1/categories` | — | Daftar kategori ruang publik |
| `POST` | `/api/v1/categories` | — | Buat kategori baru |
| `GET` | `/api/v1/facilities` | — | Opsi filter fasilitas |
| `GET` | `/api/v1/public-spaces` | — | Daftar + pencarian ruang publik |
| `GET` | `/api/v1/public-spaces/{ruang_publik_id}` | — | Detail satu ruang publik |
| `GET` | `/api/v1/public-spaces/{ruang_publik_id}/reports` | — | Laporan pada satu ruang publik |
| `POST` | `/api/v1/uploads` | - | Upload file foto bukti fisik (JPEG/PNG/WebP, <= 5MB) |
| `POST` | `/api/v1/reports` | Opsional | Submit laporan masalah fasilitas (foto wajib, koordinat opsional) |
| `GET` | `/api/v1/reports` | - | Daftar laporan masyarakat (filter status, wilayah, query) |
| `GET` | `/api/v1/reports/{report_id}` | - | Detail satu laporan beserta riwayat timeline |
| `PATCH` | `/api/v1/reports/{report_id}/status` | **Admin** | Perbarui status proses laporan fasilitas |
| `GET` | `/api/v1/reports/stats/moderasi` | **Admin** | Statistik antrian moderasi untuk dashboard admin |
| `GET` | `/api/v1/users` | **Admin** | Daftar petugas |
| `POST` | `/api/v1/users` | **Admin** | Tambah petugas |
| `PATCH` | `/api/v1/users/{user_id}` | **Admin** | Ganti nama / reset sandi |
| `DELETE` | `/api/v1/users/{user_id}` | **Admin** | Nonaktifkan petugas |
| `POST` | `/api/v1/users/{user_id}/activate` | **Admin** | Aktifkan kembali |
| `POST` | `/api/v1/admin/sync-data` | **Admin** | Trigger manual pipeline ETL dari panel admin |
| `GET` | `/api/v1/admin/sync-data` | **Admin** | Riwayat run ETL terakhir (`?limit=`, 1..200) |

---

## Auth

### `GET /health`

Dipakai memastikan proses server hidup. **Tidak** memastikan database siap —
endpoint ini tetap hijau saat MySQL mati, jadi jangan dipakai sebagai sinyal
"backend siap dipakai".

```json
{ "status": "ok", "message": "API is running" }
```

### `POST /api/v1/auth/login`

Content-Type `application/x-www-form-urlencoded` (bukan JSON). Field mengikuti
standar OAuth2 password flow, jadi field `username` diisi **email**.

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
| `400` | Email atau sandi salah |
| `403` | Akun ada tapi `is_active = false` |

Token berlaku 7 hari (`ACCESS_TOKEN_EXPIRE_MINUTES`).

### `POST /api/v1/auth/register`

Body JSON. Field `role` hanya menerima `"warga"`; nilai lain ditolak `400`.
Role `admin` sengaja tidak bisa diminta lewat endpoint publik — hanya lewat
`POST /api/v1/users`.

```json
{
  "name": "Budi Santoso",
  "email": "budi@contoh.id",
  "password": "sandi-minimal-8",
  "role": "warga"
}
```

| Status | Kapan |
|---|---|
| `201` | Terdaftar |
| `400` | Email sudah dipakai, atau role di luar daftar publik |
| `422` | Email tidak valid / sandi < 8 karakter |

### `GET /api/v1/auth/me`

Header `Authorization: Bearer <token>`.

```json
{
  "id": "2ce5c954-...",
  "name": "Petugas RTH",
  "email": "petugas@jakarta.go.id",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-09-29T08:10:13",
  "updated_at": "2026-09-29T08:10:13"
}
```

| Status | Kapan |
|---|---|
| `200` | Berhasil |
| `401` | Token hilang / kedaluwarsa |
| `403` | Akun sedang dinonaktifkan |

---

## Kategori & Fasilitas

### `GET /api/v1/categories`

Query: `skip` (default 0), `limit` (default 100).

```bash
curl http://localhost:8000/api/v1/categories
```

```json
[ { "id": "taman", "label": "Taman", "icon_name": null } ]
```

> `icon_name` masih `null` untuk kelima kategori di seed data. Kolomnya sudah
> ada di skema tapi belum diisi.

### `POST /api/v1/categories`

Body JSON, `id` wajib diisi manual (bukan auto-increment).

```json
{ "id": "taman", "label": "Taman", "icon_name": "tree" }
```

> **Endpoint ini belum dilindungi.** `create_category` di
> [categories.py](../backend/app/api/v1/categories.py) tidak memakai
> `Depends(get_current_admin)`, jadi siapa pun — tanpa login — bisa menambah
> kategori baru. Kalau kategori jadi data yang bisa rusak oleh publik,
> tambahkan proteksinya.

### `GET /api/v1/facilities`

Daftar fasilitas unik hasil di-aggregate dari seluruh ruang publik. Dipakai
FE untuk mengisi dropdown filter.

```json
[ { "nama": "Toilet Umum", "kategori": "Sanitasi" } ]
```

### `GET /api/v1/admin/facilities` (admin)

Semua baris `fasilitas` beserta nama induk `ruang_publik`. Query: `q`, `kategori`,
`status` (`baik`/`perlu_perhatian`/`rusak`), `wilayah`, `skip`, `limit` (1..500).
Butuh token admin; warga → `403`.

### `POST /api/v1/admin/facilities` (admin)

```json
{ "nama": "Toilet Umum", "ruang_publik_id": "taman-abc", "status": "baik" }
```

`201` + baris terbaru; `400` bila `status` di luar enum; `404` bila induk tak ada.

### `PATCH /api/v1/admin/facilities/{id}` (admin)

Ubah sebagian field (termasuk pindah induk lewat `ruang_publik_id`). `404` bila id tak ada.

### `DELETE /api/v1/admin/facilities/{id}` (admin)

`204`/`200` kalau terhapus; `409` kalau masih jadi rujukan laporan (`laporan.fasilitas_id`).

### `POST /api/v1/admin/facilities/import` (admin)

`multipart/form-data`, field `file` (.csv, ≤1MB, ≤2000 baris). Header wajib `nama`
dan salah satu dari `ruang_publik_id` / `ruang_publik_nama`. Jawaban parsial:

```json
{ "created": 2, "failed": 1, "errors": [ { "baris": 4, "pesan": "ruang publik tidak ditemukan" } ] }
```

Semua endpoint di atas muncul juga di `backend/docs/04-api-endpoints.md` §7
(file itu yang paling ikut kode).

### `POST /api/v1/admin/sync-data` (admin)

Trigger manual pipeline ETL penuh (extract → transform → seed) dari panel admin.
Tanpa body; butuh token admin (warga → `403`). Bila run manual lain masih berjalan → `409`.

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

Run yang berhenti di tengah tetap membalas `200` dengan `status: "gagal"` dan
`tahap_gagal` berisi nama tahapnya; `log` dipotong ke 100 baris terakhir per tahap.

### `GET /api/v1/admin/sync-data` (admin)

Riwayat run ETL yang tersimpan di tabel `etl_run`, dipakai Panel Admin supaya hasil sinkronisasi
tetap terbaca setelah refresh atau login ulang. Query `limit` (1..200, default 20); urutan
terbaru di atas.

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

`pemicu` bernilai `manual` (endpoint POST), `terjadwal` (scheduler), atau `sekali` (`--once`).
`hitung` terisi hanya bila tahap `seed_db` sukses, `tahap_gagal` terisi pada run gagal, dan
`selesai` masih `null` selama run berstatus `berjalan`. Waktu selalu ber-UTC (akhiran `Z`).

---

## Ruang Publik

### `GET /api/v1/public-spaces`

Pencarian utama di website.

| Query | Tipe | Default | Keterangan |
|---|---|---|---|
| `lat` | float | — | Lintang titik acuan, -90..90 |
| `long` | float | — | Bujur titik acuan, -180..180 |
| `radius` | float | — | Radius dalam **km**; wajib > 0 |
| `category` | string | — | Filter `kategori_id` |
| `facilities` | string[] | — | Semua fasilitas yang diminta harus tersedia |
| `skip` | int | 0 | ≥ 0 |
| `limit` | int | 100 | 1..500 |

`facilities` diulang per nilai: `?facilities=Toilet&facilities=Lapangan`.

```bash
curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3"
```

```json
[
  {
    "id": "rth-1a407d88182a",
    "nama": "AMENITIS JH. JL. DR. SOEMARNO",
    "kategori_id": "jalur-hijau",
    "kategori": { "id": "jalur-hijau", "label": "Jalur Hijau" },
    "wilayah": "Jakarta Timur",
    "alamat": "AMENITIS JH. JL. DR. SOEMARNO",
    "latitude": null,
    "longitude": null,
    "verified": false,
    "jarak_km": null
  }
]
```

> `jarak_km` bernilai `null` kalau `lat`/`long` tidak dikirim. Field ini dihitung
> ulang di Python, bukan lewat query SQL.
>
> **Catatan data sekarang:** 1200 ruang publik, semua punya `latitude`/
> `longitude`, jadi `?lat=..&long=..&radius=..` mengembalikan hasil berurut
> jarak. Baris dengan `latitude` NULL tidak ikut query radius. Kategori
> mengikuti kolom `tipe` (4 tipe di `GET /api/v1/categories`), dan 333 baris
> punya `alamat` NULL.

### `GET /api/v1/public-spaces/{ruang_publik_id}`

Detail lengkap. Menambahkan `fasilitas` (array), `foto` (array), `field_source`
(objek penanda kolom hasil edit admin, `null` bila belum pernah diedit), serta
`kecamatan` dan `kelurahan` (kolom baru dari merge ETL, `null` bila sumber tidak
punya) di atas field yang sama dengan response list.

```bash
curl http://localhost:8000/api/v1/public-spaces/<id>
```

| Status | Kapan |
|---|---|
| `200` | Berhasil |
| `404` | ID tidak ada |

### `GET /api/v1/public-spaces/{ruang_publik_id}/reports`

Laporan yang sudah tayang untuk satu ruang publik. Query `skip` / `limit`
sama seperti list di atas.

```bash
curl "http://localhost:8000/api/v1/public-spaces/<id>/reports?limit=20"
```

---

## Kelola Petugas (Admin)

Semua endpoint di sini butuh role `admin` **dan** akun masih aktif.
Warga yang memanggilnya dapat `403`.

### `GET /api/v1/users`

Query `include_inactive` (bool, default `false`) — `true` ikut menampilkan
petugas yang sudah dinonaktifkan, untuk halaman yang punya tombol "Aktifkan lagi".

```bash
curl http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

### `POST /api/v1/users`

```json
{
  "name": "Operator Sore",
  "email": "sore@jakarta.go.id",
  "password": "sandi-minimal-8"
}
```

Schema `AdminCreate` **tidak punya field `role`**. Nilai `role` di body diabaikan,
dan router memaksa `admin`. Jadi frontend tidak mungkin membuat role lain
diam-diam.

| Status | Kapan |
|---|---|
| `201` | Petugas dibuat |
| `400` | Email sudah terdaftar |
| `422` | Email tidak valid / sandi < 8 karakter |

### `PATCH /api/v1/users/{user_id}`

Kirim hanya field yang mau diubah. `email` sengaja tidak bisa diganti dari sini.

```json
{ "name": "Nama Baru", "password": "SandiBaru456" }
```

Admin **boleh** mengubah akunnya sendiri, termasuk mengganti sandi yang sedang
dipakai. `200` kalau berhasil, `404` kalau `user_id` bukan admin yang ada.

### `DELETE /api/v1/users/{user_id}`

Nonaktifkan, bukan hapus — laporan yang sudah pernah dibuat petugas itu harus
tetap punya pemiliknya.

| Status | Kapan |
|---|---|
| `200` | Berhasil, `is_active` jadi `false` |
| `400` | Mencoba menonaktifkan akun yang sedang dipakai |
| `404` | ID bukan admin yang ada |
| `409` | Ini admin aktif terakhir |

> `409` dicek lebih dulu sebelum `400` karena jalan keluarnya sama saja: tambah
> admin lain. Kalau tidak, admin tunggal yang salah klik akan melihat
> "tidak bisa mengubah akun sendiri" yang menyesatkan.

### `POST /api/v1/users/{user_id}/activate`

Kembalikan akses untuk petugas yang sebelumnya dinonaktifkan.

---

---

## Upload & Berkas Statis

### `POST /api/v1/uploads`

Upload berkas foto bukti fisik masalah fasilitas (multipart/form-data). Endpoint publik tanpa mewajibkan auth (mendukung pelaporan anonim). Berkas disimpan di `storage/laporan/<uuid.hex><ext>` dengan nama acak.

- **Content-Type:** `multipart/form-data`
- **Field:** `file` (UploadFile)
- **Format diizinkan:** `image/jpeg`, `image/png`, `image/webp`
- **Batas ukuran:** 5 MB (`settings.MAX_UPLOAD_SIZE`)
- **Validasi:** MIME whitelist, ukuran berkas, dan magic bytes header.

**Response Berhasil (201 Created):**
```json
{
  "url": "/uploads/laporan/9fd34df4046e45458173186dfa329515.jpg"
}
```

| Kasus | Skenario | Status | Keterangan |
|---|---|---|---|
| U1 | Upload file JPEG valid | `201` | Berkas tersimpan, URL unik UUID hex |
| U2 | `GET` ke URL hasil upload | `200` | Berkas terlayani mount `/uploads` |
| U3 | Upload ekstensi `.txt` | `400` | Tipe file tidak diizinkan |
| U4 | Upload ukuran > 5 MB | `400` | Melebihi batas maksimal 5MB |
| U5 | Ekstensi `.jpg` isi teks biasa | `400` | Ditolak oleh verifikasi magic bytes |
| U6 | Request tanpa field `file` | `422` | Validasi parameter wajib FastAPI |

### Static File Serving

```
GET /uploads/<path>
```

Mount `StaticFiles` melayani berkas dari direktori `storage/` (atau `UPLOAD_DIR`). Contoh: `http://localhost:8000/uploads/laporan/xxx.jpg`.

---

## Laporan Masyarakat

### `POST /api/v1/reports`

Kirim laporan kerusakan/masalah fasilitas publik. Mendukung mode identitas anonim maupun tampilkan nama akun login.

- **Auth:** Opsional (bisa diakses tanpa token via `oauth2_scheme_optional`).
- **Foto:** **Wajib** (`foto_url` harus diawali `/uploads/laporan/` dan diverifikasi ada di disk).
- **Koordinat:** Opsional. Jika salah satu diisi (`lat_user` atau `long_user`), keduanya **wajib lengkap**. Rentang latitude `-90..90`, longitude `-180..180`.

**Contoh Payload (Anonim):**
```json
{
  "ruang_publik_id": "rth-09107c86114d",
  "fasilitas_id": "seed-ebf61eee35566d78-1",
  "jenis_masalah": "Lampu Mati / Penerangan",
  "deskripsi": "Lampu pedestrian mati sejak semalam, area gelap",
  "mode_identitas": "anonim",
  "foto_url": "/uploads/laporan/9fd34df4046e45458173186dfa329515.jpg",
  "lat_user": -6.192,
  "long_user": 106.823
}
```

**Response Berhasil (201 Created):**
```json
{
  "id": "de3ded9d-1cf2-4964-bc5e-46540f68d011",
  "ruang_publik_id": "rth-09107c86114d",
  "ruang_publik_nama": "Taman Menteng",
  "fasilitas_nama": "Lampu Taman",
  "jenis_masalah": "Lampu Mati / Penerangan",
  "deskripsi": "Lampu pedestrian mati sejak semalam, area gelap",
  "foto_url": "/uploads/laporan/9fd34df4046e45458173186dfa329515.jpg",
  "status": "menunggu_verifikasi",
  "mode_identitas": "anonim",
  "nama_pelapor": null,
  "user_id": null,
  "lat_user": -6.192,
  "long_user": 106.823,
  "lat_exif": null,
  "long_exif": null,
  "created_at": "2026-10-05T19:15:20"
}
```

| Kasus | Skenario | Status | Keterangan |
|---|---|---|---|
| R1 | Anonim tanpa header auth, foto valid, koordinat ada | `201` | `nama_pelapor` & `user_id` null, status `menunggu_verifikasi` |
| R2 | `mode_identitas=tampilkan_nama` tanpa token | `400` | Silakan login atau pilih mode anonim |
| R3 | `mode_identitas=tampilkan_nama` + Bearer token | `201` | `nama_pelapor` diisi nama DB (anti-spoofing) |
| R4 | Body tanpa `foto_url` | `400` | Foto bukti fisik wajib diunggah |
| R5 | `foto_url` bukan `/uploads/laporan/` atau berkas tidak ada | `400` | Berkas foto tidak valid / tidak ditemukan |
| R6 | Hanya kirim `lat_user` tanpa `long_user` | `400` | Koordinat lokasi harus lengkap |
| R7 | `lat_user` di luar rentang (-90..90) | `422` | Validasi schema Pydantic |
| R8 | Submit tanpa koordinat sama sekali | `201` | Koordinat opsional, tersimpan null |

### `GET /api/v1/reports`

Daftar laporan masyarakat. Parameter query:
- `status`: filter status (`menunggu_verifikasi`, `dalam_penanganan`, `selesai`, `ditolak`)
- `wilayah`: filter kota administrasi Jakarta
- `q`: filter kata kunci pencarian
- `skip`, `limit`: pagination (default limit 100)

### `GET /api/v1/reports/{report_id}`

Detail satu laporan masyarakat lengkap dengan timeline tahapan penanganan fasilitas.

### `PATCH /api/v1/reports/{report_id}/status`

Pembaruan status laporan oleh admin/petugas (`menunggu_verifikasi` -> `diverifikasi` -> `dalam_penanganan` -> `selesai` / `ditolak`). Membutuhkan header `Authorization: Bearer <admin_token>`.

### `GET /api/v1/reports/stats/moderasi`

Statistik antrian laporan yang menunggu tinjauan dan moderasi petugas. Khusus role `admin`.

---

## Belum Ada

Endpoint berikut memang dipakai di UI tapi **belum ada** di backend — jangan
dijanjikan ke frontend dulu:

- **Kelola ruang publik** (CRUD admin), belum ada endpoint tulis data ruang publik. Fasilitas sudah
  punya (`/api/v1/admin/facilities`, lihat §Fasilitas di atas).
- **Refresh / logout token** — token stateless 7 hari, tidak ada revocation.
