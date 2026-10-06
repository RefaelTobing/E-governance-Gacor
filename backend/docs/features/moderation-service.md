# features — Moderation Service (FEAT-011)

> **Scope file ini HANYA FEAT-011 (Moderasi Laporan — Admin)** — sesuai PRD [`../../../docs/PRD.md`](../../../docs/PRD.md).
> Laporan warga (create/status/mine) → `report-service.md`. Akun admin → `admin-auth.md`.

Kode terkait:
- Router: `app/api/v1/laporan.py` (bagian admin: `stats/dashboard`, `stats/moderasi`, `PATCH .../status`)
- Service: `app/services/laporan.py` (`get_dashboard_stats`, `get_moderasi_stats`, `update_report_status`)
- Dependen auth: `Depends(get_current_admin)` dari `app/api/deps.py`

---

## Status Ringkas

| Aspek PRD FEAT-011 | Status |
|---|---|
| Panel admin meninjau laporan sebelum/sesudah tayang | **Sebagian** — antrian & detail ada; **validasi status belum ada** |
| Aksi setujui/tolak laporan | **Ada** (PATCH status) — tanpa validasi enum |
| Mencegah spam/konten tak relevan | **Belum** (rate limiting → `report-service.md` FEAT-008) |
| Mekanisme flag oleh pengguna lain | **Belum & opsional** — di luar MVP awal; jangan dibuat kecuali diminta |

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

### Daftar antrian (bukan endpoint khusus)

`GET /api/v1/reports?status=menunggu_verifikasi&q=&wilayah=` (endpoint publik biasa) dipakai FE mengisi tabel moderasi + filter status/wilayah/pencarian.

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
- [x] `description` PATCH = alasan penolakan → terkirim ke pelapor lewat timeline (FEAT-010).
- [x] Statistik dashboard dihitung live dari DB (bukan cache) — cukup untuk MVP.
- [x] Statistik moderasi memakai timeline, bukan `created_at` → angka "selesai pekan ini" akurat.
- [x] Daftar laporan admin mendukung filter `status`/`wilayah`/`q` + pagination.

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

---

## Verifikasi Akhir File Ini

- [ ] Hanya membahas FEAT-011 (+ catatan silang yang ditandai jelas)
- [ ] Setiap gap punya langkah + verifikasi curl yang bisa dijalankan
- [ ] Tidak ada endpoint admin baru tanpa `get_current_admin`
- [ ] `04-api-endpoints.md` & `docs/API.md` sinkron setelah perubahan
