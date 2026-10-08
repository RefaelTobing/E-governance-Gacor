# features — Moderation Service (FEAT-011)

> **Scope file ini HANYA FEAT-011 (Moderasi Laporan — Admin)** — sesuai PRD [`../../../docs/PRD.md`](../../../docs/PRD.md).
> Laporan warga (create/status/mine) → `report-service.md`. Akun admin → `admin-auth.md`.

Kode terkait:
- Router: `app/api/v1/laporan.py` (bagian admin: `stats/dashboard`, `stats/moderasi`, `PATCH .../status`; bagian flag: `POST .../flag`)
- Service: `app/services/laporan.py` (`get_dashboard_stats`, `get_moderasi_stats`, `update_report_status`, `flag_laporan`)
- Dependen auth: `Depends(get_current_admin)` dari `app/api/deps.py`

---

## Status Ringkas

| Aspek PRD FEAT-011 | Status |
|---|---|
| Panel admin meninjau laporan sebelum/sesudah tayang | **Sebagian** - antrian punya endpoint khusus `GET /admin/reports` (**BE-28/BE-52**, 2026-10-08) & detail ada; **validasi status belum ada** (**BE-51**) |
| Aksi setujui/tolak laporan | **Ada** - setujui lewat endpoint khusus `POST /admin/reports/{id}/approve` (**BE-29**, 2026-10-08), tolak lewat `POST /admin/reports/{id}/reject` + alasan tersimpan (**BE-30**, 2026-10-09); validasi enum `PATCH /status` masih **BE-51(a)** |
| Mencegah spam/konten tak relevan | **Ada** sejak BE-26 — rate limit `POST /reports` + `/uploads` (10/10 menit per user/IP), `features/report-service.md` §Gap 2 + benteng flag unik (BE-25) |
| Mekanisme flag oleh pengguna lain | **Sebagian** — endpoint flag ada (**BE-25**, 2026-10-08, tabel `laporan_flag`); daftar flagged untuk admin (**BE-31**) & UI (FE-21/FE-26) belum |

---

## 1. Endpoint yang Sudah Ada

### `PATCH /api/v1/reports/{laporan_id}/status` — Admin

```json
{ "status": "dalam_penanganan", "title": "Status diperbarui", "description": "Opsional" }
```

Perilaku saat ini (`update_report_status`):
1. Cari laporan (404 bila tak ada)
2. **Tulis `payload.status` apa adanya ke kolom `laporan.status`** ← tanpa validasi
3. Tambah baris `laporan_timeline` (`status`, `title`, `description` default "Status diubah menjadi ...")
4. Return `LaporanDetailResponse`

Aksi yang dikirim FE (`DetailModerasiPage.jsx`): `dalam_penanganan`, `selesai`, `ditolak` — ditambah alasan penolakan via `description` (ini yang tampil di stepper pelapor, sesuai FEAT-010).

### `GET /api/v1/reports/stats/dashboard` — Admin

```json
{ "total_laporan": 42, "menunggu_verifikasi": 7, "dalam_penanganan": 5, "selesai": 30 }
```
→ 4 kartu statistik `Screen 10` (PRD: Total Laporan, Menunggu Verifikasi, Dalam Penanganan, Selesai).

### `GET /api/v1/reports/stats/moderasi` — Admin

```json
{ "antrian_moderasi": 7, "selesai_pekan_ini": 3 }
```
- `antrian_moderasi` = jumlah `menunggu_verifikasi`
- `selesai_pekan_ini` = dihitung dari **`laporan_timeline`** (kapan status benar jadi `selesai`, bukan saat laporan dibuat); awal pekan = Senin 00:00.

### `GET /api/v1/admin/reports` - Admin (BE-28 / BE-52, 2026-10-08)

Antrian tinjauan - **menggantikan** pemakaian `GET /reports` (publik) untuk tabel moderasi.
Semua status bila tanpa filter; `?status=` wajib `STATUS_KANONIK` atau `"semua"` (lain → `422`),
plus `wilayah`/`q`/`skip`/`limit`; response `LaporanResponse` identik jadi FE tinggal ganti URL
(`AntrianModerasiPage`/`DashboardPage` - sesi FE). `?flagged=` menyusul di BE-31.

### `POST /api/v1/admin/reports/{laporan_id}/approve` - Admin (BE-29, 2026-10-08)

Setujui laporan: status jadi `diverifikasi` (tayang) + baris timeline "Laporan disetujui".
Body opsional `{description}` = catatan petugas; tanpa body memakai deskripsi default.
Guard di endpoint (bukan di service): hanya `menunggu_verifikasi`/`ditolak` yang boleh
di-approve, status lain termasuk yang sudah tayang → `409`; `PATCH /status` tetap bebas
sampai validasi enum BE-51. Konsumen FE: tombol Setujui di `DetailModerasiPage` (FE-25).

### `POST /api/v1/admin/reports/{laporan_id}/reject` - Admin (BE-30, 2026-10-09)

Tolak laporan: status jadi `ditolak` + baris timeline "Laporan ditolak". Body **wajib**
`{ "alasan": "..." }`; alasan disimpan di kolom `laporan.alasan_penolakan` (migrasi
`a1b2c3d4e5f6`) **dan** menjadi `description` timeline, sehingga bisa ditampilkan ulang di
daftar/detail FE (bukan hanya sekali baca). `alasan` kosong/whitespace atau body tanpa
`alasan` → `422`. Guard: semua status boleh ditolak (termasuk laporan tayang yang mau
diturunkan) kecuali yang sudah `ditolak` → `409`. Response `LaporanDetailResponse`
(memuat `alasan_penolakan`). Konsumen FE: tombol Tolak di `DetailModerasiPage` (FE-25).

### Daftar antrian lama (jangan dipakai lagi)

`GET /api/v1/reports?status=menunggu_verifikasi` kini hanya memuat laporan **tayang**
(irisan dengan `menunggu_verifikasi` = kosong) - endpoint publik memang dibatasi sejak BE-52.

### `POST /api/v1/reports/{laporan_id}/flag` — Login (BE-25)

Flag pengguna lain atas laporan **tayang** yang dianggap tidak pantas. Tanpa body,
response `201 {laporan_id, flag_count}`. Aturan: wajib login, hanya `STATUS_TAYANG`,
pelapor sendiri ditolak `403`, satu flag per pengguna `409` (unique
`uq_laporan_flag_pengguna`), id tak dikenal `404`. **Status laporan tidak berubah** —
sinyal flag terpisah dari enum status, keputusan tetap di admin.

> Kebijakan lama di file ini ("flag di luar MVP, jangan dibuat kecuali diminta")
> sudah digantikan penugasan **BE-25** di `TASK_GUIDE_BACKEND.md`.

---

## 2. Gap Terverifikasi & Langkah Perbaikan

### Gap 1 — Validasi enum status (wajib)

`payload.status` diterima **string bebas** → admin (atau pemanggil API dengan token admin) bisa menulis status tak dikenal seperti `langsung_selesai`, yang merusak badge/stepper FE dan statistik.

**Langkah:**
- [x] Daftar status kanonik didefinisikan di satu tempat — `STATUS_KANONIK` (5 status) dan `STATUS_TAYANG`
      di `app/schemas/laporan.py` (dibuat saat BE-47; lihat `03-database-schema.md` §4).
      `STATUS_LAPORAN` di `app/core/status.py` tidak jadi dibuat — cukup di `schemas/laporan.py`.
- [ ] Validasi di schema `LaporanStatusUpdate` (`field_validator`) **atau** di router → balas `422`/`400` dengan pesan berisi daftar nilai yang sah. (Konstanta sudah siap dipakai.)
- [ ] (Opsional, disarankan) Validasi transisi: `selesai`/`ditolak` tidak bisa kembali ke `menunggu_verifikasi` — **hanya bila kebutuhan produk jelas**; kalau ragu, cukup validasi nilai dulu (MVP).
- [ ] Tambahkan test: kirim status ngawur → 4xx; kirim `selesai` → 200 + timeline entry baru.

**Verifikasi:**
```bash
curl -X PATCH http://localhost:8000/api/v1/reports/<id>/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"status_ngawur"}'                 # → 422/400
curl ... -d '{"status":"selesai"}'                # → 200, timeline bertambah
```

### Gap 2 — Filter tayang di `get_reports_by_ruang_publik` (dampak FEAT-010) — **SELESAI (BE-47)**

Filter lama memakai `("disetujui","tayang_otomatis")` yang tidak pernah ada → endpoint selalu `[]`.
Sekarang memakai konstanta `STATUS_TAYANG` di `app/schemas/laporan.py` (satu-satunya daftar tayang;
dipakai juga galeri foto BE-48). Regresi dijaga `tests/unit/test_public_space_reports.py`.

### Gap 3 — (koordinasi) Statistik hardcode & mojibake

`app/api/v1/statistics.py`:
- `/statistics/testimonials` & `/statistics/hero-slides` **hardcode** di dalam fungsi; string testimonials mengandung **karakter emoji rusak (mojibake)** yang bisa merusak rendering FE.

**Langkah (prioritas rendah — di luar inti FEAT-011, dicatat di sini karena berdampak dashboard/homepage):**
- [ ] Perbaiki encoding literal testimonials agar valid UTF-8 (minimal).
- [ ] Idealnya pindahkan ke seed/tabel bila konten perlu diedit; tanpa itu, cukup beri komentar "hardcode sengaja untuk MVP".

**Verifikasi:** `curl /api/v1/statistics/testimonials` → response valid UTF-8, tidak ada karakter `�`.

---

## 3. Yang SUDAH Benar (pertahankan — jangan dirombak)

- [x] Semua endpoint admin di `laporan.py` memakai `Depends(get_current_admin)` → warga `403`, akun nonaktif `403`.
- [x] Timeline otomatis setiap ganti status → audit trail untuk pelapor & admin.
- [x] `description` PATCH = alasan penolakan → terkirim ke pelapor lewat timeline (FEAT-010); sejak BE-30 alasan juga tersimpan di kolom `alasan_penolakan`.
- [x] Statistik dashboard dihitung live dari DB (bukan cache) — cukup untuk MVP.
- [x] Statistik moderasi memakai timeline, bukan `created_at` → angka "selesai pekan ini" akurat.
- [x] Daftar laporan admin mendukung filter `status`/`wilayah`/`q` + pagination - kini lewat `GET /admin/reports` (`status` tervalidasi kanonik, BE-28).

---

## 4. Batasan yang TIDAK boleh ditambahkan (dari aturan produk)

Jangan menambahkan ke UI/endpoint moderasi tanpa permintaan eksplisit: penugasan teknisi/regu, SLA/countdown, kode aset, proof-of-repair, log audit petugas, dispatch queue, target penyelesaian, lencana identitas terverifikasi. (Larangan lengkap: `docs/WORKFLOWFE.md` §31, ringkasan di `docs/WORKFLOW_FRONTEND.md`.)

---

## 5. Urutan Pengerjaan

1. Gap 1 — validasi enum status (kecil, fondasi untuk lainnya)
2. Pastikan Gap 2 selesai (dikerjakan di `report-service.md`, lalu verifikasi ulang dari sini)
3. Gap 3 — encoding testimonials (bila menyentuh statistik)

---

## Test Regresi Wajib

- [ ] `PATCH status` dengan token `warga` → `403`
- [ ] `PATCH status` tanpa token → `401`
- [ ] `PATCH status` nilai sah → 200, `laporan.status` berubah, timeline +1
- [ ] `PATCH status` nilai tak dikenal → 4xx
- [ ] `PATCH .../reports/stats/*` tanpa admin → 401/403
- [ ] `stats/dashboard` cocok dengan hitungan manual query sederhana
- [ ] `GET /public-spaces/{id}/reports` hanya berisi status tayang (setelah Gap 2)
- [x] `POST .../flag` tanpa token → 401 · pelapor sendiri → 403 · belum tayang → 400 · dobel → 409 · berhasil → 201 `flag_count` dan status laporan tak berubah (sudah di `tests/unit/test_laporan.py`, 2026-10-08)
- [x] `GET /admin/reports` tanpa token → 401 · warga → 403 · `?status=ngawur` → 422 · tanpa filter semua-status 200 · filter 200 · `GET /reports` publik hanya tayang · detail milik orang lain → 403, anonim penuh → 200, admin → 200 (`tests/unit/test_admin_reports.py`, 2026-10-08, 98 passed)
- [x] `POST /admin/reports/{id}/approve` tanpa token → 401 · warga → 403 · id tak dikenal → 404 · `menunggu_verifikasi`/`ditolak` → 200 (status `diverifikasi`, timeline +1, muncul di `GET /reports` publik) · sudah tayang → 409 · tanpa body → deskripsi default (`tests/unit/test_admin_reports.py`, 2026-10-08, 105 passed)
- [x] `POST /admin/reports/{id}/reject` tanpa token → 401 · warga → 403 · id tak dikenal → 404 · tanpa/kosong/blank `alasan` → 422 · `menunggu_verifikasi` → 200 (status `ditolak`, `alasan_penolakan` tersimpan, timeline "Laporan ditolak", hilang dari `GET /reports`) · laporan tayang → 200 (diturunkan) · sudah `ditolak` → 409 · pemilik melihat alasan di detail & status (`tests/unit/test_admin_reports.py`, 2026-10-09, 113 passed)

---

## Verifikasi Akhir File Ini

- [ ] Hanya membahas FEAT-011 (+ catatan silang yang ditandai jelas)
- [ ] Setiap gap punya langkah + verifikasi curl yang bisa dijalankan
- [ ] Tidak ada endpoint admin baru tanpa `get_current_admin`
- [ ] `04-api-endpoints.md` & `docs/API.md` sinkron setelah perubahan
