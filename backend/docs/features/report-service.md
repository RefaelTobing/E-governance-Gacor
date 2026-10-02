# features — Report Service (FEAT-008, 009, 010, 013)

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
| 008 | Form Lapor Fasilitas | **Sebagian** — create jalan; **upload foto belum** (gap utama) |
| 009 | Mode Identitas Laporan | **Selesai** (anti-spoofing nama dari server) |
| 010 | Visibilitas & Status Laporan | **Sebagian** — status+timeline jalan; **filter tayang per-ruang publik rusak** |
| 013 | Riwayat "Laporan Saya" | **Belum ada** — endpoint belum filter per-pengguna |

---

## FEAT-008 — Form Lapor Fasilitas

**PRD:** form terikat ke 1 titik ruang publik: foto, deskripsi, kategori masalah; wajib kategori + deskripsi; foto opsional/wajib (ditentukan saat desain detail). Prinsip: **"Laporan bisa dibuat dalam <1 menit"** → endpoint harus ringkas, satu kali kirim.

**Implementasi saat ini — `POST /api/v1/reports`:**
- Body `LaporanCreate`: `ruang_publik_id` (wajib), `deskripsi` (wajib), `jenis_masalah`, `fasilitas_id`, `mode_identitas`, `foto_url`.
- Token **opsional** (header `Authorization`): anonim kirim tanpa token; mode `tampilkan_nama` wajib token (divalidasi di service).
- Saat create: status `menunggu_verifikasi` + baris timeline `Laporan dikirim` dibuat otomatis.
- Response `201` + `LaporanResponse`.

### Gap 1 — Upload Foto (wajib dikerjakan)

Saat ini `foto_url` **selalu `null`** — `FormLaporPage` FE mengirim string dummy karena **belum ada endpoint upload**. Padahal `app/core/file_upload.py` **sudah siap dan belum dipakai endpoint mana pun**:

- `validate_image_upload(file)` — cek MIME (`image/jpeg|png|jpg|webp`) + ukuran (≤ `MAX_UPLOAD_SIZE`, default 5 MB)
- `save_upload_file(file, subfolder)` → nama unik UUID → path publik `/uploads/<subfolder>/<nama>`

**Langkah:**

- [ ] Buat endpoint upload, mis. `POST /api/v1/uploads` (router baru `app/api/v1/uploads.py`, daftarkan di `api.py`):
  - parameter: `file: UploadFile`, `subfolder: Literal["laporan","ruang-publik"]` (atau pisah 2 endpoint) — pakai `python-multipart` yang sudah ada di requirements
  - auth: **opsional** (ikuti kebijakan laporan anonim — jangan paksa login untuk warga anonim; bila nanti ternyata perlu dibatasi, keputusan dicatat di sini)
  - respons: `{ "url": "/uploads/laporan/abc123.jpg" }`
  - galat: `400` untuk MIME salah / >5 MB (pesan dari `file_upload.py` sudah ada)
- [ ] `storage/laporan/` & `storage/ruang-publik/` sudah dibuat `main.py` saat start — jangan ubah pola.
- [ ] Setelah ada: update `04-api-endpoints.md` + `docs/API.md`; **beri tahu workflow frontend** bahwa `FormLaporPage` tinggal mengisi `foto_url` dari respons upload.

**Verifikasi:**
```bash
curl -X POST http://localhost:8000/api/v1/uploads \
  -F "file=@foto.jpg" -F "subfolder=laporan"
# → 201/200 {"url":"/uploads/laporan/<uuid>.jpg"}; buka URL-nya di browser → gambar tampil
curl -X POST ... -F "file=@catatan.txt"    # → 400 (MIME)
# unggah file > 5MB                        # → 400 (ukuran)
```

### Gap 2 — Rate Limiting (NFR-002)

PRD NFR-002 mewajibkan rate-limiting endpoint laporan **untuk mencegah spam**. Saat ini tidak ada.

- [ ] Implementasi ringan tanpa dependency berat: middleware in-process sederhana per-IP (mis. deque timestamp, threshold seperti 10 laporan / 10 menit / IP) di `app/middleware/` (folder sudah ada, kosong), pasang khusus ke `POST /reports`.
- [ ] Balas `429` dengan pesan jelas; jangan mengandalkan dependency berat (Redis dsb. — di luar MVP).
- [ ] Dokumentasikan threshold di file ini + `04-api-endpoints.md`.

**Verifikasi:** kirim >threshold laporan cepat dari IP sama → laporan berikutnya `429`; lewat jendela waktu → kembali normal.

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
- `GET /api/v1/reports/{id}` → detail + timeline (terbuka; pelapor bisa memantau — walau belum terfilter kepemilikan, lihat FEAT-013).
- Daftar status kanonik (lihat `03-database-schema.md` §4): `menunggu_verifikasi → diverifikasi → dalam_penanganan → selesai` / `ditolak`.

**GAP TERVERIFIKASI — filter tayang per-ruang publik selalu kosong:**

`services/laporan.py::get_reports_by_ruang_publik` menyaring:

```python
Laporan.status.in_(["disetujui", "tayang_otomatis"])   # ❌ nilai ini TIDAK PERNAH dibuat sistem mana pun
```

Akibatnya `GET /api/v1/public-spaces/{id}/reports` **selalu mengembalikan `[]`** — riwayat laporan publik per titik (inti FEAT-010 & motivasi produk di PRD §2) tidak pernah tampil.

**Langkah perbaikan:**

- [ ] Ganti daftar filter menjadi **status yang berarti "sudah tayang"** — daftar tunggal yang sama dipakai di seluruh sistem:
  ```
  tayang = ("diverifikasi", "dalam_penanganan", "selesai")
  ```
  (`menunggu_verifikasi` = belum tayang; `ditolak` = tidak tayang.)
- [ ] Jadikan daftar ini **konstanta bersama** (mis. di `services/laporan.py` atau modul `app/core/status.py`) dan **pakai ulang** di galeri foto (FEAT-007) — jangan definisikan dua kali.
- [ ] (Putuskan & catat) Apakah `GET /reports` (daftar publik umum) juga harus otomatis hanya menampilkan yang tayang? Saat ini semua status terlihat publik. Rekomendasi MVP: daftar publik umum ikut memakai daftar tayang; daftar admin tetap semua (moderasi perlu melihat antrian).
- [ ] Sinkronkan `docs/API.md`.

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

**Implementasi saat ini: BELUM.**

- `GET /api/v1/reports` menerima `status`, `wilayah`, `q`, `skip`, `limit` — **tanpa parameter pemilik** → konsumen FE (`getUserReports`) saat ini melihat **semua** laporan pengguna lain.
- **Service sudah siap:** `services/laporan.py::get_reports(..., user_id=...)` sudah mendukung filter `user_id` — yang belum ada di router.

**Langkah (urut):**

- [ ] Pilih mekanisme (catat pilihan di sini):
  - **Opsi A (disarankan):** `GET /api/v1/reports?mine=true` → router membaca token via `oauth2_scheme` (opsional di endpoint lain, tapi **wajib** saat `mine=true`; tanpa token → `401`), lalu meneruskan `user_id` hasil `verify_token` ke service.
  - **Opsi B:** endpoint terpisah `GET /api/v1/reports/mine` (token wajib) — lebih eksplisit, tapi menambah path baru.
- [ ] Implementasi di router (jangan ubah service — sudah mendukung).
- [ ] Filter `status`/`q`/`wilayah` tetap bisa dikombinasi dengan `mine`.
- [ ] Update `04-api-endpoints.md` + `docs/API.md`; beri tahu FE untuk menambah param `mine=true` di `getUserReports`.
- [ ] Laporan anonim milik sesi ini: `user_id` tersimpan meski `mode_identitas=anonim` (lihat kode create — `user_id` tetap diisi bila token ada) → laporan anonim yang dibuat sambil login **tetap muncul di Laporan Saya pemiliknya**, tanpa membuka identitas ke publik. Pastikan perilaku ini dipertahankan dan diuji.

**Verifikasi:**
```bash
# login user A → kirim 1 laporan; login user B → kirim 1 laporan
curl -H "Authorization: Bearer $TOKEN_A" "http://localhost:8000/api/v1/reports?mine=true"
# → hanya laporan A
curl "http://localhost:8000/api/v1/reports?mine=true"          # → 401
```

---

## Urutan Pengerjaan (rekomendasi)

1. **FEAT-010** (filter tayang) — perbaikan kecil, dampak besar ke produk.
2. **FEAT-013** (mine) — router saja, service sudah siap.
3. **FEAT-008** gap upload foto — endpoint baru.
4. **FEAT-008** gap rate limiting — middleware.
5. (FEAT-007 galeri di `public-space-service.md` memakai rumus tayang dari langkah 1.)

---

## Test Regresi Wajib (untuk `06-testing-strategy.md`)

- [ ] Create anonim → 201, `nama_pelapor is None`, `user_id is None`
- [ ] Create `tampilkan_nama` tanpa token → 400
- [ ] Create `tampilkan_nama` + token → `nama_pelapor` = nama user token (payload diretas tidak mempan)
- [ ] Create → status `menunggu_verifikasi` + timeline entry pertama ada
- [ ] `mine=true` dengan token A tidak mengembalikan laporan B
- [ ] Filter tayang: `menunggu_verifikasi` tidak tayang; `diverifikasi` tayang; `ditolak` tidak tayang
- [ ] Upload: JPEG kecil 2xx + URL terbuka; `.txt` 400; >5MB 400
- [ ] Rate limit: spam > threshold → 429

---

## Verifikasi Akhir File Ini

- [ ] Empat FEAT (008–010, 013) punya status & langkah yang bisa langsung dikerjakan
- [ ] Semua gap di atas punya verifikasi curl yang bisa dijalankan
- [ ] Tidak ada pembahasan moderasi admin (→ `moderation-service.md`) atau upload galeri resmi (→ `public-space-service.md`)
- [ ] `04-api-endpoints.md` & `docs/API.md` sinkron setelah tiap gap ditutup
