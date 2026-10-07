# Task Guide Frontend

Dokumen ini mencatat status implementasi frontend dan pekerjaan yang masih perlu diselesaikan.

Status:

- ✅ Selesai
- ⚠️ Sebagian selesai atau perlu verifikasi
- ❌ Belum dikerjakan

## A0. Setup dan Fondasi Frontend Publik

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-01 | ✅ | Inisialisasi React dan struktur folder | Struktur komponen, halaman, service, hook, dan utilitas tersedia. |
| FE-02 | ✅ | Routing React Router | Route publik, warga, dan admin tersedia. |
| FE-03 | ✅ | Styling dasar dan design system | Token desain serta komponen button, card, dan badge tersedia. |
| FE-04 | ❌ | Setup HTTP client Axios dengan interceptor | Aplikasi masih menggunakan wrapper `fetch` di `apps/web/src/config/api.js`. |
| FE-05 | ⚠️ | Setup environment variable | `VITE_API_BASE_URL` tersedia. Konfigurasi routing/peta perlu dilengkapi bila dibutuhkan. |

## A1. Peta dan Direktori Ruang Publik

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-06 | ✅ | Leaflet dan OpenStreetMap | Sudah dipakai pada peta sebaran, detail ruang publik, dan form laporan. |
| FE-07 | ⚠️ | Geolocation pengguna dengan fallback manual | Hook geolocation tersedia. Fallback input lokasi manual belum eksplisit. |
| FE-08 | ⚠️ | Marker ruang publik dengan clustering | Marker sudah tampil, clustering untuk data padat belum ada. |
| FE-09 | ✅ | Kontrol radius pencarian | Radius pencarian sudah tersedia di halaman daftar ruang publik. |
| FE-10 | ✅ | List view sinkron dengan peta dan urutan jarak | Daftar dan sorting jarak sudah tersedia. |
| FE-11 | ✅ | Filter kategori | Filter kategori ruang publik tersedia. |
| FE-12 | ❌ | Filter fasilitas multi-select | Belum ada filter fasilitas dari API pada halaman daftar. |
| FE-13 | ✅ | Detail ruang publik | Menampilkan nama, kategori, alamat, jam, deskripsi, dan fasilitas. |
| FE-14 | ⚠️ | Galeri foto detail | Foto resmi ada, foto laporan terverifikasi belum digabungkan. |
| FE-15 | ❌ | Routing OSRM | Tombol Google Maps tersedia, rute OSRM pada peta belum diimplementasikan. |

## A2. Lapor Fasilitas

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-16 | ✅ | Form laporan, kategori masalah, deskripsi, dan unggah foto | Validasi tipe serta ukuran gambar tersedia. |
| FE-17 | ✅ | Ambil lokasi HP saat submit | Browser Geolocation API mengirim `lat_user` dan `long_user`. |
| FE-18 | ✅ | Pilihan identitas anonim atau tampilkan nama | Pilihan tersedia dengan default anonim. |
| FE-19 | ❌ | Status hasil submit | Masih memakai alert umum, belum membedakan laporan tayang dan menunggu tinjauan. |
| FE-20 | ⚠️ | Riwayat laporan per ruang publik | Riwayat warga tersedia, filter atau section per ruang publik belum lengkap. |
| FE-21 | ❌ | Flag laporan tayang | Belum ada mekanisme laporan tidak pantas oleh pengguna. |

### Titik Presisi Fasilitas

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-16A | ✅ | Peta titik presisi fasilitas | Form laporan memakai Leaflet dan tile OpenStreetMap. |
| FE-16B | ✅ | Pin lokasi fasilitas | Pin dapat digeser atau dipindahkan dengan klik peta. |
| FE-16C | ✅ | Kirim koordinat lokasi fasilitas | Mengirim `lat_lokasi_pilihan` dan `long_lokasi_pilihan`, terpisah dari GPS HP pengguna. |
| FE-16D | ⚠️ | Koordinat individual fasilitas | Master fasilitas belum memiliki koordinat individual, sehingga posisi awal menggunakan koordinat ruang publik. |

## A3. Panel Admin

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-22 | ✅ | Struktur panel admin dan routing | Admin layout serta route dashboard tersedia dalam aplikasi saat ini. |
| FE-23 | ⚠️ | Login admin | Halaman login dan guard tersedia, alur redirect perlu diuji. |
| FE-24 | ✅ | Dashboard moderasi laporan | Daftar laporan menunggu verifikasi tersedia. |
| FE-25 | ⚠️ | Detail laporan moderasi | Foto, deskripsi, dan aksi status tersedia. Titik presisi masih perlu memakai data laporan, bukan teks hardcode. |
| FE-26 | ❌ | Daftar laporan yang di-flag | Belum tersedia. |
| FE-27 | ⚠️ | Manajemen data master ruang publik | Halaman tersedia, indikator edit manual perlu diverifikasi/dilengkapi. |
| FE-28 | ❌ | Trigger sinkronisasi ETL dari admin | Endpoint backend tersedia, kontrol UI belum tersedia. |

## A4. Testing Frontend

| ID | Status | Task |
| --- | --- | --- |
| FE-29 | ❌ | Unit test komponen kritikal memakai React Testing Library. |
| FE-30 | ⚠️ | Uji manual browser desktop dan mobile untuk halaman publik serta admin. |
| FE-31 | ⚠️ | Uji alur end-to-end: cari ruang publik, lihat detail, kirim laporan, cek status, dan moderasi admin. |

## A5. Build dan Deploy

| ID | Status | Task |
| --- | --- | --- |
| FE-32 | ⚠️ | Build production frontend publik dan admin, serta konfigurasi environment production. |
| FE-33 | ❌ | Deploy frontend publik dan admin ke domain atau subdomain terpisah. |

## A6. Tambahan Task Baru

### FE-34. Tambah kolom alamat pada halaman Kelola Fasilitas

**Status:** ❌

**File utama:** `apps/web/src/features/data-master/pages/KelolaFasilitasPage.jsx`

**Pekerjaan:**

1. Tambahkan header tabel `ALAMAT`.
2. Tambahkan sel alamat khusus menggunakan `ruang.alamat`.
3. Pindahkan alamat yang saat ini berada di bawah nama ruang publik ke kolom baru tersebut.
4. Tampilkan `Alamat belum tersedia` jika data alamat kosong.
5. Pertahankan kolom nama ruang publik hanya untuk nama.

**Acceptance criteria:**

- Tabel memiliki kolom Ruang Publik, Alamat, Wilayah, Fasilitas Standar, dan Aksi.
- Alamat tidak lagi tampil di bawah nama ruang publik.
- Layout tabel tidak overflow pada layar kecil.

### FE-35. Ubah marker peta sebaran menjadi kotak

**Status:** ❌

**File utama:** `apps/web/src/features/ruang-publik/components/PetaSebaranLokasi.jsx`

**File terkait:** `apps/web/src/features/moderasi/components/PetaDashboardAdmin.jsx`

**Pekerjaan:**

1. Identifikasi peta dashboard yang dimaksud dan samakan bentuk marker bila diperlukan.
2. Ubah marker custom berbentuk pin/tetesan menjadi kotak.
3. Gunakan ukuran, warna status, border, dan anchor yang tetap jelas pada zoom rendah maupun tinggi.
4. Pastikan marker tetap dapat dipilih dengan mouse, keyboard, dan perangkat sentuh.

**Acceptance criteria:**

- Marker berbentuk kotak, bukan pin tetesan atau persegi panjang.
- Marker tetap berada tepat di titik koordinatnya.
- Popup dan navigasi ke detail tetap bekerja.

### FE-36. Detail ruang publik wajib login

**Status:** ❌

**File utama:** `apps/web/src/App.jsx`

**File terkait:** `apps/web/src/routes/RequireAuth.jsx`

**Pekerjaan:**

1. Bungkus route `/ruang-publik/:id` dengan `RequireAuth`.
2. Pastikan pengguna belum login diarahkan ke `/login`.
3. Simpan halaman asal di `state.from` agar pengguna kembali ke detail yang dituju setelah login.
4. Pastikan route admin tetap memakai `RequireAdmin` setelah autentikasi.

**Acceptance criteria:**

- Guest tidak dapat melihat halaman detail ruang publik.
- Setelah login, pengguna kembali ke detail ruang publik yang sebelumnya dibuka.
- Pengguna terautentikasi dapat mengakses detail tanpa redirect berulang.

### FE-37. Simpan ruang hanya untuk pengguna yang login

**Status:** ❌

**File utama:** `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`

**File terkait:** `apps/web/src/context/ProfilContext.jsx`, `apps/web/src/context/AuthContext.jsx`

**Pekerjaan:**

1. Ganti tombol simpan yang saat ini hanya menampilkan alert dengan aksi simpan nyata.
2. Gunakan `useAuth` untuk memastikan user dan token tersedia sebelum penyimpanan dijalankan.
3. Gunakan `toggleSaveSpace` dan `isSpaceSaved` dari `ProfilContext`.
4. Jika belum login, arahkan pengguna ke login dengan `state.from` menuju halaman detail saat ini.
5. Ubah label tombol mengikuti state, misalnya `Simpan Ruang` dan `Tersimpan`.
6. Tambahkan defense-in-depth pada context agar penyimpanan tidak dapat dipanggil saat tidak ada autentikasi.
7. Pisahkan data ruang tersimpan per pengguna, jangan gunakan satu key localStorage global untuk seluruh akun.

**Acceptance criteria:**

- Guest tidak dapat menyimpan ruang publik.
- Setelah login, user dapat menyimpan dan membatalkan simpan ruang.
- State tombol berubah sesuai status penyimpanan.
- Ruang tersimpan akun A tidak tampil pada akun B di browser yang sama.

## Prioritas Rekomendasi

### Prioritas tinggi

1. FE-36: Proteksi login pada detail ruang publik.
2. FE-37: Perbaiki simpan ruang agar hanya tersedia bagi pengguna login.
3. FE-19: Tampilkan hasil submit laporan berdasarkan respons backend.
4. FE-25: Ganti titik presisi hardcode pada detail moderasi dengan data laporan.

### Prioritas menengah

1. FE-34: Pisahkan kolom alamat pada kelola fasilitas.
2. FE-28: Tambahkan trigger sinkronisasi ETL di panel admin.
3. FE-12: Filter fasilitas multi-select.
4. FE-14: Gabungkan galeri foto resmi dengan foto laporan tayang.

### Prioritas rendah

1. FE-35: Ubah bentuk marker peta menjadi kotak.
2. FE-08: Tambahkan clustering marker.
3. FE-15: Tambahkan routing OSRM.
4. FE-21 dan FE-26: Fitur flag laporan dan moderasi flag.

## Verifikasi Setiap Implementasi

1. Jalankan build frontend dengan `npm run build` dari `apps/web`.
2. Uji loading, empty state, error state, dan success state pada fitur yang diubah.
3. Uji desktop dan layar mobile tanpa overflow horizontal.
4. Uji navigasi keyboard dan fokus tombol/link.
5. Uji akses guest serta user login untuk perubahan yang berhubungan dengan autentikasi.
6. Periksa Network browser untuk memastikan payload dan respons API sesuai kontrak backend.
