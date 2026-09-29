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
| `GET` | `/api/v1/users` | **Admin** | Daftar petugas |
| `POST` | `/api/v1/users` | **Admin** | Tambah petugas |
| `PATCH` | `/api/v1/users/{user_id}` | **Admin** | Ganti nama / reset sandi |
| `DELETE` | `/api/v1/users/{user_id}` | **Admin** | Nonaktifkan petugas |
| `POST` | `/api/v1/users/{user_id}/activate` | **Admin** | Aktifkan kembali |

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
FE untuk mengisi dropdown filter, jadi tidak perlu endpoint CRUD fasilitas.

```json
[ { "nama": "Toilet Umum", "kategori": "Sanitasi" } ]
```

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
> **Catatan data sekarang:** kolom `latitude`/`longitude` di
> `data/processed/ruang_publik.csv` masih kosong untuk semua 2.463 baris.
> Akibatnya di database saat ini, `GET /api/v1/public-spaces?lat=..&long=..`
> selalu mengembalikan `[]` dan `jarak_km` selalu `null`. Endpoint-nya benar,
> sumber koordinatnya yang belum ada.

### `GET /api/v1/public-spaces/{ruang_publik_id}`

Detail lengkap. Menambahkan `fasilitas` (array) dan `foto` (array) di atas
field yang sama dengan response list.

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

## Static File

Upload dilayani sebagai static file:

```
GET /uploads/<path>
```

Direktorinya bisa diganti lewat `UPLOAD_DIR` (default `storage`). Batas
ukuran file `MAX_UPLOAD_SIZE` (default 5 MB).

---

## Belum Ada

Endpoint berikut memang dipakai di UI tapi **belum ada** di backend — jangan
dijanjikan ke frontend dulu:

- **Buat / kirim laporan.** `app/schemas/laporan.py` dan
  `app/services/laporan.py` sudah ada dan sudah dipakai untuk endpoint baca,
  tapi router-nya masih dikomentari di [api.py](backend/app/api/v1/api.py).
  Artinya warga belum bisa mengirim laporan sama sekali.
- **Kelola ruang publik / fasilitas** (CRUD admin) — belum ada endpoint tulis.
- **Dashboard admin, statistik, moderasi** — belum ada.
- **Refresh / logout token** — token stateless 7 hari, tidak ada revocation.
