# CHECKLIST E2E - FE-31 (Alur End-to-End)

> Fase H - Testing. Skenario E2E **manual terstruktur** (tanpa Playwright), dieksekusi di browser
> dengan backend hidup. Setiap skenario dijalankan utuh dari awal sampai akhir.

## Persiapan

- Backend hidup + frontend `npm run dev`.
- Siapkan **dua akun warga** (A & B) dan **satu admin** (`petugas@jakarta.go.id` / dari `.env`).
- Siapkan satu foto uji (jpg/png) untuk diunggah di skenario lapor.
- Izinkan lokasi browser bila diminta (untuk pin peta & rute OSRM).

## Cara mengisi

`OK` bila seluruh langkah & ekspektasi terpenuhi; `GAGAL` + catatan bila ada yang tidak sesuai.

---

## S1 - Eksplorasi warga
| Langkah | Ekspektasi |
|---|---|
| Buka `/home` | Beranda tampil; ketik "Suropati" di search → Enter | Berpindah ke `/ruang-publik` dengan hasil tersaring |
| Pilih chip kategori "Taman Kota" | URL memuat `?kategori=taman-kota`; daftar tersaring; refresh tetap tersaring |
| Buka satu ruang dari daftar | Halaman detail tampil (nama, kategori, alamat, jam, fasilitas) |
| Lihat section "Galeri Foto" (bila ada >1 foto) | Grid foto tampil; klik foto → lightbox; prev/next; Esc menutup |
| Buka peta detail → "Tampilkan Peta" → izinkan lokasi | Garis rute OSRM tampil dari lokasi Anda ke tujuan; marker tujuan terlihat |

Hasil S1: ____

## S2 - Kirim laporan (sebagai Warga A, login)
| Langkah | Ekspektasi |
|---|---|
| Login sebagai A → buka detail ruang → tombol Lapor | Form lapor terbuka (fasilitas & ruang terisi otomatis) |
| Isi: pilih fasilitas, geser pin, unggah foto, deskripsi | Counter deskripsi `n/200`; pratinjau foto |
| Pilih identitas "Anonim"; submit | Panel hasil muncul (tayang / menunggu tinjauan) |
| Klik "Lihat Status Laporan" | Halaman detail status terbuka; stepper sesuai status |

Hasil S2: ____

## S3 - Pantau laporan (Warga A)
| Langkah | Ekspektasi |
|---|---|
| Buka `/laporan-saya` | Laporan dari S2 tampil; tab sesuai status |
| Cek tab "Ditolak" (bila ada laporan ditolak) | Laporan ditolak tampil + alasan penolakan |
| Buka detail laporan | Stepper + kartu bukti foto (counter + badge Asli) |
| Logout | Kembali ke beranda/masuk |

Hasil S3: ____

## S4 - Moderasi admin
| Langkah | Ekspektasi |
|---|---|
| Login admin → `/dashboard` | Statistik tampil; klik "Unduh Laporan (CSV)" → file CSV terunduh |
| Buka `/dashboard/moderasi` | Antrian menampilkan laporan (termasuk `menunggu_verifikasi`) |
| Buka detail laporan dari S2 | Stepper + panel aksi tampil |
| Isi catatan → klik "Setujui Laporan" (atau Tolak + alasan) | Status berubah; stepper/timeline ter-update; pesan sukses (bukan alert palsu) |
| Kembali ke antrian | Status baris ikut berubah |

Hasil S4: ____

## S5 - Konsistensi data & privasi
| Langkah | Ekspektasi |
|---|---|
| Login Warga B → `/laporan-saya` | Laporan milik A **tidak** muncul (privasi `/mine`) |
| Login Warga A → `/laporan-saya` | Laporan A muncul |
| Buka detail ruang publik (bila laporan tayang) | Laporan muncul di section "Pembaruan Partisipasi Warga" dan fotonya (bila ada) di galeri |
| Cek galeri: foto laporan berlabel "Dokumentasi Warga" | Label benar untuk foto dari laporan (bukan foto resmi) |

Hasil S5: ____

---

## Kriteria lolos
- [ ] S1–S5 semua OK.
- [ ] 0 error console di sepanjang alur.
- [ ] Tidak ada regresi visual/JS saat perpindahan halaman.

## Temuan
| # | Skenario | Masalah | Severity | Tindak lanjut |
|---|---|---|---|---|
| - | - | - | - | - |

> Bug yang ditemukan dicatat di sini; perbaikan = commit terpisah.
