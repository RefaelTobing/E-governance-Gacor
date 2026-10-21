# AUDIT VISUAL G1 — Verifikasi 12 Layar vs Figma

> Bagian dari Fase G-visual (`backend/docs/WORKFLOW_FRONTEND_PHASES.md` §8 G1).
> Metodologi: bandingkan screenshot Figma (`apps/web/Public/RukaFinalFigma/Screen*.png`)
> vs kode halaman. Tiap temuan diberi label keyakinan:
> - `[KODE]` selisih pasti dari kode vs Figma
> - `[CEK MANUAL]` dugaan struktur, perlu konfirmasi mata di browser
> - `[DEVIASI DISENGAJA]` fitur lahir setelah Figma (bukan kesalahan)
> - `[FITUR BELUM ADA]` ada di Figma, belum ada di aplikasi
>
> **Status: SELESAI DIKERJAKAN (subset terpilih).** User memilih 15 temuan diperbaiki;
> sisanya di-skip/dibiarkan. Eksekusi: lihat tanda ✅/⏭️ per temuan di bawah.
> Prioritas: HIGH (menyimpang nyata dari desain) / LOW (kosmetik halus / penamaan).
>
> **Ringkasan eksekusi:**
> - ✅ Dikerjakan: G1-02, G1-04, G1-14, G1-37, G1-39, G1-40, G1-51, G1-52, G1-54,
>   G1-60, G1-64, G1-71, G1-72, G1-84, G1-87
> - ⏭️ Skip atas keputusan user: G1-01, G1-09, G1-12, G1-13, G1-31
> - ⏸️ Dibiarkan: G1-70 (sidebar 6 menu), semua `[DEVIASI DISENGAJA]`, semua temuan LOW

## Pemetaan layar

| # | Layar | Route | File | Figma |
|---|---|---|---|---|
| 1 | Login/Register Warga | `/login` | `LoginPage.jsx` | `Screen 01B — Register Warga*.png` |
| 2 | Beranda | `/home` | `HomePage.jsx` | `Screen 01a/02 — Beranda Awal*.png` |
| 3 | Daftar Ruang Publik | `/ruang-publik` | `DaftarRuangPublikPage.jsx` | `Screen 03 — Daftar Ruang Publik*.png` |
| 4 | Detail Ruang Publik | `/ruang-publik/:id` | `DetailRuangPublikPage.jsx` | `Screen 04 — Detail Ruang Publik.png` |
| 5 | Detail Fasilitas | *sub-view* | `DetailFasilitasRuangPublik*.jsx` | `Screen 05 — Detail Fasilitas.png` |
| 6 | Form Pelaporan | `/ruang-publik/:id/lapor` | `FormLaporPage.jsx` | `Screen 06 — Form Pelaporan*.png`, `06B` |
| 7 | Detail Status Laporan | `/laporan-saya/:id` | `DetailStatusLaporanPage.jsx` | `Screen 07 — Detail Status Laporan.png` |
| 8 | Laporan Saya | `/laporan-saya` | `RiwayatLaporanPage.jsx` | `Screen 08 — Laporan Saya.png` |
| 9 | Login Pemerintah | `/login-pemerintah` | `LoginPemerintahPage.jsx` | `Screen 09 — Login Pemerintah*.png` |
| 10 | Dashboard Pemerintah | `/dashboard` | `DashboardPage.jsx` | `Screen 10 — Dashboard Pemerintah.png` |
| 11 | Daftar Laporan | `/dashboard/moderasi` | `AntrianModerasiPage.jsx` | `Screen 11 — Daftar Laporan.png` |
| 12 | Detail Laporan | `/dashboard/moderasi/:id` | `DetailModerasiPage.jsx` | `Screen 12 — Detail Laporan Pemerintah.png` |
| 13 | Tentang | `/tentang` | `TentangPage.jsx` | *(tidak ada Figma khusus — audit ringan)* |

---

## Ringkasan prioritas

**HIGH (16 temuan):** G1-01, G1-02, G1-04, G1-09, G1-12, G1-14, G1-31, G1-37, G1-39, G1-40, G1-51, G1-52, G1-54, G1-60, G1-64, G1-71, G1-72, G1-84, G1-87, G1-70.
**LOW:** sisanya (penamaan/ikon/detail halus).

**Kategori khusus (bukan perbaikan, perlu keputusan):**
- `[DEVIASI DISENGAJA]`: G1-08, G1-16, G1-19, G1-21, G1-35, G1-43, G1-61, G1-70.
- `[FITUR BELUM ADA]`: G1-15, G1-37, G1-76, G1-78, G1-83, G1-88.

---

## LAYAR 1 — Login/Register Warga

### G1-01 [LAYAR 1] ⏭️ (skip) [KODE] Tidak ada eyebrow "Portal Warga DKI Jakarta"
- Prioritas: HIGH
- Figma: di atas judul ada label kecil teal uppercase "Portal Warga DKI Jakarta".
- Kode: `LoginPage.jsx:64-76` — hanya Logo + h2 + paragraf.
- Usulan: tambah `<span>` uppercase teal (12px, weight 700, letter-spacing) antara Logo dan h2.

### G1-02 [LAYAR 1] ✅ [KODE] Judul form tidak sesuai desain
- Prioritas: HIGH
- Figma: register → "Daftar Akun RuangTerbuka"; masuk → "Masuk ke Akun Anda".
- Kode: `LoginPage.jsx:69` — `'Daftar Akun Warga'` / `'Masuk Warga Jakarta'`.
- Usulan: samakan string dengan Figma.

### G1-03 [LAYAR 1] [KODE] Label tab "Daftar Baru" vs "Daftar"
- Prioritas: LOW
- Figma: tab kanan "Daftar".
- Kode: `LoginPage.jsx:114` — "Daftar Baru".
- Usulan: ubah jadi "Daftar".

### G1-04 [LAYAR 1] ✅ [KODE] Field register belum lengkap (Konfirmasi Sandi, hint, checkbox S&K, tombol Google, footer)
- Prioritas: HIGH
- Figma: register punya Konfirmasi Sandi (ikon mata), hint "Minimal 8 karakter", checkbox Syarat & Ketentuan, divider "ATAU DAFTAR DENGAN" + tombol Google, footer "Sudah memiliki akun? Masuk...".
- Kode: `LoginPage.jsx:134-167` — hanya Nama, Email, Kata Sandi.
- Usulan: tambah Konfirmasi Sandi + hint + checkbox S&K + footer link. Bagian Google OAuth → konfirmasi dulu (kemungkinan `[FITUR BELUM ADA]` karena tak ada backend OAuth).
- Catatan: field "Nomor WhatsApp" **sengaja dihapus** di Fase E (backend tak menerima phone). Jangan ditambah ulang kecuali diperintahkan.

### G1-05 [LAYAR 1] [KODE] Input tanpa ikon kiri & toggle mata
- Prioritas: LOW
- Figma: input punya ikon kiri (user/mail/phone/lock) + mata untuk sandi.
- Kode: `LoginPage.jsx:136-162` pakai `<Input>` generik; `Input.jsx:28-38` tak dukung ikon/toggle.
- Usulan: tambah slot ikon + toggle password di `Input`.

### G1-06 [LAYAR 1] [KODE] Lebar kartu & label tombol beda
- Prioritas: LOW
- Figma: kartu ±590px; tombol "Daftar Akun Baru" + ikon panah.
- Kode: `LoginPage.jsx:63` maxWidth `460px`; tombol `LoginPage.jsx:164-166` tanpa ikon.
- Usulan: sesuaikan maxWidth + ikon panah + label.

### G1-07 [LAYAR 1] [CEK MANUAL] Header auth & latar
- Prioritas: LOW
- Figma: navbar auth hanya logo; kode (`PublicLayout.jsx:62-67`) menampilkan "Kembali ke Beranda".
- Usulan: verifikasi visual; bila tombol itu disengaja → `[DEVIASI DISENGAJA]`.

### G1-08 [LAYAR 1] [DEVIASI DISENGAJA] Toggle Masuk/Daftar sebagai tab internal
- Prioritas: LOW
- Kode: `LoginPage.jsx:79-116`. Bukan kesalahan; perilaku sama dengan desain.

## LAYAR 2 — Beranda

### G1-09 [LAYAR 2] ⏭️ (skip) [KODE] Hero: slider foto gelap vs gradient terang
- Prioritas: HIGH
- Figma: hero = gradient terang (hijau muda→putih), heading gelap "Pantau Kondisi Ruang Publik Jakarta", tanpa foto.
- Kode: `HomePage.jsx:96-167` — Swiper foto + overlay gelap; heading putih (baris 189).
- Usulan: konfirmasi apakah slider disengaja → bila ya `[DEVIASI DISENGAJA]`; bila belum diperintahkan → ganti ke gradient terang + heading gelap.

### G1-10 [LAYAR 2] [CEK MANUAL] Label chip kategori
- Prioritas: LOW
- Figma: Taman, RTH, Lapangan Olahraga, Hutan Kota, Jalur Pedestrian.
- Kode: `HomePage.jsx:239-248` (dari MOCK_CATEGORIES). Usulan: pastikan label & ikon cocok.

### G1-11 [LAYAR 2] [KODE] Tidak ada eyebrow "Direktori Terkini"
- Prioritas: LOW
- Figma: eyebrow kecil + titik hijau sebelum heading "Ruang Publik Pilihan di Jakarta".
- Kode: `HomePage.jsx:300-310`. Usulan: tambah eyebrow.

### G1-12 [LAYAR 2] ⏭️ (skip) [KODE] Grid kartu pilihan asimetris, bukan 3 kolom seragam
- Prioritas: HIGH
- Figma: 3 kartu sejajar sama besar.
- Kode: `HomePage.jsx:341-447` + `index.css:1079-1084` (1 besar + 2 kecil).
- Usulan: ubah ke grid 3 kolom seragam (bila belum disengaja).

### G1-13 [LAYAR 2] ⏭️ (skip) [KODE] Label tombol "Lihat Detail Ruang" vs "Lihat Detail"
- Prioritas: LOW
- Kode: `HomePage.jsx:403-405, 439-441`. Usulan: "Lihat Detail".

### G1-14 [LAYAR 2] ✅ [KODE] Banner CTA & section kategori menyimpang
- Prioritas: HIGH
- Figma: banner terang, teks teal + deskripsi gelap, tombol putih "Laporkan Masalah"; ada section "Temukan Ruang Publik di Sekitarmu" (KATEGORI 01-03).
- Kode: `HomePage.jsx:509-542` + `index.css:1725` (banner teal penuh, eyebrow, checklist, tombol "Pelajari Cara Melapor"); section kategori explorer tidak ada.
- Usulan: selaraskan warna banner + label tombol "Laporkan Masalah"; tambah section kategori. Checklist/eyebrow → `[DEVIASI DISENGAJA]`.

### G1-15 [LAYAR 2] [FITUR BELUM ADA] Status kartu "Cek Kondisi Fasilitas" seragam "Kondisi Baik"
- Prioritas: LOW
- Figma: kartu punya status berbeda (Penerangan=Rusak, Bangku=Perlu Perhatian).
- Kode: `HomePage.jsx:468,479,490,501` — semua `status="baik"`.
- Usulan: sesuaikan status per kartu (statis) atau ambil data dinamis.

### G1-16 [LAYAR 2] [DEVIASI DISENGAJA] Checklist + eyebrow pada CTA
- Prioritas: LOW. Kode: `HomePage.jsx:513, 518-527`.

## LAYAR 3 — Daftar Ruang Publik

### G1-17 [LAYAR 3] [KODE] Header: tanpa eyebrow + label metric beda
- Prioritas: LOW
- Figma: eyebrow "EKSPLORASI KOTA HIJAU • PEMBARUAN FASILITAS TERKINI"; metric "STATUS PRIMA".
- Kode: `DaftarRuangPublikPage.jsx:342-349` (tanpa eyebrow); label `statusPrima` = "KONDISI BAIK" (365/371/377).
- Usulan: tambah eyebrow; "KONDISI BAIK" → "STATUS PRIMA".

### G1-18 [LAYAR 3] [CEK MANUAL] Panel header metric
- Prioritas: LOW. Struktur sudah sesuai; verifikasi warna/padding di browser.

### G1-19 [LAYAR 3] [DEVIASI DISENGAJA] Chip "Perlu Perhatian (4)"
- Prioritas: LOW. Kode `:487-497` render kategori dari API. Bila filter kondisi ditunda → catat deviasi.

### G1-20 [LAYAR 3] [CEK MANUAL] Kartu list: badge status kanan atas + label "Kategori:" + jam
- Prioritas: LOW. Kode `:569-607`. Verifikasi apakah perlu badge status kondisi & label "Kategori:".

### G1-21 [LAYAR 3] [DEVIASI DISENGAJA] Slider radius, multi-select fasilitas, paginasi
- Prioritas: LOW. Kode `:403-421, 624-706`. Tambahan di luar Figma.

### G1-22 [LAYAR 3] [CEK MANUAL] Opsi sort "Paling Relevan" vs "Jarak Terdekat"
- Prioritas: LOW. Kode `:26, 55`.

### G1-23 [LAYAR 3] [CEK MANUAL] Header peta: badge jumlah titik / pin
- Prioritas: LOW. Kode `:503-505`; periksa `PetaSebaranLokasi.jsx`.

## LAYAR 4 — Detail Ruang Publik

### G1-31 [LAYAR 4] ⏭️ (skip) [KODE] Fasilitas dirender list panel, bukan grid kartu
- Prioritas: HIGH
- Figma: grid kartu 3 kolom (ikon + judul + deskripsi + lokasi + "Rincian →").
- Kode: `DetailRuangPublikPage.jsx:560-624` (`facility-list-panel` + `facility-list-row`).
- Usulan: ubah ke grid kartu.

### G1-32 [LAYAR 4] [KODE] Tombol "Lapor" per baris tak ada di Figma
- Prioritas: LOW. Kode `:606-618`. Usulan: jadikan aksi di dalam modal rincian.

### G1-33 [LAYAR 4] [KODE] Badge "Parkir Gratis" hilang
- Prioritas: LOW. Kode `:552-557`. Usulan: tambah chip info parkir bila data ada.

### G1-34 [LAYAR 4] [KODE] Kartu gambar + "Karakteristik Ruang" tidak dirender
- Prioritas: LOW. Kode `:456-541`. Usulan: tambah di kolom kanan.

### G1-35 [LAYAR 4] [DEVIASI DISENGAJA] Filter status, section partisipasi, galeri foto
- Prioritas: LOW. Kode `:627-670, 672-772, 693-707`.

### G1-36 [LAYAR 4] [CEK MANUAL] Judul section tanpa "Terkini"
- Prioritas: LOW. Kode `:679`.

## LAYAR 5 — Detail Fasilitas

### G1-37 [LAYAR 5] ✅ [FITUR BELUM ADA] Halaman publik Detail Fasilitas belum ada
- Prioritas: HIGH
- Figma: halaman publik berdiri sendiri (breadcrumb, banner ruang publik induk, kartu kondisi terkini, foto, peta posisi, validasi warga, fasilitas lain).
- Kode: `DetailFasilitasRuangPublik.jsx:158-322` = halaman **admin**; sub-view publik hanya modal kecil `DetailRuangPublikPage.jsx:795-836`.
- Usulan: keputusan user — buat route publik baru `( /ruang-publik/:id/fasilitas/:fasilitasId )` atau catat sebagai backlog. **Jangan mengarang** tanpa keputusan.

## LAYAR 6 — Form Pelaporan

### G1-38 [LAYAR 6] [KODE] Eyebrow "PARTISIPASI WARGA" + badge "Proses < 1 menit" tak ada
- Prioritas: LOW. Kode `FormLaporPage.jsx:351`. Usulan: tambah eyebrow + badge.

### G1-39 [LAYAR 6] ✅ [KODE] Kartu "Lokasi Terpilih" tanpa pill "Tersinkron" + sub-kartu
- Prioritas: HIGH. Figma: pill "Tersinkron" + sub-kartu TAMAN KOTA & SPESIFIKASI FASILITAS. Kode `:374-393` (satu baris). Usulan: susun ulang.

### G1-40 [LAYAR 6] ✅ [KODE] Deskripsi tanpa counter & maxLength 200
- Prioritas: HIGH. Kode `:442-456`. Usulan: label "Deskripsi Singkat Kendala" + `maxLength=200` + counter.

### G1-41 [LAYAR 6] [KODE] Sidebar tanpa kartu "Area Pelaporan" & banner "#JagaTamanKita"
- Prioritas: LOW. Kode `:699-731`.

### G1-42 [LAYAR 6] [CEK MANUAL] Kontrol peta "Ubah Posisi Pin" vs teks geser pin
- Prioritas: LOW. Kode `:673-683`.

### G1-43 [LAYAR 6] [DEVIASI DISENGAJA] Kontrol identitas (anonim/nama)
- Prioritas: LOW. Kode `:458-487` (diwajibkan PRD FEAT-009, tak ada di Figma).

### G1-44 [LAYAR 6] [CEK MANUAL] Breadcrumb & pemisah
- Prioritas: LOW. Kode `:340-346`.

### G1-45 [LAYAR 6B] [CEK MANUAL] Kamera native browser
- Prioritas: LOW. Kode `:539-554`. Tidak ada tindakan wajib.

## LAYAR 7 — Detail Status Laporan

### G1-51 [LAYAR 7] ✅ [KODE] Stepper tanpa pill status per-tahap
- Prioritas: HIGH. Figma: pill SELESAI/BERJALAN/TAHAP AKHIR. Kode `DetailStatusLaporanPage.jsx:150-168`. Usulan: tambah pill status.

### G1-52 [LAYAR 7] ✅ [KODE] Stepper grid kartu, bukan timeline horizontal terhubung
- Prioritas: HIGH. Kode `:139-169`. Usulan: layout timeline node lingkaran + connector.

### G1-53 [LAYAR 7] [KODE] Pill "Diperbarui berkala..." tak ada
- Prioritas: LOW. Kode `:131-137`.

### G1-54 [LAYAR 7] ✅ [KODE] Kartu bukti foto kehilangan counter/caption/watermark/posisi
- Prioritas: HIGH. Kode `:221-235`. Usulan: tambah counter berkas + caption + badge "Asli" + baris posisi.

### G1-55 [LAYAR 7] [KODE] Breadcrumb menambah "#{id}"
- Prioritas: LOW. Kode `:98`.

### G1-56 [LAYAR 7] [KODE] Kotak wilayah abu, bukan krem aksen
- Prioritas: LOW. Kode `:121-125`.

### G1-57 [LAYAR 7] [CEK MANUAL] Baris "Identitas Pelapor" di luar Figma
- Prioritas: LOW. Kode `:210-213`.

### G1-58 [LAYAR 7] [KODE] Tombol fasilitas tanpa nama fasilitas
- Prioritas: LOW. Kode `:244`.

## LAYAR 8 — Laporan Saya

### G1-59 [LAYAR 8] [KODE] Pill "Keterbukaan Pelayanan Warga" tak ada
- Prioritas: LOW. Kode `RiwayatLaporanPage.jsx:60-66`.

### G1-60 [LAYAR 8] ✅ [KODE] Tombol "Lihat Riwayat" untuk status Selesai tak ada
- Prioritas: HIGH. Figma: kartu Selesai → "Lihat Riwayat" (ikon mata). Kode `:284-288` (semua "Lihat Status Laporan →"). Usulan: tombol kondisional.

### G1-61 [LAYAR 8] [DEVIASI DISENGAJA] Tab "Ditolak"
- Prioritas: LOW. Kode `:155-171`.

### G1-62 [LAYAR 8] [KODE] Ikon lokasi MapPin vs ikon tunas
- Prioritas: LOW. Kode `:258-260`.

### G1-63 [LAYAR 8] [CEK MANUAL] Model teks "PEMBARUAN TERAKHIR"
- Prioritas: LOW. Kode `:277-279`.

## LAYAR 9 — Login Pemerintah

### G1-64 [LAYAR 9] ✅ [KODE] Footer bantuan "Hubungi administrator sistem" tak ada
- Prioritas: HIGH. Kode `LoginPemerintahPage.jsx:59-78`. Usulan: tambah footer bantuan.

### G1-65 [LAYAR 9] [KODE] Sandi tanpa toggle mata
- Prioritas: LOW. `:67-73` + `Input.jsx:28-38`.

### G1-66 [LAYAR 9] [KODE] Email tanpa ikon gedung
- Prioritas: LOW. `:60-66`.

### G1-67 [LAYAR 9] [KODE] Label tombol "Masuk ke Dashboard Admin →" vs "Masuk ke Dashboard →"
- Prioritas: LOW. `:75`.

### G1-68 [LAYAR 9] [KODE] Subtitle menambah "DKI"
- Prioritas: LOW. `:50-51`.

## LAYAR 10 — Dashboard Pemerintah

### G1-70 [LAYAR 10] [DEVIASI DISENGAJA] Sidebar 6 item vs 4 item Figma
- Prioritas: LOW (perlu keputusan) — item "Laporan Ditandai" (Fase C) & "Kelola Admin" tambahan fungsional. Kode `AdminLayout.jsx:56-87`.

### G1-71 [LAYAR 10] ✅ [KODE] Label "DISTRIK TERPADU • WILAYAH DKI JAKARTA" ganda
- Prioritas: HIGH. Kode `DashboardPage.jsx:69` + `AdminLayout.jsx:151`. Usulan: hapus duplikat (Figma hanya di konten).

### G1-72 [LAYAR 10] ✅ [KODE] Tombol "Unduh Laporan (CSV)" tanpa handler
- Prioritas: HIGH. Kode `DashboardPage.jsx:81-83` — Button tanpa onClick. Usulan: tambah handler CSV atau tandai belum ada.

### G1-73 [LAYAR 10] [KODE] Timestamp "Pembaruan: Hari Ini, 10:45 WIB" statis
- Prioritas: LOW. Kode `:78-80`.

### G1-74 [LAYAR 10] [KODE] Label & badge card peta beda
- Prioritas: LOW. Kode `:166-171`.

### G1-75 [LAYAR 10] [KODE] Ringkasan kategori tanpa progress bar
- Prioritas: LOW. Kode `:186-209`.

### G1-76 [LAYAR 10] [FITUR BELUM ADA] Kotak "Prioritas penanganan utama"
- Prioritas: LOW. Kode `:180-212`.

### G1-77 [LAYAR 10] [KODE] Kolom tabel LAPORAN & gaya tombol AKSI beda
- Prioritas: LOW. Kode `:262-264`.

### G1-78 [LAYAR 10] [FITUR BELUM ADA] Footer tabel & paginasi
- Prioritas: LOW. Kode `:235-297`.

### G1-79 [LAYAR 10] [KODE] Warna ikon kategori seragam
- Prioritas: LOW. Kode `:188-207`.

## LAYAR 11 — Daftar Laporan

### G1-80 [LAYAR 11] [KODE] Eyebrow "Update Realtime" sebagai teks polos, bukan pil
- Prioritas: LOW. Kode `AntrianModerasiPage.jsx:74-75`.

### G1-81 [LAYAR 11] [KODE] Struktur sel tabel berbeda
- Prioritas: LOW. Kode `:168-173`.

### G1-82 [LAYAR 11] [KODE] Aksi tak punya varian "Riwayat"/"Alasan"
- Prioritas: LOW. Kode `:180-186`.

### G1-83 [LAYAR 11] [FITUR BELUM ADA] Footer tabel & paginasi
- Prioritas: LOW. Kode `:139-206`.

## LAYAR 12 — Detail Laporan

### G1-84 [LAYAR 12] ✅ [KODE] Stepper ikon + garis penghubung tidak ada
- Prioritas: HIGH. Kode `DetailModerasiPage.jsx:247-265`. Usulan: komponen stepper node + connector.

### G1-85 [LAYAR 12] [KODE] Badge "Kategori Kelistrikan" vs jenisMasalah mentah
- Prioritas: LOW. Kode `:276-278`.

### G1-86 [LAYAR 12] [KODE] Kotak info detail beda (titik presisi, pelapor, status distrik)
- Prioritas: LOW. Kode `:288-315`.

### G1-87 [LAYAR 12] ✅ [KODE] Panel aksi: dropdown + kartu opsi aktif tidak ada
- Prioritas: HIGH. Kode `:392-429`. Usulan: restrukturisasi panel (dropdown verifikasi + kartu opsi aktif).

### G1-88 [LAYAR 12] [FITUR BELUM ADA] Kartu "Ringkasan Pemeliharaan Fasilitas Ini"
- Prioritas: LOW. Kode `:436+`.

### G1-89 [LAYAR 12] [KODE] Judul & gaya timeline beda
- Prioritas: LOW. Kode `:436-437`.

### G1-90 [LAYAR 12] [KODE] Badge "Masuk: <tanggal>" vs teks kecil
- Prioritas: LOW. Kode `:225, 232-236`.

### G1-91 [LAYAR 12] [KODE] "Buka Peta" pakai query nama, bukan koordinat
- Prioritas: LOW. Kode `:346-355`. Usulan: pakai `lokasiPilihan` lat/lng.

## LAYAR 13 — Tentang

### G1-92 [LAYAR 13] [KODE] Spasi off-token (20px, 52px, 13px 26px, 13.5px, 15.5px, 10px)
- Prioritas: LOW. Kode `TentangPage.jsx:180, 187, 193-196, 319, 345, 312`. Usulan: ganti ke token `--space-*` + font 13/14/16.

### G1-95 [LAYAR 13] [CEK MANUAL] Nilai "-" pada statistik gagal muat
- Prioritas: LOW. Kode `:138-150, 161`. Verifikasi runtime tidak mengganggu layout.

---

## Catatan umum
- Nomor G1-24..G1-30, G1-46..G1-50, G1-69, G1-93, G1-94 tidak dipakai (disengaja sebagai gap antar-batch).
- Bagian ini **belum mengubah satu baris kode pun**. Menunggu user memilih nomor yang diperbaiki.
