# Changelog Backend

Riwayat pengerjaan task backend. Entri terbaru di atas.
Tanggal memakai format `YYYY-MM-DD`.

Changelog ini ditulis **bersamaan** dengan saat task dicentang di
[TASK_GUIDE_BACKEND.md](TASK_GUIDE_BACKEND.md) - jangan ditunda ke sesi lain.

---

## Aturan Entri

- Satu blok per tanggal: `## YYYY-MM-DD`, urut terbaru di atas.
- Task yang berubah jadi `[x]` wajib punya entri, format:

  ```
  - **[BE-xx]** judul singkat - apa yang berubah (1 baris); verifikasi: hasil singkat
  ```

- Task **Parsial** atau **belum** tidak masuk changelog (statusnya sudah terlihat di task guide).
- Pekerjaan yang bukan task kode (dokumen, konfigurasi) memakai label **Dokumen** / **Chore**.
- Isi ringkas: satu baris per task. Detail teknis cukup di task guide dan commit message.

---

## 2026-10-08

- **[BE-28]** Antrian tinjauan admin - `GET /api/v1/admin/reports` (`read_admin_reports` di `admin_router`, `app/api/v1/laporan.py`, terdaftar `api.py` prefix `/admin`, wajib `get_current_admin`): filter `status` divalidasi ke `STATUS_KANONIK`/`semua` (asing -> 422), `wilayah`/`q`/pagination sama dengan `GET /reports`, response `LaporanResponse` identik supaya FE cukup ganti URL; `flagged` diserahkan ke BE-31; verifikasi: `pytest tests -q` 98 passed. B4 Moderation kini 1/6 selesai.

- **[BE-52]** Tutup kebocoran baca laporan - (a) `GET /admin/reports` (lihat BE-28) menggantikan pemakaian `GET /reports` untuk antrian moderasi; (b) `GET /reports` publik dipaksa `status IN STATUS_TAYANG` via param `hanya_tayang` di `services/laporan.py::get_reports`; (c) `GET /reports/{id}` hanya pemilik/admin (403) dengan helper `_boleh_lihat` yang kini dipakai juga endpoint status BE-24 (logika tak terduplikasi), laporan anonim penuh tetap terbuka dengan bukti id UUID; **deviasi**: test lama `test_reports_publik_tetap_tanpa_auth` diganti jadi `test_reports_publik_hanya_tayang` (ekspektasi menunggu_verifikasi tampil di publik dibuang); catatan FE: `AntrianModerasiPage`/`DashboardPage` pindah ke `/admin/reports` (sesi FE); verifikasi: 98 passed (9 test baru `test_admin_reports.py`). B4 kini 2/6.

- **[BE-50]** Endpoint "Laporan Saya" - `GET /api/v1/reports/mine` (`read_my_reports` di `app/api/v1/laporan.py`, token wajib `get_current_active_user`, dideklarasikan sebelum `GET /{laporan_id}`): daftar laporan milik pemanggil semua status lewat `get_reports(..., user_id=)` yang sudah siap, filter `status`/`q`/`wilayah` tetap terkombinasi, laporan anonim dibuat-saat-login tetap muncul di pemiliknya, admin = laporan sendiri; verifikasi: `pytest tests -q` 89 passed (6 test baru). FEAT-013 selesai; B3 Report Service **10/10 (tuntas)**.

- **[BE-26]** Rate-limiting `POST /reports` & `POST /uploads` - `RateLimitMiddleware` ASGI murni (`app/middleware/rate_limit.py`, dipasang di `app/main.py` sebelum CORS): sliding window in-process, kunci hybrid user-id (token valid) atau IP, 10 percobaan / 10 menit (`RATE_LIMIT_ENABLED/MAX/WINDOW_S` di `config.py` + `.env.example`); semua percobaan dihitung (termasuk 400/422), tolak -> 429 + `Retry-After`; reset store di `tests/conftest.py`; verifikasi: `pytest tests -q` 83 passed (6 test baru). B3 Report Service kini 9/10.

- **[BE-24]** Endpoint status laporan untuk pelapor - `GET /api/v1/reports/{id}/status` (`read_report_status` di `app/api/v1/laporan.py`, skema `LaporanStatusResponse`): laporan berpemilik hanya terbaca pemilik (token wajib) atau admin, laporan anonim penuh dibuka dengan bukti id UUID; response hanya `id`/`status`/`created_at`/`updated_at`/`timeline` tanpa deskripsi, foto, dan nama pelapor; dokumentasi `docs/API.md`, `04-api-endpoints.md`, dan `features/report-service.md` sinkron; verifikasi: `pytest tests/unit -q` 70 passed (7 test akses baru). B3 Report Service kini 7/10.

- **[BE-25]** Flag laporan tayang oleh pengguna lain - `POST /api/v1/reports/{id}/flag` (`flag_report` di `app/api/v1/laporan.py`, service `flag_laporan`, wajib login): tabel baru `laporan_flag` + unique `(laporan_id, user_id)` (migrasi `fe1d83da4fca`, head) sebagai benteng anti-spam; hanya `STATUS_TAYANG` -> 400, pelapor sendiri -> 403, dobel -> 409; flag tidak mengubah status laporan maupun timeline; `docs/schema.sql` & `03-database-schema.md` disinkronkan (tabel ke-9, daftar migrasi & head yang tertinggal ikut dibenahi), `moderation-service.md` kebijakan "flag di luar MVP" diganti; verifikasi: `pytest tests/unit -q` 77 passed (7 test baru), `alembic current` = `fe1d83da4fca (head)`. B3 Report Service kini 8/10.

## 2026-10-06

- **[BE-23]** Ambang batas 100 meter anti fake-GPS - blok `lolos_validasi` di akhir `services/laporan.py::create_report`: auto-tayang (`status = diverifikasi` + timeline kedua "Lolos validasi lokasi" berisi jarak meter) hanya bila jarak browser **dan** EXIF ke ruang publik sama-sama ada dan <= 100 m; selainnya tetap `menunggu_verifikasi` (kondisi ketat: tanpa EXIF, tanpa koordinat browser, RP tanpa koordinat, atau salah satu/kedua jarak lewat). Ambang `FAKE_GPS_THRESHOLD_M=100` di `app/core/config.py` + `backend/.env.example`; FE `VITE_FAKE_GPS_THRESHOLD_M` diseragamkan 50 -> 100; aturan dicatat di `docs/API.md` (tabel R1-R12). Verifikasi: 5 skenario baru lulus, suite 62 passed.
- **[BE-27]** Unit test skenario lokasi (PRD bagian 8) - 5 test di `tests/unit/test_laporan.py` (valid -> diverifikasi + timeline 2; jauh; tanpa EXIF; EXIF vs browser bertentangan; EXIF dekat tanpa koordinat browser -> menunggu_verifikasi), menutup verifikasi BE-23 sekaligus. Verifikasi: `pytest tests/unit -q` 62 passed.
- **[BE-22]** Logika validasi lokasi Haversine - `app/core/utils.py` (`haversine_km`), kolom `jarak_browser_rp`/`jarak_exif_rp` di tabel `laporan` (migrasi `74d05cd21291`, sudah `upgrade head`), perhitungan di `services/laporan.py` setelah ekstraksi EXIF, field ikut `LaporanResponse`; verifikasi: 4 test baru (3 Haversine + 1 jarak terisi), suite total 57 passed.
- **[Dokumen]** koreksi kecil entri BE-22: tipe kolom jarak ditulis `DECIMAL(8,3)` padahal model & migrasi `74d05cd21291` memakai `Float` (km) - diperbaiki di TASK_GUIDE.
- **[BE-21]** Ekstrak metadata EXIF GPS dari foto saat submit laporan - `app/core/exif_utils.py` (`extract_gps_from_file`: baca file via Pillow, parse `GPSInfo` (0x8825), konversi DMS ke desimal, silent return `(None,None)` untuk file rusak/tak punya EXIF); integrasi di `services/laporan.py:80` setelah timeline dibuat — `lat_exif`/`long_exif` diisi hanya bila foto punya GPS EXIF, selainnya tetap NULL tanpa menggagalkan submit. `Pillow>=12.0` + `piexif>=1.1` di `requirements.txt` (piexif hanya untuk test). Verifikasi: 2 test baru (dengan EXIF GPS terisi, tanpa EXIF → None), suite total 53 passed.
- **[BE-04]** Rancang skema tabel awal diresmikan - semua tabel B0 (`categories`, `users`, `ruang_publik`, `fasilitas`, `laporan`, `laporan_timeline`) sudah ada dengan `lat`/`long` `DECIMAL(10,8)`/`DECIMAL(11,8)` siap query jarak; keputusan direkam: relasi fasilitas tetap **1-FK** `fasilitas.ruang_publik_id` (bukan pivot many-to-many seperti jobdesk — filter FEAT-005 jalan via aggregate, pivot = rombak filter/CRUD/seed/response + koordinasi FE), role `warga`/`admin`; sinkron `docs/schema.sql` (tambah `users.is_active`, selisih terakhir vs model). Verifikasi: `alembic current` = `tambah_tabel_ruang_publik_foto (head)`, `pytest tests/unit -q` 51 passed. B0 kini 9/9.
- **Dokumen** - koreksi tabel Ringkasan Status `TASK_GUIDE_BACKEND.md`: B2 ETL Worker `5|0|1` -> `6|6|0` (BE-19 selesai 2026-10-05 tetapi baris ringkasan tidak ikut diperbarui; seluruh 6 task BE-14 s/d BE-19 sudah `[x]` dan terverifikasi); seluruh Total direvisi lagi oleh entri BE-04 di atas -> `56 | 26 | 6 | 24`.
- **[BE-47]** Fix filter laporan tayang di `GET /public-spaces/{id}/reports` - buat konstanta `STATUS_TAYANG`/`STATUS_KANONIK` di `schemas/laporan.py`, ganti filter `services/laporan.py` dari status palsu `disetujui`/`tayang_otomatis` ke `diverifikasi`/`dalam_penanganan`/`selesai`; verifikasi: 6 unit test baru lulus (belum tayang, diverifikasi tampil, ditolak tidak tampil, 404, status lain ikut tayang), suite total 29 passed.
- **[BE-12]** Ditutup oleh BE-47 (endpoint sudah ada, bug filter diperbaiki).
- **[BE-13]** Unit test radius search & kombinasi filter - `tests/unit/test_ruang_publik.py` (11 test: radius kecil/besar, `jarak_km` terisi & terurut, baris tanpa koordinat gugur, tanpa titik acuan urut nama, filter kategori/fasilitas AND/q/wilayah, kombinasi + skip/limit, stats termasuk NULL); suite total 40 passed (file test lokal, masuk `.gitignore`).
- **[BE-48]** Galeri foto multi-foto ruang publik - tabel `ruang_publik_foto` (migrasi + backfill `image_url` jadi baris foto pertama), endpoint admin `GET/POST/DELETE /admin/public-spaces/{id}/photos` (`app/api/v1/foto_ruang_publik.py`), service `gabung_foto` menyatukan foto resmi (urut terlama) + foto laporan `STATUS_TAYANG` (urut terbaru) tanpa duplikat di `GET /public-spaces/{id}`; verifikasi: 11 unit test baru lulus, suite total 51 passed, `alembic upgrade/downgrade/upgrade` teruji termasuk backfill. B1 Public Space Service kini 7/7.

## 2026-10-05

- **[BE-20]** Submit laporan publik dan verifikasi foto - `POST /api/v1/reports` mewajibkan upload foto bukti fisik (`foto_url` diawali `/uploads/laporan/` dan diverifikasi di disk), menyimpan koordinat pengguna `lat_user`/`long_user` (koordinat opsional berpasangan), memproteksi nama pelapor dari spoofing, dan menerapkan `oauth2_scheme_optional` agar pelapor anonim tanpa token tidak tertolak 401; verifikasi: unit test `test_laporan.py` (11 passed, total suite 23 passed), kontrak API black-box R1-R8 lulus, Playwright B1-B13 end-to-end sukses.
- **[BE-49]** Endpoint upload foto bukti laporan - `POST /api/v1/uploads` multipart menerima `UploadFile`, memvalidasi MIME (JPEG/PNG/WebP), ukuran maksimal 5MB, dan magic bytes berkas, menyimpan ke `storage/laporan/<uuid.hex><ext>` dan mengembalikan URL publik `/uploads/laporan/...` tanpa mewajibkan auth; verifikasi: upload JPEG valid -> 201 + file HTTP 200 via mount `/uploads`, berkas non-gambar `.txt` -> 400, berkas > 5MB -> 400, berkas samaran -> 400, tanpa berkas -> 422.
- **[BE-46]** Migrasi kolom lokasi pada tabel laporan - migrasi Alembic `37c407708e27_tambah_kolom_lokasi_laporan.py` menambahkan kolom `lat_user`, `long_user`, `lat_exif`, `long_exif` (Float, nullable) pada tabel `laporan`, `LaporanBase` memvalidasi koordinat user dalam rentang -90..90 dan -180..180, `LaporanResponse` mengekspos koordinat; verifikasi: siklus migrasi `upgrade head` -> `downgrade -1` -> `upgrade head` sukses, skema docs sinkron.
- **[FE-16]** Input foto berkas asli dan validasi sisi klien - mengganti simulasi kamera modal di `FormLaporPage.jsx` dengan input file native (`accept="image/jpeg,image/png,image/webp"`), validasi MIME & ukuran berkas <= 5MB sebelum upload, preview gambar Object URL dengan tombol hapus yang dapat diakses, helper upload multipart `api.upload()` tanpa Content-Type eksplisit; verifikasi: alert validasi klien muncul untuk file txt dan > 5MB, foto valid menampilkan preview dan dapat dihapus/dipilih ulang, build `npm run build` sukses.
- **[FE-17]** Pengambilan geolokasi pelapor saat submit - `FormLaporPage.jsx` menangkap koordinat perangkat pelapor via `navigator.geolocation.getCurrentPosition` dengan timeout 5s saat submit, menyertakan `lat_user` dan `long_user` secara transparan ke `POST /reports` tanpa membocorkan angka presisi koordinat ke tampilan UI (menjaga privasi); verifikasi: Playwright menangkap koordinat presisi terkirim ke backend dan tidak tampil di UI, tanpa izin lokasi laporan tetap berhasil submit (opsional).
- **[BE-19]** Log hasil run ETL ke database - tabel `etl_run` (model + migrasi
  `tambah_tabel_etl_run`) diisi `app/etl/pipeline.py`, kini satu-satunya jalur pipeline untuk
  scheduler (BE-17), `--once`, dan endpoint manual (BE-18): status, waktu mulai/selesai,
  `tahap_gagal`, `hitung` insert/update/skip dari baris `ETL_HITUNG`, serta log 100 baris
  terakhir per tahap; run `berjalan` yang stale lebih dari 2 jam ditandai terputus;
  `GET /api/v1/admin/sync-data?limit=` (admin) membaca riwayat, FE `syncService.riwayatSync`
  + `DataMasterPage` menampilkan 10 run terakhir beserta log per tahap; verifikasi: run
  `--once` sukses 3 tahap dengan `0 baru, 0 diupdate, 1200 tanpa perubahan` tercatat dan
  terbaca lewat API (401 tanpa token, 403 warga, 200 admin), run gagal mencatat
  `tahap_gagal`, `pytest tests/unit -q` lolos 12 passed, 10 skenario otomasi browser Playwright
  lulus, dan `npm run build` FE lolos.

## 2026-10-04

- **[BE-18]** Trigger manual ETL dari panel admin - endpoint `POST /api/v1/admin/sync-data`
  (`app/api/v1/sync_data.py`, dijaga `get_current_admin`) menjalankan pipeline penuh extract ->
  transform -> seed lewat `jalankan_tahap` BE-17, dilindungi `threading.Lock` (run kedua saat masih
  berjalan -> `409`); response `SyncResult` (`app/schemas/sync.py`) memuat status, waktu mulai/
  selesai, daftar tahap + log 100 baris terakhir, dan `tahap_gagal`; `scheduler.py` direfactor kecil:
  `jalankan_tahap` kini mengembalikan `(sukses, log_lines)` tanpa mengubah perilaku scheduler;
  verifikasi: `pytest tests/unit -q` 6 lolos (401 tanpa token, 403 warga, sukses 3 tahap, gagal di
  tahap kedua, 409 lock, log dipotong).
- **[BE-17]** Penjadwal pipeline ETL - `app/etl/scheduler.py` baru: APScheduler 3.11.3 sebagai proses
  terpisah dari API (`python -m app.etl.scheduler`, `--once` untuk sekali jalan) menjalankan extract ->
  transform -> seed sesuai `ETL_JADWAL` (default `0 2 * * *` = 02:00 WIB, ada di `config.py` +
  `.env.example`); tiap tahap jalan lewat subprocess dengan timeout, gagal extract membatalkan run,
  kandidat tetap di luar pipeline (tanpa `--pakai-kandidat`); verifikasi: `--once` penuh exit 0 dengan
  seed `0 diupdate`, jadwal `* * * * *` fires tepat menit berikutnya (17 detik/run), tahap gagal ->
  `--once` exit 1, `ETL_JADWAL` salah -> exit 2.
- **[BE-16]** Load field-level merge FEAT-012 - `app/etl/seed_db.py` kini punya jalur UPDATE: baris
  dicocokkan id -> natural key `nama|kecamatan|kelurahan` -> nama (nama ambigu ditahan, tidak
  ditebak), hanya kolom `ETL_OWNED` yang disegarkan dan hanya bila belum tercatat di `field_source`;
  pemetaan `ETL_OWNED`/`KOLOM_ADMIN` jadi konstanta di `seed_db.py` dengan penjaga kolom baru belum
  terpetakan; `app/etl/kunci.py` baru (kunci normalisasi dipakai transform & seed);
  `kecamatan`/`kelurahan` masuk tabel `ruang_publik` (migrasi `d7b19b0b82cc`) + response detail;
  default sumber seed pindah ke `ruang_publik_terbaru.csv`, `ruang_publik.csv` jadi cadangan;
  verifikasi: seed pertama `0 baru, 1018 diupdate` -> ulang `0 diupdate`, edit manual lewat
  `mark_fields_edited` bertahan sementara `longitude` tanpa penanda dibetulkan, 687 kandidat (48
  jalur update + 639 insert, tanpa duplikat; baris uji dibersihkan setelah uji), `field_source` 0
  terisi & `verified` 1200 True tak tersentuh, transform pasca-refactor file identik, API radius
  `jarak_km` + `stats` 1200 + detail `kecamatan`/`kelurahan` normal.
- **[BE-15]** Transform 4 kategori + guard kandidat - `app/etl/transform_rth_raw.py` ditulis ulang: baca
  3 file hasil BE-14 + master 1200 (master tidak ditulis ulang), buang baris di luar 4 kategori final,
  koordinat tak valid/luar rentang DKI, dan duplikat by natural key; `latitude`/`longitude`/`tipe`
  disegarkan untuk 1121 baris, `kategori_id` master (`taman` 1185 + `jalur-hijau` 15) dinormalisasi ke
  4 id final; keluar `ruang_publik_terbaru.csv` (1200 baris, id identik) +
  `kandidat/ruang_publik_kandidat.csv` (687 baris) + `transform_laporan.json`; `seed_db` kini menolak
  file kandidat kecuali `--pakai-kandidat`; verifikasi: 11 pemeriksaan lolos, `seed_db --file
  ruang_publik_terbaru.csv` -> `0 baru (total 1200)`, jalankan dua kali -> `0 file berubah`.
- **[BE-14]** Script Extract Satu Data + Geoportal - `app/etl/extract_satudata.py` baru: unduh 5 dataset
  (Satu Data: RTH 2545, RPTRA 648, RPTRA belum diresmikan 56; Geoportal ArcGIS: koordinat RTH 6512,
  RPTRA 324) ke `data/raw/` dengan `<nama>.meta.json`, retry otomatis, penulisan atomik, CLI
  `--source`/`--dataset`/`--page-url`; `requests==2.34.2` masuk requirements + alasan di
  `01-tech-stack.md` §7; verifikasi: 5 CSV sesuai `total` API, run ulang identik (0 file berubah),
  `read_raw` baca 7 file bersih, kolom RTH identik dengan unduhan manual.
- **Chore** seed fasilitas - `app/etl/seed_fasilitas.py` baru: isi `fasilitas` dengan data contoh per
  ruang publik (id stabil `seed-<hash>-<n>`, dilewati bila lokasi sudah punya fasilitas, `--reset` hanya
  menghapus baris prefix `seed-` dan menolak bila ada laporan menunjuknya); 5428 baris, sebelumnya 0;
  verifikasi: seed dua kali -> `0 baru`, `--reset` + seed ulang -> jumlah sama, fasilitas buatan admin
  tidak tersentuh, `GET /facilities` kini 13 opsi.
- **[BE-53]** CRUD fasilitas admin - endpoint `/api/v1/admin/facilities` (`GET`/`POST`/`PATCH`/`DELETE`
  + `POST /import` CSV multipart) di `app/api/v1/fasilitas.py`, service + validasi status di
  `services/ruang_publik.py`, semua `get_current_admin`, hapus ditolak `409` bila masih dirujuk laporan;
  keputusan path (namespace admin, bukan nested) dicatat di `features/data-master-service.md` §2.2;
  verifikasi: skrip black-box `TestClient` 29 pemeriksaan lolos, tanpa warning SQLAlchemy.
- **Frontend** halaman Kelola Fasilitas tersambung API - `KelolaFasilitasPage.jsx` ditulis ulang
  (daftar + cari + Tambah/Edit/Hapus + impor CSV) memakai `services/fasilitasService.js`;
  `config/api.js` kini menyalin `error.detail` ke `error.message`; kolom "X Terdata" di
  `DataMasterPage.jsx` dihitung dari API (dulu selalu `0`); verifikasi: `npm run build` sukses.
- **[FE-23]** sesi login pemerintah bertahan saat refresh - `AuthContext` hydrate `token`/`user` dari `localStorage`
  lewat lazy initializer `useState(readStoredAuth)` (dulu di `useEffect`, `RequireAuth` sudah Navigate ke
  `/login-pemerintah` sebelum state terisi); `role` diturunkan dari `user`, keluar tetap hanya lewat tombol logout;
  verifikasi: `npm run build` sukses.

## 2026-10-03

- **Dokumen** - buat `TASK_GUIDE_BACKEND.md` (audit 56 task BE-01 s/d BE-56: 9 selesai, 
  12 parsial, 35 belum) dari jobdesk induk + hasil audit kode `backend/app/`.
- **Dokumen** - buat `CHANGELOG.md` ini beserta aturan pencatatan, dan pasang aturannya di
  `TASK_GUIDE_BACKEND.md` (Cara Baca + Definition of Done) serta `GIT_WORKFLOW.md` (bagian 7).
- **[BE-05]** penanda field-level merge FEAT-012 - tambah kolom `ruang_publik.field_source` (JSON, NULL = belum
  pernah diedit) + migrasi `c1f4a9d2e073` + helper `mark_fields_edited()` / `is_edited_manually()` / `edited_fields()`
  di `services/ruang_publik.py`, ikut di response detail; verifikasi: `alembic current` = head, penanda tertulis &
  terbaca lintas sesi di MySQL, kolom tak dikenal/kolom sistem ditolak, `python -m app.etl.seed_db` (1200 baris)
  tidak menimpa edit manual; docs disesuaikan (`03-database-schema.md`, `04-api-endpoints.md`,
  `features/data-master-service.md`, `docs/schema.sql`).
