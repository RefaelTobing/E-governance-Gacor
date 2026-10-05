# Verifikasi BE-20: Laporan, Foto, dan Lokasi

Tanggal: 5 Oktober 2026
Status akhir: **LULUS (semua tahap hijau)**

## Lingkup pekerjaan

| ID | Isi |
|----|-----|
| BE-46 | Migration Alembic: kolom `lat_user`, `long_user`, `lat_exif`, `long_exif` di tabel `laporan` |
| BE-49 | Endpoint `POST /api/v1/uploads` (unggah foto, publik, subfolder `laporan`) |
| BE-20 | `POST /api/v1/reports`: foto wajib, validasi URL foto, pasangan koordinat, mode identitas anti-spoof |
| FE-16 | Form Lapor: foto wajib, validasi tipe/ukuran di klien sebelum submit |
| FE-17 | Geolocation browser saat submit, dikirim sebagai `lat_user`/`long_user` |

## Lingkungan

- Database: PostgreSQL `raku-db` (Docker), `alembic current` = `37c407708e27 (head)`
- Backend: uvicorn `http://localhost:8000`
- Frontend: Vite `http://localhost:5173`
- Alat: pytest (unit), urllib (kontrak black-box), Playwright Chromium (browser)

## 1. Unit test backend

```
pytest tests\unit -q  ->  23 passed
```

Cakupan: validasi foto wajib/prefix/keberadaan file, pasangan koordinat, mode identitas,
rentang geografis Pydantic (422), upload (tipe, ukuran, magic bytes).

## 2. Kontrak API (black-box): 18/18 lulus

### Upload `POST /api/v1/uploads`

| Kasus | Input | Hasil |
|-------|-------|-------|
| U1 | JPEG valid | 201, `{"url": "/uploads/laporan/<hex>.jpg"}` |
| U2 | GET url hasil U1 | 200 |
| U3 | File `.txt` (content-type `text/plain`) | 400 `Tipe file tidak diizinkan. Harap upload gambar (JPEG, PNG, WEBP).` |
| U4 | JPEG 5.242.894 byte (>5MB) | 400 `Ukuran file melebihi batas maksimal 5MB.` |
| U5 | Nama `.jpg`, isi teks (magic bytes salah) | 400 `Isi file bukan gambar asli (magic bytes tidak cocok).` |
| U6 | Tanpa field file | 422 (validasi Pydantic) |

### Laporan `POST /api/v1/reports`

| Kasus | Input | Hasil |
|-------|-------|-------|
| R1 | Tanpa token, mode `anonim`, koordinat lengkap | 201, `user_id`/`nama_pelapor` null, `lat_user`/`long_user` ter-echo, `status=menunggu_verifikasi` |
| R2 | Mode `tampilkan_nama` tanpa token | 400 `Untuk menampilkan nama, silakan login. Atau pilih mode anonim.` |
| R3 | Login warga, kirim `nama_pelapor` berbeda | 201, nama diambil dari DB (spoof gagal): `Uji BE20` |
| R4 | `foto_url` valid tapi file tidak ada | 400 `File foto tidak ditemukan di server.` |
| R5 | `foto_url` di luar `/uploads/laporan/` | 400 `URL foto tidak valid (harus berada di /uploads/laporan/).` |
| R6 | `lat_user` tanpa `long_user` | 400 `Koordinat lokasi harus lengkap (latitude dan longitude).` |
| R7 | `lat_user=999` (di luar -90..90) | 422 (Pydantic) |
| R8 | Tanpa koordinat sama sekali | 201 (koordinat opsional sampai BE-23) |

### Regresi

| Kasus | Hasil |
|-------|-------|
| GET `/api/v1/reports` | 200 |
| GET `/api/v1/reports/{id}` | 200 |
| PATCH `/api/v1/reports/{id}/status` tanpa token | 401 |
| GET foto yang diunggah | 200 |

## 3. Verifikasi browser (Playwright): 15/15 lulus

| Skenario | Hasil |
|----------|-------|
| B1 State awal form (heading, label foto wajib, `*Wajib`, area unggah, tanpa modal) | LULUS |
| B2 Submit tanpa foto | Galat klien `Foto bukti fisik wajib diunggah.`, request tidak terkirim |
| B3 File `.txt` ditolak klien | Galat klien sesuai validasi tipe |
| B4 File >5MB ditolak klien | Galat klien sesuai validasi ukuran |
| B5 Foto valid: preview, Hapus kembali ke awal, pilih ulang | LULUS |
| B6 Submit sukses | uploads 201 + reports 201, `foto_url=/uploads/laporan/...`, `lat=-6.192` `long=106.823` ter-echo |
| B6b Dialog sukses | Muncul dan di-accept: `Laporan berhasil dikirim! ...` |
| B7 Privasi | Presisi koordinat tidak tampil di halaman |
| B7b Privasi riwayat | Koordinat tidak tampil di `/laporan-saya` |
| B8 `/laporan-saya` (sesi login) | Thumbnail foto (GET foto 200), status `Menunggu Verifikasi` |
| B9 Tanpa izin geolocation | Submit tetap 201, `lat_user`/`long_user` null |
| B10 Detail moderasi | `img[alt="Bukti Foto"]` src absolut `/uploads/laporan/...`, GET 200 |
| B11 Keyboard | Tab ke box foto, focus ring terlihat, Enter membuka file picker |
| B12 Mobile 390px | Tanpa scroll horizontal di direktori dan riwayat |
| B13 Konsol | Tanpa error |

Screenshot: `%TEMP%\be20-shots\` (b1-form-awal, b5-preview, b8-riwayat, b10-moderasi).

## 4. Build frontend

```
npm run build  ->  ✓ built in 5.76s
```

Warning chunk >500 kB sudah ada sebelum perubahan ini (bukan regresi).

## 5. Catatan dan penyesuaian

- `/laporan-saya` dideklarasikan `protected: true`, jadi anonim di-redirect
  ke `/login` oleh `RequireAuth`. Skenario B8 diverifikasi lewat sesi login warga, bukan sebagai
  anonim. Perilaku ini konsisten dengan rute aplikasi; catatan divergensi dari kontrak asli.
- Migration `37c407708e27_tambah_kolom_lokasi_laporan.py` dijalankan ke DB `raku-db`, chain
  alembic utuh sampai head.
- Skrip verifikasi: `%TEMP%\be20_ur.py` (kontrak), `%TEMP%\be20_b.py` (browser).
- Dokumen verifikasi sebelumnya hilang dari working tree (kemungkinan `git clean`); file ini
  ditulis ulang dari hasil run final.

## Kesimpulan

Seluruh tahap hijau: 23 unit test, 18/18 kontrak API, 15/15 skenario browser, build sukses,
migrasi di head. **BE-20, BE-46, BE-49, FE-16, FE-17 dinyatakan LULUS verifikasi.**
