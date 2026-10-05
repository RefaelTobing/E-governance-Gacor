# LAPORAN VERIFIKASI BE-20

Tanggal: 5 Oktober 2026
Pekerjaan: BE-20 (kontrak `POST /reports` + perbaikan anonim), BE-46 (kolom lokasi),
BE-49 (`POST /uploads`), FE-16 (foto wajib), FE-17 (geolocation)
Status: **LULUS**

## Ringkasan hasil

| Tahap | Metode | Hasil |
|-------|--------|-------|
| Unit test backend | `pytest tests\unit` | 23 passed |
| Kontrak API black-box | 18 kasus (U1-U6, R1-R8, regresi) | 18/18 lulus |
| Verifikasi browser | Playwright 15 skenario (B1-B13) | 15/15 lulus |
| Build frontend | `npm run build` | Sukses (5.76s) |
| Migrasi DB | `alembic current` | `37c407708e27 (head)` |

Detail per kasus ada di `docs/VERIFIKASI_BE20.md`.

## Yang dikerjakan

- Backend: `POST /api/v1/uploads` (validasi tipe, ukuran 5MB, magic bytes; ekstensi mengikuti
  isi file), `POST /api/v1/reports` (foto wajib, URL dibatasi ke `/uploads/laporan/`, file wajib
  ada di server, pasangan koordinat, mode `tampilkan_nama` wajib login, nama diambil dari DB),
  4 kolom lokasi di model/skema, migration Alembic.
- Frontend: form lapor dua langkah (unggah lalu submit), foto wajib dengan validasi klien,
  geolocation opsional (submit tetap jalan saat izin ditolak), perbaikan spread `api.upload`
  yang menimpa header auth, breadcrumb pakai `<Link>` (bisa di-tab).
- Dokumentasi: `docs/API.md`, `docs/schema.sql`, workflow, changelog, dan dokumen fitur
  diselaraskan dengan perilaku final endpoint.

## Temuan

- `/laporan-saya` adalah rute terproteksi; anonim di-redirect ke `/login`, sehingga skenario
  riwayat diverifikasi lewat sesi login warga. Ini catatan divergensi dari kontrak asli yang
  meminta verifikasi anonim.
- File verifikasi sebelumnya (`VERIFIKASI_BE20.md` dan lainnya) hilang dari working tree
  (kemungkinan `git clean`) dan tidak pernah ter-commit; ditulis ulang dari hasil run final.
- Ada stash `wip-be20` berisi versi pekerjaan ini dari sesi sebelumnya; 15 file (dokumen,
  frontend, migrasi) diambil dari sana, kode backend memakai versi working tree yang sudah
  lolos semua pengujian. Stash ditinggal utuh.

## Tindak lanjut (di luar lingkup kali ini)

- BE-21: baca koordinat EXIF foto saat upload (`lat_exif`/`long_exif` sudah tersedia di skema).
- BE-22/BE-23: validasi jarak Haversine + ambang 100m untuk status `tayang`/`menunggu_tinjauan`.
- Peringatan bundle chunk >500 kB sudah ada sebelum perubahan ini; bisa ditangani terpisah.
