# CHECKLIST UJI MANUAL - FE-30 (Desktop & Mobile)

> Fase H - Testing. Dieksekusi manual di browser dengan backend hidup.
> Tujuan: verifikasi seluruh layar publik & admin render benar + alur interaksi utama jalan,
> di **desktop** dan **mobile**.

## Persiapan

1. Backend hidup: `docker compose up -d` + `uvicorn app.main:app --reload` (http://localhost:8000).
2. Frontend: `cd apps/web && npm run dev` (catat port, mis. http://localhost:5173).
3. Akun uji:
   - Warga A & B (daftar via form register atau `POST /api/v1/auth/register`).
   - Admin: `petugas@jakarta.go.id` / `RukaJakarta2026` (dari `backend/.env`).
4. Data uji (opsional, untuk galeri & section partisipasi): ruang publik yang punya foto
   + laporan tayang (mis. `rth-09107c86114d`).

## Cara mengisi

Tiap baris: jalankan langkahnya, tulis `OK` / `GAGAL (catatan)`. Fokus: **render tanpa error**,
**0 error di console** (F12 → Console), alur utama berfungsi.

---

## A. DESKTOP (lebar ≥ 1280px)

### Publik
| # | Layar | Alur singkat | Hasil |
|---|---|---|---|
| D1 | Beranda `/home` | Muat halaman; hero, kartu pilihan, "Cek Kondisi", "Temukan Ruang Publik", banner CTA tampil | |
| D2 | Daftar `/ruang-publik` | Muat; filter kategori/wilayah/fasilitas; urutkan; peta tampil; kartu list | |
| D3 | Detail `/ruang-publik/:id` | Muat; header, peta akses, kondisi fasilitas, **galeri foto** (klik → lightbox, prev/next, Esc), section partisipasi + filter status + "Muat Lebih Banyak" | |
| D4 | Detail Fasilitas `/ruang-publik/:id/fasilitas/:fid` | Klik "Rincian" dari daftar fasilitas → halaman terbuka; kondisi, peta posisi, tombol Laporkan | |
| D5 | Form Lapor `/ruang-publik/:id/lapor` | Kartu "Lokasi Terpilih" (pill Tersinkron + sub-kartu); pilih fasilitas; peta pin; unggah foto; deskripsi (counter n/200); identitas; submit → panel hasil | |
| D6 | Detail Status `/laporan-saya/:id` | Stepper timeline; kartu bukti foto (counter + badge Asli); catatan warga | |
| D7 | Laporan Saya `/laporan-saya` | Tab (Semua/Dalam Penanganan/Selesai/Menunggu/Ditolak); tombol "Lihat Riwayat" utk selesai; box pembaruan | |
| D8 | Login/Register `/login` | Tab Masuk/Daftar; register: nama, email, sandi, **konfirmasi sandi**, hint 8, checkbox S&K, footer "Sudah memiliki akun?" | |
| D9 | Login Pemerintah `/login-pemerintah` | Form; footer "Hubungi administrator sistem" | |
| D10 | Tentang `/tentang` | Muat; FAQ; statistik | |

### Admin (login admin dulu)
| # | Layar | Alur singkat | Hasil |
|---|---|---|---|
| D11 | Dashboard `/dashboard` | Statistik; **tabel** (scroll bila sempit); tombol **Unduh CSV** (file terunduh); peta admin | |
| D12 | Antrian `/dashboard/moderasi` | Tabel; filter; aksi baris | |
| D13 | Detail Moderasi `/dashboard/moderasi/:id` | Stepper; catatan petugas; panel aksi (Setujui / Dalam Penanganan / Selesai / Tolak + alasan); timeline | |
| D14 | Data Master `/dashboard/data-master` | Tabel; kolom SUMBER DATA; Edit Master (modal) | |
| D15 | Kelola Fasilitas `/dashboard/fasilitas` | Tabel fasilitas | |

---

## B. MOBILE (375px - devtools responsive mode, mis. "iPhone SE/8")

Fokus: tidak ada overflow horizontal, elemen tidak saling tindih, navigasi tetap terpakai.

| # | Area | Yang dicek | Hasil |
|---|---|---|---|
| M1 | Navbar publik | Menu tampil sebagai baris **scroll horizontal** (tidak hilang); logo & tombol tetap rapi | |
| M2 | Footer | 3 kolom menumpuk jadi 1 kolom | |
| M3 | Detail ruang publik | Grid peta+jam menumpuk 1 kolom; galeri rapi; tidak ada scroll horizontal | |
| M4 | Detail status laporan | Grid dua-kolom menumpuk; **stepper** bisa di-scroll/rapi | |
| M5 | Detail moderasi | Grid menumpuk; panel aksi tetap terjangkau | |
| M6 | Form lapor | Kartu lokasi 2 kolom menumpuk; field & tombol nyaman ditekan | |
| M7 | Laporan Saya | Kartu gambar+isi menumpuk; tab bisa digeser | |
| M8 | Tabel admin (Dashboard/Moderasi/DataMaster) | Tabel **scroll horizontal** (tidak memotong layout halaman) | |
| M9 | Modal/lightbox | Terbuka & tertutup nyaman; tombol terjangkau | |

---

## C. Kriteria lolos

- [ ] Semua baris A & B = OK.
- [ ] 0 error (merah) di Console pada semua halaman.
- [ ] Tidak ada overflow horizontal pada lebar 375px.
- [ ] Alur utama (login, buka detail, buka form, submit) berfungsi.

## Temuan

| # | Layar | Masalah | Severity | Tindak lanjut |
|---|---|---|---|---|
| - | - | - | - | - |

> Temuan yang perlu perbaikan kode dicatat di sini; perbaikan dibuat sebagai commit terpisah (di luar Fase H).
