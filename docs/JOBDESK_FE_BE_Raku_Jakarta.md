# Jobdesk Frontend & Backend — Raku Jakarta
### Turunan dari PRD Raku Jakarta (final) — disusun berurutan dari awal proyek sampai siap rilis

---

## Cara Baca Dokumen Ini

- Setiap task diberi kode **[FE-xx]** atau **[BE-xx]** dan ditandai dengan FEAT/NFR terkait dari PRD supaya bisa ditelusuri balik.
- Urutan tahap **disusun berdasarkan dependency**, bukan asal-asalan — misal Backend endpoint ruang publik harus jalan dulu sebelum Frontend bisa integrasi peta.
- Panel Admin dikerjakan sebagai **aplikasi terpisah** dari website publik (sesuai keputusan final: beda URL/domain), jadi ada dua build Frontend: **FE Publik** dan **FE Admin**.
- Checklist `[ ]` bisa langsung dipakai buat tracking progress kamu.

---

## A. FRONTEND

### A0. Setup & Fondasi (FE Publik)
- [ ] **[FE-01]** Inisialisasi project React (Vite/CRA), setup struktur folder (components, pages, services/api, hooks, utils).
- [ ] **[FE-02]** Setup routing dengan React Router (halaman: Beranda/Peta, Detail Ruang Publik, Form Lapor, Riwayat Status Laporan Saya).
- [ ] **[FE-03]** Setup styling base (Tailwind CSS) + desain sistem sederhana (warna, tipografi, komponen button/card/badge reusable).
- [ ] **[FE-04]** Setup HTTP client (Axios instance) dengan base URL ke Backend API, interceptor untuk error handling umum.
- [ ] **[FE-05]** Setup environment variable (`.env`) untuk base URL API, key layanan peta/routing (jika perlu).

### A1. Modul Publik — Peta & Direktori Ruang Publik (FEAT-001 s/d FEAT-006)
> **Dependency:** butuh endpoint Backend `GET /public-spaces` (lihat B1) sudah tersedia (boleh pakai data dummy/mock dulu sebelum BE siap).

- [ ] **[FE-06]** Integrasi Leaflet + tile OpenStreetMap, render peta dasar. *(FEAT-001)*
- [ ] **[FE-07]** Ambil lokasi pengguna (browser Geolocation API) dengan fallback input lokasi manual jika ditolak/gagal. *(FEAT-001)*
- [ ] **[FE-08]** Render marker ruang publik di peta dari hasil API, dengan clustering untuk kepadatan tinggi (mis. `react-leaflet-cluster`). *(FEAT-001)*
- [ ] **[FE-09]** Komponen kontrol radius pencarian (slider/dropdown, default ±10 km). *(FEAT-001)*
- [ ] **[FE-10]** Komponen List View ruang publik, sinkron dengan hasil di peta, urut berdasarkan jarak. *(FEAT-002)*
- [ ] **[FE-11]** Komponen filter kategori: **Taman Kota, Taman Interaktif, Taman Lingkungan, RPTRA**. *(FEAT-004)*
- [ ] **[FE-12]** Komponen filter fasilitas (multi-select: area bermain anak, toilet umum, jalur lari, area parkir, dll — daftar dari API). *(FEAT-005)*
- [ ] **[FE-13]** Halaman Detail Ruang Publik: nama, kategori, alamat/kelurahan, jam operasional, deskripsi, daftar fasilitas. Tampilkan eksplisit "data tidak tersedia" untuk field kosong. *(FEAT-006)*
- [ ] **[FE-14]** Galeri foto di halaman detail (gabungan foto resmi + foto dari laporan yang sudah tayang). *(FEAT-007)*
- [ ] **[FE-15]** Integrasi routing OSRM (instance publik): tombol "Minta Arah", gambar rute di atas peta, tampilkan estimasi jarak/waktu tempuh. *(FEAT-003)*

### A2. Modul Publik — Lapor Fasilitas (FEAT-008, 009, 010, sisi klien FEAT-013)
> **Dependency:** butuh endpoint Backend `POST /reports` (lihat B3) sudah tersedia.

- [x] **[FE-16]** Form Lapor Fasilitas: input kategori masalah (dropdown), deskripsi (textarea), upload foto (**wajib**, validasi tipe file gambar & ukuran maksimum di sisi klien sebelum submit). *(FEAT-008)*
  - Mengganti simulasi kamera modal di `FormLaporPage.jsx` dengan input file native, validasi klien JPEG/PNG/WebP <= 5MB, preview gambar & tombol hapus, sequential upload ke `POST /uploads` sebelum submit laporan.
- [x] **[FE-17]** Ambil koordinat lokasi pengguna saat submit (browser Geolocation API) untuk dikirim bersama laporan, dipakai Backend untuk validasi lokasi. *(FEAT-013)*
  - Mengambil geolokasi via `navigator.geolocation.getCurrentPosition` (timeout 5s) saat submit, dikirim sebagai `lat_user` & `long_user` tanpa membocorkan angka presisi di UI publik. Sifat koordinat opsional (gagal/ditolak browser tetap lanjut submit).
- [ ] **[FE-18]** Komponen pilihan mode identitas: **Anonim** atau **Tampilkan Nama** (wajib dipilih, default Anonim). *(FEAT-009)*
- [ ] **[FE-19]** Tampilkan status hasil submit ke pengguna: "Laporan tayang" (jika langsung lolos validasi lokasi) atau "Menunggu tinjauan admin" (jika tertandai) — sesuai respons Backend. *(FEAT-010, FEAT-013)*
- [ ] **[FE-20]** Halaman/section riwayat laporan yang terikat ke tiap ruang publik, ditampilkan di halaman detail (FEAT-13). Tampilkan badge status per laporan (Tayang / Menunggu Tinjauan / Ditolak).
- [ ] **[FE-21]** Fitur flag/lapor laporan tayang yang dianggap tidak pantas oleh pengguna lain (lapisan tambahan moderasi). *(FEAT-011)*

### A3. FE Admin — Panel Admin Terpisah (aplikasi/URL berbeda)
> **Dependency:** butuh endpoint Backend khusus admin (auth admin, moderasi, data master — lihat B4, B5, B6). Ini project React **terpisah** dari FE Publik (boleh reuse komponen lewat shared package kalau mau, tapi build & deploy-nya beda).

- [ ] **[FE-22]** Inisialisasi project React terpisah untuk Panel Admin, routing & struktur folder sendiri. *(FEAT-014)*
- [ ] **[FE-23]** Halaman Login Admin (form email/password → JWT), simpan token, redirect kalau belum login. *(FEAT-014)*
- [ ] **[FE-24]** Dashboard daftar laporan yang **tertandai** ("perlu verifikasi lokasi") — menunggu tinjauan. *(FEAT-011)*
- [ ] **[FE-25]** Halaman detail laporan tertandai: tampilkan foto, deskripsi, koordinat pengguna vs koordinat ruang publik (idealnya divisualisasikan di mini-map), tombol Setujui/Tolak + alasan. *(FEAT-011)*
- [ ] **[FE-26]** Halaman daftar laporan yang di-flag pengguna lain (dari FE-21), untuk ditinjau ulang admin. *(FEAT-011)*
- [ ] **[FE-27]** Halaman Manajemen Data Master Ruang Publik: tabel data ruang publik, form edit manual per field, indikator field yang "pernah diedit manual" (beda visual dari field hasil ETL). *(FEAT-012)*
- [x] **[FE-28]** Tombol trigger manual sinkronisasi ETL (opsional) dari panel admin, dengan status/log hasil sinkronisasi terakhir. *(FEAT-012)*
  - Sudah tersambung ke `POST /admin/sync-data` (BE-18) lewat `services/syncService.js`; panel status menampilkan hasil run yang baru dijalankan (per tahap + log). Hasil lintas sesi lewat `GET /admin/sync-data` (BE-19): `riwayatSync()` memuat 10 run terakhir di `DataMasterPage` (status, waktu, durasi, hitung insert/update/skip, log per tahap).

### A4. Testing Frontend
- [ ] **[FE-29]** Unit test komponen kritikal (form validasi, filter, komponen status laporan) — React Testing Library.
- [ ] **[FE-30]** Uji manual cross-browser & responsif (desktop/mobile) untuk seluruh halaman publik dan admin. *(NFR-003)*
- [ ] **[FE-31]** Uji alur end-to-end manual: cari ruang publik → detail → lapor → cek status; serta login admin → tinjau laporan → setujui/tolak.

### A5. Build & Deploy Frontend
- [ ] **[FE-32]** Build production FE Publik & FE Admin (dua build terpisah), konfigurasi environment production (base URL API production).
- [ ] **[FE-33]** Deploy FE Publik ke domain utama, FE Admin ke subdomain/domain terpisah (mis. `admin.rakujakarta.id`). *(FEAT-014)*

---

## B. BACKEND

### B0. Setup & Fondasi
- [ ] **[BE-01]** Inisialisasi project FastAPI, struktur folder (routers, models, schemas, services, core/config, db).
- [ ] **[BE-02]** Setup koneksi MySQL via SQLAlchemy/SQLModel + PyMySQL, konfigurasi `.env` (DB credential, secret key JWT).
- [ ] **[BE-03]** Setup Alembic untuk database migration.
- [ ] **[BE-04]** Rancang & buat skema tabel awal: `ruang_publik`, `kategori`, `fasilitas`, `ruang_publik_fasilitas` (relasi many-to-many), `laporan_fasilitas`, `pengguna` (dengan kolom `role`: publik/admin), termasuk kolom `lat`, `long` bertipe yang mendukung query jarak.
- [ ] **[BE-05]** Tambah kolom penanda field-level merge di `ruang_publik` (mis. `field_source` JSON atau tabel terpisah `ruang_publik_edit_log` yang mencatat kolom mana yang pernah diedit manual admin). *(FEAT-012)*
- [ ] **[BE-06]** Setup JWT auth dasar (login, generate token, dependency untuk proteksi endpoint) + hashing password dengan bcrypt.
- [ ] **[BE-07]** Setup CORS middleware, whitelist origin FE Publik dan FE Admin secara eksplisit. *(NFR-002)*
- [x] **[BE-08]** Setup local storage untuk foto: folder `/uploads`, konfigurasi `StaticFiles` FastAPI untuk serve file, validasi tipe & ukuran file saat upload. *(NFR-002)*
  - Terintegrasi dengan endpoint `POST /api/v1/uploads` (BE-49), mount `/uploads`, verifikasi MIME, magic bytes, dan batasan 5MB.
 
### B1. Public Space Service — API Ruang Publik (FEAT-001 s/d FEAT-006)
- [ ] **[BE-09]** Endpoint `GET /public-spaces?lat=&long=&radius=&category=&facilities=` — query berbasis jarak (radius search, mis. pakai rumus Haversine di query SQL) + filter kategori & fasilitas. *(FEAT-001, 004, 005)*
- [ ] **[BE-10]** Endpoint `GET /public-spaces/{id}` — detail satu ruang publik lengkap dengan fasilitas & foto resmi. *(FEAT-006)*
- [ ] **[BE-11]** Endpoint `GET /categories` dan `GET /facilities` — daftar kategori (Taman Kota, Taman Interaktif, Taman Lingkungan, RPTRA) dan daftar fasilitas untuk populate filter FE. *(FEAT-004, 005)*
- [ ] **[BE-12]** Endpoint `GET /public-spaces/{id}/reports` — daftar laporan yang **sudah tayang** (status disetujui/tayang otomatis) untuk satu ruang publik, dipakai galeri + riwayat laporan. *(FEAT-007, 010)*
- [ ] **[BE-13]** Unit test (pytest) untuk logika radius search & kombinasi filter.

### B2. ETL Worker — Sinkronisasi Satu Data Jakarta
- [ ] **[BE-14]** Script Extract: download dataset RTH & RPTRA dari Satu Data Jakarta (format CSV/Excel), simpan sementara.
- [ ] **[BE-15]** Script Transform: normalisasi nama kategori (mapping ke 4 kategori final: Taman Kota, Taman Interaktif, Taman Lingkungan, RPTRA — buang kategori lain seperti jalur hijau jalan, tepian air, taman pemakaman), normalisasi format koordinat, deteksi baris duplikat/tidak valid.
- [ ] **[BE-16]** Script Load: cek per baris apakah ruang publik sudah ada (mis. berdasarkan ID resmi dari dataset atau kombinasi nama+koordinat) → Update kolom yang **belum pernah diedit manual** saja, atau Insert kalau data baru. *(FEAT-012, field-level merge)*
- [ ] **[BE-17]** Setup APScheduler untuk menjalankan Extract → Transform → Load secara berkala (jadwal ditentukan, mis. tiap malam), berjalan sebagai proses terpisah dari server API utama.
- [x] **[BE-18]** Endpoint `POST /admin/sync-data` (khusus admin) untuk trigger manual ETL dari Panel Admin, kembalikan status/log hasil. *(FEAT-012, FE-28)*
- [x] **[BE-19]** Logging hasil tiap run ETL (jumlah insert/update/skip, error jika ada) untuk ditampilkan di Panel Admin.

### B3. Report Service + Validasi Lokasi Anti Fake-GPS (FEAT-008, 009, 010, 013)
- [x] **[BE-20]** Endpoint `POST /reports`: terima kategori masalah, deskripsi, foto (upload wajib), mode identitas, koordinat lokasi pengguna dari klien, `public_space_id`.
  - Menerapkan validasi foto wajib dan keberadaannya di disk, penyimpanan koordinat `lat_user` & `long_user` (BE-46), `oauth2_scheme_optional` untuk submission anonim tanpa token, serta proteksi anti-spoofing nama pelapor. Selesai diverifikasi 2026-10-05.
- [ ] **[BE-21]** Simpan foto ke local storage, ekstrak metadata EXIF GPS dari file foto (kalau ada) menggunakan library seperti `Pillow`/`exifread`.
- [ ] **[BE-22]** Logika validasi lokasi: hitung jarak (Haversine) antara (a) koordinat browser saat submit dan (b) koordinat EXIF foto (jika tersedia), masing-masing dibandingkan ke koordinat ruang publik tujuan. *(FEAT-013)*
- [ ] **[BE-23]** Terapkan aturan **ambang batas 100 meter**: jika salah satu/kedua jarak > 100 m, atau EXIF lokasi tidak tersedia → set status laporan `menunggu_tinjauan`; jika dalam ambang batas → set status `tayang`. *(FEAT-013, FEAT-010)*
- [ ] **[BE-24]** Endpoint `GET /reports/{id}/status` (atau sertakan langsung di response submit) — supaya FE bisa tampilkan status ke pelapor. *(FEAT-010)*
- [ ] **[BE-25]** Endpoint `POST /reports/{id}/flag` — pengguna lain menandai laporan tayang yang dianggap tidak pantas (masuk antrian tinjau ulang admin). *(FEAT-011, FE-21)*
- [ ] **[BE-26]** Rate-limiting endpoint `POST /reports` per user/IP untuk mencegah spam. *(NFR-002)*
- [ ] **[BE-27]** Unit test: skenario lokasi valid, lokasi jauh, foto tanpa EXIF, EXIF vs browser bertentangan (lihat kasus uji di PRD bagian 8).

### B4. Moderation Service — Khusus Admin (FEAT-011)
- [ ] **[BE-28]** Endpoint `GET /admin/reports?status=menunggu_tinjauan` — daftar laporan yang perlu ditinjau admin (hasil dari FEAT-013 dan/atau hasil flag FEAT-011). Proteksi: hanya role `admin`.
- [ ] **[BE-29]** Endpoint `POST /admin/reports/{id}/approve` — ubah status jadi `tayang`.
- [ ] **[BE-30]** Endpoint `POST /admin/reports/{id}/reject` — ubah status jadi `ditolak`, wajib sertakan alasan.
- [ ] **[BE-31]** Endpoint `GET /admin/reports/flagged` — daftar laporan yang di-flag pengguna lain, terpisah dari antrian FEAT-013.

### B5. Data Master Service — Khusus Admin (FEAT-012)
- [ ] **[BE-32]** Endpoint `GET /admin/public-spaces` — list lengkap data master untuk ditampilkan & diedit di Panel Admin.
- [ ] **[BE-33]** Endpoint `PATCH /admin/public-spaces/{id}` — edit manual field tertentu; setiap field yang diubah otomatis ditandai "diedit manual" (dipakai logika merge ETL di BE-16).

### B6. Admin Auth & Pemisahan Akses (FEAT-014)
- [ ] **[BE-34]** Endpoint `POST /admin/login` — terpisah secara alur dari login pengguna publik (kalau ada), validasi role `admin` sebelum issue token.
- [ ] **[BE-35]** Middleware/dependency proteksi khusus role `admin` di seluruh endpoint `/admin/*`, pastikan endpoint publik tidak bisa diakses pakai token admin secara ambigu (role check eksplisit).
- [ ] **[BE-36]** Pastikan konfigurasi CORS (BE-07) mengizinkan domain FE Admin secara spesifik, terpisah dari domain FE Publik.

### B7. Testing Backend
- [ ] **[BE-37]** Unit test (pytest) menyeluruh untuk seluruh service: Public Space, Report, Moderation, Data Master, Auth.
- [ ] **[BE-38]** **Black-box testing**: uji tiap endpoint berdasarkan input-output yang diharapkan tanpa melihat isi kode, mencakup skenario normal dan edge case (input kosong, koordinat tidak valid, file bukan gambar, dll).
- [ ] **[BE-39]** **Testing API dengan Postman**: buat Postman Collection untuk seluruh endpoint (publik & admin), termasuk test script otomatis (assertion status code, struktur response) — dipakai juga untuk regression testing tiap ada perubahan endpoint.
- [ ] **[BE-40]** **User concurrent testing**: simulasikan banyak pengguna mengakses endpoint pencarian ruang publik & submit laporan secara bersamaan (mis. pakai Locust atau JMeter) untuk memastikan API tetap responsif dan tidak terjadi race condition (khususnya di logika status laporan & merge data master).
- [ ] **[BE-41]** Uji performa query radius search dengan volume data ruang publik skala penuh (ribuan titik) untuk memastikan waktu respons masih wajar. *(NFR-001)*

### B8. Deployment Backend
- [ ] **[BE-42]** Setup server (VPS/cloud), install dependency Python, konfigurasi Uvicorn + reverse proxy (mis. Nginx).
- [ ] **[BE-43]** Setup MySQL production, jalankan migration Alembic.
- [ ] **[BE-44]** Deploy ETL Worker sebagai proses terpisah (systemd service / cron / scheduler terpisah dari proses API utama) — sesuai keputusan arsitektur ETL Worker tidak menyatu dengan alur request API. *(lihat bagian 5 PRD)*
- [ ] **[BE-45]** Setup folder local storage foto di server production dengan permission yang sesuai, pastikan ter-backup berkala.

---

## C. Urutan Integrasi FE ↔ BE (Ringkas)

Supaya gak saling nunggu tanpa arah, ini urutan yang disarankan biar FE & BE bisa jalan paralel dengan titik temu yang jelas:

1. **BE-01 s/d BE-08** (fondasi BE) berjalan bareng **FE-01 s/d FE-05** (fondasi FE) — gak saling bergantung.
2. **BE-09 s/d BE-13** (API ruang publik) selesai duluan → baru **FE-06 s/d FE-15** (peta & direktori) bisa integrasi ke data asli (sebelumnya boleh pakai data dummy).
3. **BE-14 s/d BE-19** (ETL Worker) bisa dikerjakan paralel, gak menghalangi kerjaan FE manapun — cuma prasyarat supaya data ruang publik di database terisi data asli, bukan dummy.
4. **BE-20 s/d BE-27** (Report Service) selesai duluan → baru **FE-16 s/d FE-21** (form lapor) bisa integrasi penuh.
5. **BE-28 s/d BE-36** (Moderation, Data Master, Admin Auth) selesai duluan → baru **FE-22 s/d FE-28** (Panel Admin) bisa integrasi penuh.
6. Testing (**FE-29 s/d FE-31** dan **BE-37 s/d BE-41**) dilakukan setelah masing-masing modul terkait selesai terintegrasi — jangan ditunda sampai akhir semua.
7. Deploy Backend (**BE-42 s/d BE-45**) lebih dulu siap sebelum Deploy Frontend (**FE-32, FE-33**), karena FE production build butuh base URL API production yang sudah live.

---

## D. Checklist Akhir Sebelum Dianggap Selesai (Definition of Done)

- [ ] Semua FEAT-001 s/d FEAT-014 di PRD punya task FE dan/atau BE yang tercentang selesai.
- [ ] Semua NFR-001 s/d NFR-004 sudah diuji dan terpenuhi.
- [ ] Black-box testing, Postman collection, dan user concurrent testing (bagian B7) sudah dijalankan minimal sekali dengan hasil terdokumentasi.
- [ ] UAT (User Acceptance Testing, sesuai PRD bagian 8) sudah dilakukan bersama pembimbing/calon pengguna.
- [ ] Kuesioner TAM sudah disebar, data sudah dianalisis (regresi linear berganda, sesuai PRD bagian 8), hasil siap dimasukkan ke laporan akhir.
- [ ] FE Publik dan FE Admin sudah live di domain masing-masing, saling terhubung ke Backend production yang sama.
- [ ] ETL Worker sudah terjadwal jalan otomatis di server production, minimal satu kali sinkronisasi berhasil tercatat.
