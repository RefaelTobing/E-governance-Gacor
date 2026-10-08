# features: Report Service (FEAT-008, 009, 010, 013)

> **Scope file ini HANYA FEAT-008 (Form Lapor), FEAT-009 (Mode Identitas), FEAT-010 (Visibilitas & Status), FEAT-013 (Riwayat "Laporan Saya")** — sesuai PRD [`../../../docs/PRD.md`](../../../docs/PRD.md).
> Moderasi admin (FEAT-011) → `moderation-service.md`. Galeri foto (FEAT-007) → `public-space-service.md`.

Kode terkait:
- Router: `app/api/v1/laporan.py`
- Service: `app/services/laporan.py`
- Schema: `app/schemas/laporan.py`, `app/schemas/laporan_timeline.py`
- Model: `app/models/laporan.py`, `app/models/laporan_timeline.py`

---

## Status Ringkas

| FEAT | Judul | Status |
|---|---|---|
| 008 | Form Lapor Fasilitas | **Selesai** (BE-20, BE-46, BE-49 selesai; upload foto wajib & geolokasi) |
| 009 | Mode Identitas Laporan | **Selesai** (anti-spoofing nama dari server) |
| 010 | Visibilitas & Status Laporan | **Sebagian** — status+timeline jalan; endpoint status pelapor (BE-24) selesai; filter tayang per-ruang publik selesai (BE-47) |
| 013 | Riwayat "Laporan Saya" | **Selesai** (BE-50: `GET /reports/mine`, token wajib, semua status milik sendiri) |

---

## FEAT-008 — Form Lapor Fasilitas

**PRD:** form terikat ke 1 titik ruang publik: foto, deskripsi, kategori masalah; wajib kategori + deskripsi; foto opsional/wajib (ditentukan saat desain detail). Prinsip: **"Laporan bisa dibuat dalam <1 menit"** → endpoint harus ringkas, satu kali kirim.

**Implementasi saat ini — `POST /api/v1/reports`:**
- Body `LaporanCreate`: `ruang_publik_id` (wajib), `deskripsi` (wajib), `jenis_masalah` (wajib), `foto_url` (wajib), `fasilitas_id`, `mode_identitas`, `lat_user`, `long_user`.
- Token **opsional** (header `Authorization` via `oauth2_scheme_optional`): anonim kirim tanpa token; mode `tampilkan_nama` wajib token (divalidasi di service).
- Validasi foto: `foto_url` wajib berprefix `/uploads/laporan/` dan diverifikasi keberadaannya di disk lokal.
- Validasi koordinat: `lat_user` & `long_user` opsional, namun bila salah satu diisi keduanya wajib lengkap (-90..90 dan -180..180).
- Saat create: status `menunggu_verifikasi` + baris timeline `Laporan dikirim` dibuat otomatis.
- Response `201` + `LaporanResponse`.

### Gap 1: Upload Foto (SELESAI - BE-49 & BE-20)

Upload foto telah selesai diimplementasikan pada `POST /api/v1/uploads` dan diverifikasi end-to-end:

- [x] Endpoint upload foto `POST /api/v1/uploads` (`app/api/v1/uploads.py`, terdaftar di `api.py`):
  - parameter: `file: UploadFile` multipart. Subfolder dikunci aman pada `laporan` (`storage/laporan/<uuid.hex><ext>`).
  - auth: **opsional/publik** agar pelapor anonim dapat mengunggah bukti fisik secara bebas.
  - respons: `201 Created` `{ "url": "/uploads/laporan/<hex>.jpg" }`.
  - validasi: MIME whitelist (`image/jpeg`, `image/png`, `image/webp`), batas ukuran 5 MB, dan verifikasi magic bytes berkas.
- [x] `storage/laporan/` dibuat otomatis oleh `main.py` dan `uploads.py`.
- [x] Dokumentasi `04-api-endpoints.md` + `docs/API.md` telah disinkronkan. Form frontend `FormLaporPage` telah terintegrasi melakukan sequential upload (unggah foto via `api.upload()` -> isi `foto_url` -> submit `POST /reports`).

**Keputusan Desain:**
1. **Subfolder terkunci:** Endpoint publik upload foto dikunci hanya ke direktori `laporan` guna mencegah path traversal atau penulisan sembarangan.
2. **Koordinat opsional berpasangan:** Koordinat `lat_user` dan `long_user` bersifat opsional (agar pengguna yang menolak akses izin lokasi browser tetap dapat melapor masalah fasilitas), namun wajib berpasangan jika diisi. Validasi ambang batas fake-GPS akan diterapkan pada BE-23.
3. **Fix `oauth2_scheme_optional`:** Endpoint `POST /reports` menggunakan skema OAuth2 dengan `auto_error=False` di `app/api/deps.py` sehingga request anonim tanpa header `Authorization` tidak terblokir HTTP 401 oleh FastAPI.

**Verifikasi:**
```bash
curl -X POST http://localhost:8000/api/v1/uploads \
  -F "file=@foto.jpg" -F "subfolder=laporan"
# → 201/200 {"url":"/uploads/laporan/<uuid>.jpg"}; buka URL-nya di browser → gambar tampil
curl -X POST ... -F "file=@catatan.txt"    # → 400 (MIME)
# unggah file > 5MB                        # → 400 (ukuran)
```

### Gap 2 — Rate Limiting (NFR-002) — SELESAI (BE-26)

PRD NFR-002 mewajibkan rate-limiting endpoint laporan **untuk mencegah spam**.

- [x] Implementasi ringan tanpa dependency berat: `RateLimitMiddleware` ASGI murni di
  `app/middleware/rate_limit.py` (deque timestamp per kunci, store in-process), dipasang umum di
  `app/main.py` sebelum blok CORS — menutup `POST /reports` **dan** `POST /uploads`.
- [x] Balas `429` (`{"detail": ...}`) + header `Retry-After`; tanpa Redis — sesuai aturan
  `docs/01-tech-stack.md` §7.
- [x] Threshold didokumentasikan di file ini + `04-api-endpoints.md` (+ `docs/API.md`).

**Threshold (setelan `config.py` / `.env.example`):** `RATE_LIMIT_MAX=10` percobaan per
`RATE_LIMIT_WINDOW_S=600` detik (10 menit), sliding window. Kunci **hybrid**: `user:<sub>` bila
`Authorization: Bearer` berisi token valid, selain itu `ip:<host>` — jadi spammer satu IP yang
login tak mengunci IP-nya sendiri, dan pengguna beda IP dengan token sama dibatasi per token.
`POST /reports` + `POST /uploads` **berbagi satu hitungan** (submit = upload foto + kirim laporan
= 2 percobaan). Semua percobaan dihitung termasuk yang balas `400`/`422` (anti-brute-force).
Matikan sementara dengan `RATE_LIMIT_ENABLED=false` (mis. saat uji beban manual).

**Verifikasi (2026-10-08):** `pytest tests/unit/test_rate_limit.py -q` → 6 test lulus: 11x kirim →
`429` + `Retry-After`, lewat jendela → normal, dua token berbeda di IP sama tidak saling jerat,
`/uploads` ikut kena, `GET /reports` & `login` 11x tetap lolos, `RATE_LIMIT_ENABLED=false` lolos
semua; suite penuh **83 passed**.

---

## FEAT-009 — Mode Identitas Laporan

**PRD:** pengguna memilih **anonim** atau **tampilkan nama**; pilihan **wajib** sebelum submit; default disarankan anonim.

**Implementasi saat ini (SELESAI — jangan diubah sembarangan):**

| Aspek | Perilaku di kode |
|---|---|
| Nilai enum | `anonim` / `tampilkan_nama` (default schema `tampilkan_nama`, FE default memilih `anonim`) |
| Wajib dipilih | FE memvalidasi enum sebelum kirim; backend memvalidasi nilai via service |
| Mode `tampilkan_nama` tanpa token | `400` — "Untuk menampilkan nama, silakan login. Atau pilih mode anonim." |
| Nama pelapor | **Diisi server** dari user login (`crud_user.get_user_by_id`) — payload `nama_pelapor` klien **DIABAIKAN** (anti-spoofing) |
| Mode `anonim` | `user_id=None`, `nama_pelapor=None` → identitas tersembunyi total |
| Risiko privasi (PRD §9) | Default saran anonim ada di sisi FE; backend tetap menerima keduanya |

**Langkah:** tidak ada pekerjaan baru — hanya pertahankan perilaku & tambahkan pengujian regresi (lihat §Test).

**Verifikasi:**
```bash
# anonim tanpa token → 201, response nama_pelapor null
curl -X POST http://localhost:8000/api/v1/reports -H "Content-Type: application/json" \
  -d '{"ruang_publik_id":"<id>","deskripsi":"tes","mode_identitas":"anonim"}'
# tampilkan_nama tanpa token → 400
# tampilkan_nama + token → 201, nama_pelapor = nama user di token (bukan teks kiriman)
```

---

## FEAT-010 — Visibilitas & Status Laporan

**PRD:** laporan **yang lolos moderasi tayang publik** dan dapat dibaca semua pengguna, terikat ke entri ruang publik; **status (baru/ditinjau/terverifikasi/ditolak) terlihat oleh pelapor**.

**Implementasi saat ini:**

**Sudah jalan:**
- Status + timeline: setiap perubahan status mencatat `laporan_timeline` (title, description, waktu) — inilah yang ditampilkan stepper/badge FE.
- `GET /api/v1/reports/{id}` → detail + timeline (terbuka; pelapor bisa memantau; riwayat milik sendiri ada di `GET /reports/mine`, lihat FEAT-013).
- `GET /api/v1/reports/{id}/status` (**BE-24, selesai 2026-10-08**) → status ringkas khusus pelapor: laporan berpemilik hanya terbaca pemilik/admin, laporan anonim penuh dibuka dengan bukti id UUID, response tanpa deskripsi/foto/nama pelapor. Rincian: `04-api-endpoints.md`.
- Daftar status kanonik (lihat `03-database-schema.md` §4): `menunggu_verifikasi → diverifikasi → dalam_penanganan → selesai` / `ditolak`.

**GAP SELESAI (BE-47, 2026-10-06) — filter tayang per-ruang publik pernah selalu kosong:**

Dulu `services/laporan.py::get_reports_by_ruang_publik` menyaring `status IN ("disetujui","tayang_otomatis")`
— nilai yang tidak pernah dibuat sistem mana pun → `GET /api/v1/public-spaces/{id}/reports` selalu `[]`.

**Yang sudah dikerjakan:**

- [x] Daftar filter diganti ke **status berarti "sudah tayang"** tunggal:
      `STATUS_TAYANG = ("diverifikasi", "dalam_penanganan", "selesai")` di `app/schemas/laporan.py`
      (`menunggu_verifikasi` = belum tayang; `ditolak` = tidak tayang).
- [x] Konstanta dipakai ulang di galeri foto (FEAT-007, `gabung_foto` di BE-48) — satu daftar, tidak diduplikasi.
- [x] Sinkronkan `docs/API.md` + `04-api-endpoints.md` (filter dan status bug lama diperbarui).
- [x] Unit test regresi `tests/unit/test_public_space_reports.py` (6 skenario, lulus).

**Sisa keputusan:**

- [ ] (Putuskan & catat) Apakah `GET /reports` (daftar publik umum) juga harus otomatis hanya menampilkan yang tayang? Saat ini semua status terlihat publik (query `status=` opsional). Rekomendasi MVP: daftar publik umum ikut memakai daftar tayang; daftar admin tetap semua (moderasi perlu melihat antrian).

**Verifikasi:**
```bash
# 1. buat laporan (status menunggu_verifikasi) → belum muncul di public-spaces/{id}/reports
# 2. PATCH status → diverifikasi            → sekarang muncul
# 3. PATCH → ditolak                        → hilang lagi
curl "http://localhost:8000/api/v1/public-spaces/<id>/reports"
```

---

## FEAT-013 — Riwayat "Laporan Saya"

**PRD (baru ditambahkan):** warga yang login melihat **daftar laporan miliknya sendiri** + status + progres; hanya laporan milik akun login (filter per-pengguna); tiap entri mengarah ke detail status.

**Implementasi saat ini: SELESAI (BE-50, 2026-10-08).**

- Endpoint baru **`GET /api/v1/reports/mine`** (route `read_my_reports` di
  `app/api/v1/laporan.py`, dideklarasikan sebelum `GET /{laporan_id}`): auth wajib
  `Depends(get_current_active_user)` → `401` tanpa token/token rusak.
- **Service tidak diubah:** `services/laporan.py::get_reports(..., user_id=...)` sudah
  mendukung filter `user_id` sebagai kondisi AND.
- `GET /reports` (publik, tanpa pemilik) **tetap** seperti semula — jangan dicampur dengan
  pembatasan BE-52.

**Keputusan (dipilih 2026-10-08):**

- [x] Pilih mekanisme: **Opsi B** `GET /api/v1/reports/mine` (path terpisah, token wajib,
  401 otomatis via dependency) — bukan Opsi A `?mine=true` (butuh 401 manual; dependency
  FastAPI statis per route, tak bisa memaksa login di endpoint publik).
- [x] Implementasi di router (service tidak disentuh).
- [x] Filter `status`/`q`/`wilayah` tetap bisa dikombinasi dengan mine.
- [x] Update `04-api-endpoints.md` + `docs/API.md`; **beri tahu FE:** `getUserReports`
  (konsumen `RiwayatLaporanPage` + `ProfilDashboardPage`) tinggal ganti URL ke
  `GET /reports/mine` (header Bearer sudah otomatis dari `config/api.js`) — dikerjakan sesi FE.
- [x] Laporan anonim milik sesi ini: `user_id` tersimpan meski `mode_identitas=anonim`
  (lihat kode create — `user_id` tetap diisi bila token ada) → laporan anonim yang dibuat sambil
  login **tetap muncul di Laporan Saya pemiliknya**, tanpa membuka identitas ke publik.

**Verifikasi (2026-10-08):**
```bash
# login user A → kirim laporan; login user B → kirim laporan
curl -H "Authorization: Bearer $TOKEN_A" "http://localhost:8000/api/v1/reports/mine"
# → hanya laporan A
curl "http://localhost:8000/api/v1/reports/mine"              # → 401
```
`pytest tests -q` → **89 passed** (6 test BE-50 di `tests/unit/test_laporan.py`).

---

## Urutan Pengerjaan (rekomendasi)

1. **FEAT-010** (filter tayang) — perbaikan kecil, dampak besar ke produk.
2. **FEAT-013** (mine) — router saja, service sudah siap. **(selesai BE-50)**
3. **FEAT-008** gap upload foto — endpoint baru.
4. **FEAT-008** gap rate limiting — middleware. **(selesai BE-26)**
5. (FEAT-007 galeri di `public-space-service.md` memakai rumus tayang dari langkah 1.)

---

## Test Regresi Wajib (untuk `06-testing-strategy.md`)

- [ ] Create anonim → 201, `nama_pelapor is None`, `user_id is None`
- [ ] Create `tampilkan_nama` tanpa token → 400
- [ ] Create `tampilkan_nama` + token → `nama_pelapor` = nama user token (payload diretas tidak mempan)
- [ ] Create → status `menunggu_verifikasi` + timeline entry pertama ada
- [x] `mine=true` dengan token A tidak mengembalikan laporan B (`GET /reports/mine`, BE-50)
- [ ] Filter tayang: `menunggu_verifikasi` tidak tayang; `diverifikasi` tayang; `ditolak` tidak tayang
- [ ] Upload: JPEG kecil 2xx + URL terbuka; `.txt` 400; >5MB 400
- [x] Rate limit: spam > threshold → 429 (`test_rate_limit.py`, BE-26)

---

## Verifikasi Akhir File Ini

- [ ] Empat FEAT (008–010, 013) punya status & langkah yang bisa langsung dikerjakan
- [ ] Semua gap di atas punya verifikasi curl yang bisa dijalankan
- [ ] Tidak ada pembahasan moderasi admin (→ `moderation-service.md`) atau upload galeri resmi (→ `public-space-service.md`)
- [ ] `04-api-endpoints.md` & `docs/API.md` sinkron setelah tiap gap ditutup
