# TASK_GUIDE_BACKEND.md - Task Guide Backend Raku Jakarta

Turunan dari [`../../docs/JOBDESK_FE_BE_Raku_Jakarta.md`](../../docs/JOBDESK_FE_BE_Raku_Jakarta.md) bagian B
(BE-01 s/d BE-45), ditambah task baru **BE-46 s/d BE-56** hasil audit kebutuhan website.

Status tiap task **diverifikasi langsung ke kode** di `backend/app/` per dokumen ini dibuat.
Bila nanti kode berubah, perbarui centangnya di sini (bukan di jobdesk induk).

---

## Cara Baca

- `[x]` selesai dan sudah ada di kode.
- `[ ]` **Parsial** - sudah ditulis `**Parsial:**` + apa yang kurang. Kotak sengaja tidak dicentang
  sampai seluruh isinya beres.
- `[ ]` belum dikerjakan.
- `**Lokasi kode:**` menunjuk file supaya cepat dicek ulang.
- `**Verifikasi:**` gerbang penerimaan task - dikerjakan sebelum task ditandai selesai.
- **Aturan changelog:** setiap kali satu task berubah jadi `[x]`, pada sesi yang sama tambahkan entri
  ber-tanggal di [`CHANGELOG.md`](CHANGELOG.md) (format `YYYY-MM-DD`, terbaru di atas, satu baris per task).
  Task parsial atau belum dikerjakan tidak dicatat di changelog - statusnya sudah terbaca di sini.

### Kamus status laporan (kanonik, jangan dilepas)

`menunggu_verifikasi` -> `diverifikasi` -> `dalam_penanganan` -> `selesai`, plus `ditolak`.
Label tampilan ada di FE (`apps/web/src/components/StatusBadge.jsx`).

---

## Ringkasan Status

| Bagian | Task | Selesai | Parsial | Belum |
|---|---|---|---|---|
| B0 Setup & Fondasi | 9 | 9 | 0 | 0 |
| B1 Public Space Service | 7 | 7 | 0 | 0 |
| B2 ETL Worker | 6 | 6 | 0 | 0 |
| B3 Report Service | 10 | 4 | 1 | 5 |
| B4 Moderation Service | 6 | 0 | 3 | 3 |
| B5 Data Master Service | 3 | 1 | 0 | 2 |
| B6 Admin Auth & Pemisahan Akses | 5 | 1 | 2 | 2 |
| B7 Testing | 5 | 0 | 0 | 5 |
| B8 Deployment | 4 | 0 | 0 | 4 |
| B9 Konten Situs | 1 | 0 | 0 | 1 |
| **Total** | **56** | **28** | **6** | **22** |

---

## B0. Setup & Fondasi

- [x] **[BE-01]** Inisialisasi project FastAPI, struktur folder (routers, models, schemas, services, core/config, db).
  - **Lokasi kode:** `backend/app/main.py`, `backend/app/api/`, `backend/app/core/`, `backend/app/models/`,
    `backend/app/schemas/`, `backend/app/services/`, `backend/app/etl/`.
- [x] **[BE-02]** Setup koneksi MySQL via SQLAlchemy + PyMySQL, konfigurasi `.env`.
  - **Lokasi kode:** `app/core/database.py`, `app/core/config.py`, `backend/.env.example`,
    `docker-compose.yml` (service `raku-db`).
- [x] **[BE-03]** Setup Alembic untuk database migration.
  - **Lokasi kode:** `backend/alembic.ini`, `backend/alembic/env.py`,
    `alembic/versions/34fc1fc4d761_initial_schema.py`, `alembic/versions/b7e2c1049a3f_add_user_is_active.py`.
- [x] **[BE-04]** Rancang & buat skema tabel awal: `ruang_publik`, `kategori`, `fasilitas`, relasi fasilitas,
      `laporan`, `pengguna` (role publik/admin), kolom `lat`/`long` yang mendukung query jarak.
  - **Lokasi kode:** tabel `categories`, `users`, `ruang_publik`, `fasilitas`, `laporan`, `laporan_timeline`
    (lihat `docs/03-database-schema.md`, SQL rujukan `docs/schema.sql`). Kolom lokasi pelapor/EXIF via BE-46,
    `lat`/`long` ruang publik bertipe `DECIMAL(10,8)`/`DECIMAL(11,8)` (akurat ~1,1 cm) + index untuk query jarak.
  - **Keputusan (relasi fasilitas):** pakai 1-FK `fasilitas.ruang_publik_id`, **bukan** tabel join
    many-to-many seperti jobdesk. Alasan: fasilitas adalah baris atribut per induk (12 katalog nama dipakai
    filter FEAT-005 lewat query aggregate di `services/ruang_publik.py:88`), tidak ada entitas fasilitas
    global yang dipakai lintas tempat; migrasi ke pivot = rombak filter/CRUD/seed/response dan mengubah
    kontrak FE — dilarang tanpa koordinasi FE (lihat baris catatan task ini). Role `warga`/`admin`
    (jobdesk menulis `publik`/`admin` — nama kolom tidak berpengaruh ke API, cukup dicatat di sini).
  - **Verifikasi (2026-10-06):** `alembic current` = `tambah_tabel_ruang_publik_foto (head)`;
    `docs/schema.sql` cocok dengan model (selisih terakhir `users.is_active` ditutup pada entri ini).
- [x] **[BE-05]** Tambah kolom penanda field-level merge di `ruang_publik` (`field_source` JSON atau tabel
      `ruang_publik_edit_log` yang mencatat kolom mana yang pernah diedit manual admin). *(FEAT-012)*
  - **Lokasi kode:** kolom `field_source` di `app/models/ruang_publik.py`, migrasi
    `alembic/versions/c1f4a9d2e073_add_ruang_publik_field_source.py`, penulis/pembaca
    `mark_fields_edited()` / `is_edited_manually()` di `app/services/ruang_publik.py`,
    ikut di response lewat `RuangPublikResponse.field_source`.
  - **Keputusan:** pakai kolom JSON di tabel `ruang_publik`, bukan tabel log terpisah —
    `NULL` = belum pernah diedit, `{"kolom": "waktu edit"}` = milik admin, tidak boleh ditimpa ETL (BE-16).
  - **Verifikasi:** kolom tercipta (alembic `head`), penanda tertulis & terbaca lintas sesi,
    kolom tak dikenal/kolom sistem ditolak, dan `python -m app.etl.seed_db` tidak menimpa edit manual (0 baris di-update).
- [x] **[BE-06]** Setup JWT auth dasar (login, generate token, dependency proteksi) + hashing password bcrypt.
  - **Lokasi kode:** `app/core/security.py` (PyJWT + passlib), `app/api/deps.py`
    (`get_current_user`, `get_current_active_user`, `get_current_admin`), `app/api/v1/auth.py`.
- [x] **[BE-07]** Setup CORS middleware, whitelist origin FE Publik dan FE Admin secara eksplisit. *(NFR-002)*
  - **Lokasi kode:** `app/main.py:22`.
  - **Catatan:** `FRONTEND_ADMIN_URL` default `http://localhost:5174` di `.env.example`, sedangkan FE Admin
    saat ini masih satu aplikasi dengan FE Publik di `:5173`. Sesuaikan nilai saat FE Admin dipisah.
- [x] **[BE-08]** Setup local storage foto: folder `/uploads`, mount `StaticFiles`, validasi tipe & ukuran saat upload. *(NFR-002)*
  - **Lokasi kode:** `app/main.py` (mount `/uploads`), `app/core/file_upload.py`, dan endpoint `app/api/v1/uploads.py` (task BE-49).
  - **Keputusan:** File disimpan di subfolder terkunci `storage/laporan/` dengan nama acak UUID hex. Validasi MIME (JPEG, PNG, WebP), ukuran maksimal 5MB, dan verifikasi magic bytes gambar.
  - **Verifikasi (2026-10-05):** Upload JPEG valid -> 201 + URL terlayani HTTP 200 via mount `/uploads/laporan/...`; file `.txt` -> 400; file > 5MB -> 400; file palsu (ekstensi .jpg isi teks) -> 400.
- [x] **[BE-46]** **(baru - hasil audit)** Migration Alembic: tambah kolom lokasi di tabel `laporan`
      `lat_user`, `long_user`, `lat_exif`, `long_exif` (semua nullable) untuk menyimpan koordinat browser
      dan koordinat EXIF foto saat submit.
  - **FEAT:** prasyarat FEAT-013 validasi lokasi (task BE-22/BE-23) dan FEAT-008.
  - **Lokasi kode:** `app/models/laporan.py`, `app/schemas/laporan.py`, migrasi `alembic/versions/37c407708e27_tambah_kolom_lokasi_laporan.py`.
  - **Keputusan:** Keempat kolom bertipe Float dan nullable agar data laporan historis tetap kompatibel tanpa default value semu.
  - **Verifikasi (2026-10-05):** Migrasi `upgrade head` sukses, `downgrade -1` bersih menghapus 4 kolom, `upgrade head` kembali ke `37c407708e27`. Pydantic schema memvalidasi rentang -90..90 dan -180..180.

---

## B1. Public Space Service (FEAT-001 s/d FEAT-007)

- [x] **[BE-09]** `GET /public-spaces?lat=&long=&radius=&category=&facilities=` - radius search + filter. *(FEAT-001, 004, 005)*
  - **Lokasi kode:** `app/api/v1/ruang_publik.py:15`, `app/services/ruang_publik.py:29` (Haversine di SQL).
  - Mendukung juga `q`, `wilayah`, `skip`, `limit`.
- [x] **[BE-10]** `GET /public-spaces/{id}` - detail lengkap dengan fasilitas & foto. *(FEAT-006)*
  - **Lokasi kode:** `app/api/v1/ruang_publik.py:61` (`foto[]` hasil `crud_ruang_publik.gabung_foto` — foto resmi + laporan tayang).
- [x] **[BE-11]** `GET /categories` dan `GET /facilities` untuk populate filter FE. *(FEAT-004, 005)*
  - **Lokasi kode:** `app/api/v1/categories.py:11`, `app/api/v1/fasilitas.py:13`.
  - **Catatan:** `POST /categories` ikut ada tapi belum terproteksi -> task **BE-54**.
- [x] **[BE-12]** `GET /public-spaces/{id}/reports` - daftar laporan yang **sudah tayang**. *(FEAT-007, 010)*
  - **Lokasi kode:** `app/api/v1/ruang_publik.py:79`, filter `services/laporan.py:177` memakai `STATUS_TAYANG`.
  - **Diselesaikan oleh BE-47.**
- [x] **[BE-13]** Unit test (pytest) untuk logika radius search & kombinasi filter.
  - **Lokasi kode:** `backend/tests/unit/test_ruang_publik.py` (11 test: radius, filter kategori/fasilitas/q/wilayah/kombinasi+paginasi, stats).
  - **Verifikasi:** `python -m pytest tests/unit -q` -> 40 passed. Test lokal saja (file test di-`.gitignore`, lihat `docs/06-testing-strategy.md`).
- [x] **[BE-47]** **(baru - hasil audit)** Fix filter laporan tayang di `GET /public-spaces/{id}/reports`:
      ganti kamus status menjadi `STATUS_TAYANG = ("diverifikasi", "dalam_penanganan", "selesai")`,
      didefinisikan di `app/schemas/laporan.py` (dipakai bersama BE-51 nanti).
  - **FEAT:** FEAT-010. **Memperbaiki BE-12.**
  - **Verifikasi:** setujui satu laporan via `PATCH /reports/{id}/status` -> endpoint ini mengembalikannya;
    laporan `menunggu_verifikasi` dan `ditolak` tidak tampil.
- [x] **[BE-48]** **(baru - hasil audit)** Galeri foto multi-foto ruang publik: tabel `ruang_publik_foto`,
      endpoint `GET /admin/public-spaces/{id}/photos` + `POST` (upload) + `DELETE`, migrasikan kolom tunggal
      `image_url` jadi baris foto pertama; response `GET /public-spaces/{id}` menyertakan foto resmi
      **digabung** dengan foto laporan yang sudah tayang.
  - **FEAT:** FEAT-007 (dukung FE-14 Galeri Foto di FE Publik).
  - **Lokasi kode:** `app/models/ruang_publik_foto.py`, `app/api/v1/foto_ruang_publik.py`
    (dipasang di `api.py` prefix `/admin/public-spaces`), service `list_foto_resmi`/`tambah_foto`/
    `hapus_foto`/`gabung_foto` di `app/services/ruang_publik.py`, migrasi
    `alembic/versions/tambah_tabel_ruang_publik_foto.py`.
  - **Keputusan:** Opsi B sederhana — tabel hanya foto resmi (tanpa kolom `sumber`/`laporan_id`);
    foto laporan di-merge langsung dari tabel `laporan` dengan `STATUS_TAYANG`, jadi tidak butuh
    sinkronisasi. `image_url` tetap dipertahankan: ikut tampil bila belum punya baris foto.
  - **Verifikasi (2026-10-06):** `pytest tests/unit -q` -> 51 passed (`test_foto_ruang_publik.py` 11 test:
    401/403, CRUD+upload, merge tanpa duplikat, urutan stabil, detail 200/404); `alembic upgrade head` sukses,
    backfill teruji (seed `image_url` -> 1 baris, `downgrade -1` + `upgrade head` kembali bersih).

---

## B2. ETL Worker - Sinkronisasi Satu Data Jakarta

- [x] **[BE-14]** Script Extract: download dataset RTH & RPTRA dari Satu Data Jakarta, simpan sementara.
  - **Lokasi kode:** `app/etl/extract_satudata.py`.
  - **5 dataset, 2 sumber** (koordinat ikut diambil karena Satu Data tidak punya kolom koordinat,
    keputusan pemilik proyek 2026-10-04): Satu Data Jakarta (POST JSON `detail` + `get-table-data`) ->
    `satudata_rth` 2545 baris, `satudata_rptra` 648, `satudata_rptra_belum_diresmikan` 56;
    Jakarta Satu Geoportal (ArcGIS REST `query`) -> `geoportal_rth_koordinat` 6512 (kolom X/Y),
    `geoportal_rptra_koordinat` 324. Tiap CSV punya pasangan `<nama>.meta.json` (tanggal unduh,
    jumlah baris, kolom, tanggal rilis sumber).
  - **Verifikasi:** `python -m app.etl.extract_satudata` menulis 5 CSV + 5 meta ke `data/raw/`,
    jumlah baris sama dengan `total` API; jalankan dua kali -> isi CSV identik;
    `python -m app.etl.read_raw` membaca ke-7 file di `data/raw/` tanpa error;
    kolom `satudata_rth.csv` identik dengan file `.xls` unduhan manual (2545 x 7);
    `geoportal_rth_koordinat.csv` identik strukturnya dengan `rth_dki_coordinates.csv`
    (6512 x 18, 970 baris tanpa X, baris pertama sama).
- [x] **[BE-15]** Script Transform: normalisasi nama kategori ke 4 kategori final, normalisasi koordinat,
      deteksi baris duplikat/tidak valid.
  - **Lokasi kode:** `app/etl/transform_rth_raw.py` (varian legacy `transform_rth.py` tidak diubah).
  - **Sumber:** 3 file hasil BE-14 + master `data/processed/ruang_publik.csv` (1200 baris, hasil
    pembersihan manual, **tidak pernah ditulis ulang**). Baris di luar 4 kategori final dibuang,
    koordinat hilang/luar rentang DKI (lat -6.5..-5.5, lng 106.5..107.2) dibuang, duplikat dihapus
    by natural key `nama|kecamatan|kelurahan` ternormalisasi (prefix `RTH ` dibuang, nama RPTRA
    diseragamkan jadi `RPTRA <nama>` karena sumber menulisnya tanpa awalan).
  - **Keluaran:** `ruang_publik_terbaru.csv` (tepat 1200 baris, id identik master; hanya `latitude`,
    `longitude`, `tipe`, `kategori_id` disegarkan untuk 1121 baris yang ketemu sumber) +
    `kandidat/ruang_publik_kandidat.csv` (687 baris baru, `verified=False`) +
    `categories.json`/`.csv` + `transform_laporan.json` (dibuang per alasan, 79 baris tanpa pasangan).
  - **Temuan di master:** `kategori_id` lama berisi `taman` (1185) dan `jalur-hijau` (15), keduanya
    tidak ada di master kategori, jadi diturunkan ulang dari kolom `tipe` (950/119/102/29);
    1 baris (`RPTRA Tidung Ceria`) koordinatnya di luar rentang DKI, dipertahankan apa adanya.
  - **Untuk BE-16:** id di `ruang_publik.csv` lama tidak bisa direproduksi dari data sumber, jadi Load
    wajib mencocokkan baris **by natural key, bukan by id**, dan hanya meng-update kolom milik ETL
    (`features/data-master-service.md` §4). Tanpa itu database keisi dua kali: 1200 + 687.
  - **Verifikasi:** 11 pemeriksaan lolos (id & kolom identik master, hanya 4 tipe final, kategori_id
    valid, koordinat dalam rentang, tanpa duplikat); `seed_db --file ruang_publik_terbaru.csv` ->
    `0 baru (total 1200)`; `seed_db --file .../kandidat/...` ditolak (exit 1); dua kali jalan ->
    `0 file berubah`.
- [x] **[BE-16]** Script Load: update kolom yang **belum pernah diedit manual** saja, atau insert data baru. *(FEAT-012)*
  - **Lokasi kode:** jalur update di `app/etl/seed_db.py` (`_terapkan_etl`, `seed_ruang_publik`),
    pemetaan kolom `ETL_OWNED` / `KOLOM_ADMIN` di file yang sama, kunci natural di `app/etl/kunci.py`
    (dipakai bersama transform), kolom `kecamatan`/`kelurahan` + migrasi
    `alembic/versions/d7b19b0b82cc_tambah_kecamatan_kelurahan_ke_ruang_.py`.
  - **Keputusan:**
    1. Pencocokan bertingkat `id` -> natural key `nama|kecamatan|kelurahan` -> `nama`; bila nama cocok
       di lebih dari satu baris, baris ditahan (hitung `nama_ambigu`), tidak ditebak, supaya tidak
       jadi duplikat.
    2. Kolom `kecamatan`/`kelurahan` kini ada di tabel (dulu dibuang saat seed) supaya kunci natural
       bisa dihitung dari database, bukan hanya dari file master.
    3. Default sumber seed pindah ke `ruang_publik_terbaru.csv`; `ruang_publik.csv` (master) jadi
       cadangan, supaya jalur update tidak menulis ulang nilai lama di atas hasil transform.
    4. Nilai sumber NULL tidak pernah menimpa nilai terisi (sumber kosong bukan perintah menghapus);
       `field_source` tidak pernah ditulis seed; `verified` masuk `KOLOM_ADMIN`.
  - **Verifikasi (2026-10-04):** seed pertama `0 baru, 1018 diupdate` (backfill `kecamatan` 1006 baris
    + koordinat yang berubah), diulang 2x -> `0 diupdate` (idempoten); edit manual lewat
    `mark_fields_edited(db, row, ["latitude", "nama"])` bertahan sementara `longitude` tanpa penanda
    dibetulkan seed; kandidat diuji: 687 baris -> 1 natural key + 47 nama masuk jalur update (639
    insert), baris uji tidak jadi duplikat (dibersihkan lagi setelah uji); guard kandidat tetap exit 1;
    `field_source` 0 terisi & `verified` 1200 True (tak tersentuh ETL); selisih `ETL_OWNED` vs
    `ruang_publik_terbaru.csv` = 0; `transform_rth_raw` hasil refactor kunci menghasilkan file identik;
    API: radius search `jarak_km` terisi, `stats.total_ruang_publik` 1200, detail menampilkan
    `kecamatan`/`kelurahan`. Catatan: verifikasi "edit via API" memakai skrip `mark_fields_edited`
    karena endpoint edit admin (BE-33) belum ada.
- [x] **[BE-17]** Setup APScheduler untuk menjalankan Extract -> Transform -> Load berkala, sebagai proses
      terpisah dari server API.
  - **Lokasi kode:** `app/etl/scheduler.py` (pipeline per tahap + `--once` + `BlockingScheduler`),
    jadwal `ETL_JADWAL` di `app/core/config.py` (default `0 2 * * *` = 02:00 WIB) + `.env.example`,
    dependency `APScheduler==3.11.3` di `requirements.txt`.
  - **Keputusan:**
    1. Scheduler berjalan sendiri lewat `python -m app.etl.scheduler` dari folder `backend/`;
       `app/main.py` tidak disentuh (aturan: worker tidak boleh ada di dalam server API,
       `01-tech-stack.md` bagian 4).
    2. Tiap tahap dijalankan sebagai subprocess (`sys.executable -m <tahap>`, `cwd` folder backend)
       supaya kegagalan satu tahap tidak membawa proses scheduler mati, dan keluaran tiap tahap
       masuk log bertimestamp (bekal BE-19).
    3. Gagal extract (portal tanpa SLA) membatalkan run; file raw lama dipakai run berikutnya.
       `max_instances=1` + `coalesce=True` mencegah run tumpang tindih dan menumpuk.
    4. Kandidat tetap di luar pipeline: `seed_db` dipanggil tanpa `--pakai-kandidat`, tetap menunggu
       review manual.
    5. Dependency baru `APScheduler` dicatat di `01-tech-stack.md` bagian 4 dan tabel keputusan
       bagian 7; `--once` disediakan sebagai jalur alternatif cron/systemd timer untuk BE-44.
  - **Verifikasi (2026-10-04):** `--once` menjalankan 3 tahap penuh (extract 5 dataset -> transform ->
    seed `0 baru, 0 diupdate, 1200`, exit 0, total 20 detik); mode terjadwal dengan
    `ETL_JADWAL="* * * * *"` fires tepat menit berikutnya (log `15:19:00`) lalu selesai 17 detik dan
    proses tetap hidup, terpisah dari uvicorn; tahap gagal (modul rusak) -> pipeline dibatalkan dan
    `--once` exit 1; `ETL_JADWAL` salah -> exit 2 dengan pesan jelas; `compileall` lolos dan
    `pip install -r requirements.txt` bersih. Catatan: berhenti lewat Ctrl+C ditangani
    `except (KeyboardInterrupt, SystemExit)` tetapi belum diuji non-interaktif, dan Stop-Process
    (bunuh paksa) meninggalkan anak proses extract yang sedang jalan.
- [x] **[BE-18]** `POST /admin/sync-data` (khusus admin) untuk trigger manual ETL dari Panel Admin,
      kembalikan status/log hasil. *(FEAT-012, FE-28)*
  - Router `app/api/v1/sync_data.py` (prefix `/admin/sync-data`, tag `admin-sync`), menjalankan ketiga
    tahap lewat `jalankan_tahap` milik BE-17. `threading.Lock` anti-overlap: run kedua saat masih
    berjalan -> `409`. Response `SyncResult` (`app/schemas/sync.py`): status, waktu mulai/selesai,
    total detik, daftar tahap (nama, status, detik, log maksimal 100 baris terakhir), `tahap_gagal`
    bila run berhenti di tengah. Run selesai dengan tahap gagal tetap `200` + `status: "gagal"`
    (kegagalan ETL = hasil domain, bukan error transport).
    Catatan: lock hanya se-proses API; run scheduler terjadwal (proses terpisah) tidak saling
    terkunci - diterima karena jalur manual dan jalur terjadwal jarang bentrok.
  - **Verifikasi:** `pytest tests/unit -q` 6 lolos - 401 tanpa token, 403 warga, sukses 3 tahap
    berurutan, gagal di tahap kedua -> tahap ketiga tidak dijalankan, 409 saat lock terkunci,
    log 5000 baris dipotong menjadi 100.
- [x] **[BE-19]** Logging hasil tiap run ETL (jumlah insert/update/skip, error) untuk ditampilkan di Panel Admin.
  - **Lokasi kode:** tabel `etl_run` (`app/models/etl_run.py` + migrasi
    `alembic/versions/tambah_tabel_etl_run.py`), penulis run `app/etl/pipeline.py`, pembaca
    `GET /admin/sync-data` (`app/api/v1/sync_data.py`) dengan response `RiwayatItem`
    (`app/schemas/sync.py`), penanda angka `ETL_HITUNG` dari `app/etl/seed_db.py`.
  - **Keputusan:**
    1. Satu baris `etl_run` per run: `pemicu` (`manual`/`terjadwal`/`sekali`), `status`,
       `mulai`, `selesai`, `tahap_gagal`, `hitung` (JSON: `baru`, `diupdate`,
       `tanpa_perubahan`, `ditahan`, `cocok_*`, `categories_baru`, `sumber_baris`), dan
       `tahap` (JSON: nama, status, detik, 100 baris log terakhir per tahap).
    2. Pipeline dipusatkan di `app/etl/pipeline.py` supaya ketiga jalur menulis log yang sama:
       scheduler BE-17, `--once`, dan endpoint manual BE-18; `scheduler.jalankan_pipeline`
       kini menerima argumen `pemicu`.
    3. Baris `berjalan` yang mulainya lebih tua dari 2 jam ditandai `gagal` + `tahap_gagal`
       `terputus` tiap run baru dimulai, supaya run yang prosesnya dibunuh paksa tidak
       tertampil selamanya sebagai berjalan.
    4. `seed_db` mencetak satu baris `ETL_HITUNG {json}`; baris itu dibuang dari log yang
       disimpan supaya angka hitung tidak muncul dua kali (sekali sebagai ringkasan, sekali
       sebagai log).
    5. `GET` hanya admin, `limit` 1..200 (FE meminta 10), urut id menurun; waktu polos dari
       kolom `DATETIME` ditandai UTC di `RiwayatItem` supaya browser membaca zona waktu yang
       benar (konsisten dengan `SyncResult` yang sudah aware UTC).
  - **Verifikasi (2026-10-05):** `alembic upgrade head` membuat `etl_run` (head sebelumnya
    `d7b19b0b82cc`); `python -m app.etl.scheduler --once` mencatat run sukses `pemicu=sekali`,
    3 tahap (extract 23 dtk, transform 1 dtk, seed 1 dtk), `hitung` terisi `0 baru, 0 diupdate,
    1200 tanpa perubahan`, total 27 detik; run gagal di tahap kedua menyimpan
    `tahap_gagal=transform_rth_raw` + 2 baris tahap; API dijalankan langsung: tanpa token `401`,
    token warga `403`, token admin `200` berisi run di atas dengan `mulai`/`selesai` ber-UTC;
    FE `npm run build` lolos dan `riwayatSync()` memanggil `GET /admin/sync-data`.
    Unit test `pytest tests/unit -q` lolos penuh (**12 passed** in 0.21s: 6 test BE-18 + 6 test BE-19);
    seluruh 10 skenario otomasi browser Playwright lulus tanpa error.

---

## B3. Report Service + Validasi Lokasi Anti Fake-GPS (FEAT-008, 009, 010)

- [x] **[BE-20]** `POST /reports` - terima kategori masalah, deskripsi, foto (upload wajib), mode identitas,
      koordinat lokasi pengguna, `public_space_id`.
  - **Lokasi kode:** `app/api/v1/laporan.py`, `app/services/laporan.py`, `app/schemas/laporan.py`.
  - **Keputusan:** Foto bukti fisik wajib diunggah (string `foto_url` diawali `/uploads/laporan/` dan diverifikasi keberadaannya di disk). Koordinat `lat_user` dan `long_user` opsional (harus berpasangan lengkap bila diisi, rentang -90..90 dan -180..180). Dependency auth memakai `oauth2_scheme_optional` agar pengirim anonim tanpa token tidak tertolak 401, sementara mode `tampilkan_nama` tanpa token ditolak 400 dan nama pelapor diambil aman dari DB akun login (anti-spoofing).
  - **Verifikasi (2026-10-05):** 11 unit test lulus (`test_laporan.py`), uji black-box R1-R8 (anonim 201, tampilkan nama tanpa token 400, dengan token 201 anti-spoof, tanpa foto 400, foto palsu 400, koordinat parsial 400, koordinat luar rentang 422, tanpa koordinat 201), serta automasi Playwright B1-B13 end-to-end.
- [x] **[BE-21]** Ekstrak metadata EXIF GPS dari foto saat submit laporan (Pillow).
  - **Lokasi kode:** `app/core/exif_utils.py` (fungsi `extract_gps_from_file` — baca file, parse GPS EXIF,
    konversi DMS ke desimal, tangani file rusak/tiada EXIF dengan `(None, None)`); dipanggil di
    `app/services/laporan.py:80` setelah timeline dibuat — `lat_exif`/`long_exif` diisi hanya bila
    foto punya GPS EXIF, selainnya tetap `NULL` (tidak menggagalkan submit).
  - **Dependensi:** `Pillow>=12.0` (sudah di `requirements.txt`).
  - **Verifikasi (2026-10-06):** `pytest tests/unit -q` → 53 passed (2 test baru:
    `test_create_exif_gps_terisi` — foto dengan EXIF GPS (-6.175, 106.827) → `lat_exif`/`long_exif`
    terisi; `test_create_foto_tanpa_exif` — foto tanpa EXIF → `lat_exif`/`long_exif` = `None`).
- [x] **[BE-22]** Logika validasi lokasi: Haversine antara koordinat browser vs koordinat EXIF foto,
      masing-masing dibandingkan ke koordinat ruang publik tujuan. *(FEAT-013 - validasi lokasi)*
  - **Lokasi kode:** `app/core/utils.py` (`haversine_km(lat1, lon1, lat2, lon2) -> km`); integrasi di
    `app/services/laporan.py` setelah ekstraksi EXIF BE-21 — `jarak_browser_rp` (koordinat browser vs
    ruang publik) dan `jarak_exif_rp` (koordinat EXIF vs ruang publik) dihitung bila kedua pasangan
    koordinat tersedia, selainnya `NULL`; kolom `DECIMAL(8,3)` di model `laporan`, skema
    `LaporanResponse`, migrasi `74d05cd21291_tambah_kolom_jarak_laporan.py` (sudah `upgrade head`).
  - **Dependensi:** kolom hasil **BE-46** dan EXIF hasil **BE-21** (keduanya sudah ada).
  - **Verifikasi (2026-10-06):** `pytest tests/unit -q` → 57 passed (4 test baru: 3 di
    `tests/unit/test_utils.py` — titik sama = 0 km, Jakarta-Bandung ~118 km, kutub 0°..180° ~20.000 km;
    `test_create_laporan_jarak_terisi` — submit laporan dekat ruang publik → `jarak_browser_rp` terisi
    < 1 km, `jarak_exif_rp` `None` tanpa EXIF).
- [ ] **[BE-23]** Ambang batas 100 meter: salah satu/kedua jarak > 100 m atau EXIF tidak ada ->
      status `menunggu_verifikasi`; dalam ambang batas -> tayang. *(FEAT-013, FEAT-010)*
  - **Belum ada:** status saat ini selalu `menunggu_verifikasi` tanpa perhitungan apa pun.
  - **Catatan:** ambang di FE memakai `VITE_FAKE_GPS_THRESHOLD_M=50` (`.env.example` FE) sementara PRD menyebut
    100 m - **samakan satu nilai** dan catat di `docs/API.md` sebelum task ini dikerjakan.
  - **Verifikasi:** 4 skenario PRD bagian 8 (lokasi valid, lokasi jauh, foto tanpa EXIF, EXIF vs browser bertentangan).
- [ ] **[BE-24]** `GET /reports/{id}/status` (atau sertakan langsung di response submit). *(FEAT-010)*
  - **Parsial:** status sudah ikut di `GET /reports/{id}` dan response submit, tetapi endpoint itu publik
    dan tidak dibatasi pemilik -> lihat **BE-50** dan **BE-52**.
- [ ] **[BE-25]** `POST /reports/{id}/flag` - pengguna lain menandai laporan tayang yang tidak pantas. *(FEAT-011, FE-21)*
  - **Belum ada** endpoint maupun UI di FE.
- [ ] **[BE-26]** Rate-limiting `POST /reports` per user/IP. *(NFR-002)*
  - **Belum ada:** tidak ada `slowapi`/middleware limit di `requirements.txt` maupun `main.py`.
- [ ] **[BE-27]** Unit test: skenario lokasi valid, jauh, tanpa EXIF, EXIF bertentangan (PRD bagian 8).
  - **Belum ada** (lihat BE-13).
- [x] **[BE-49]** **(baru - hasil audit)** Endpoint upload foto `POST /api/v1/uploads` dengan `UploadFile`
      (multipart), memakai `app/core/file_upload.py` yang sudah siap, kembalikan `{ "url": "/uploads/laporan/xxx.jpg" }`;
      auth opsional mengikuti kebijakan laporan anonim; foto masuk ke `storage/laporan/`.
  - **FEAT:** FEAT-008 + NFR-002.
  - **Lokasi kode:** `app/api/v1/uploads.py`, terdaftar di `app/api/v1/api.py`.
  - **Keputusan:** Endpoint upload dapat diakses publik tanpa login agar pelapor anonim dapat mengunggah bukti fisik. Berkas disimpan di `settings.UPLOAD_DIR / "laporan" / <uuid.hex><ext>`. Validasi MIME whitelist (`image/jpeg`, `image/png`, `image/webp`), batas ukuran 5MB, dan validasi magic bytes.
  - **Verifikasi (2026-10-05):** Upload JPEG valid mengembalikan HTTP 201 dengan URL `/uploads/laporan/<hex>.jpg` dan dapat diakses publik via mount `/uploads`; upload file non-gambar `.txt` ditolak 400; upload file > 5MB ditolak 400; upload ekstensi jpg berpalsu teks ditolak 400. Integrasi FE-16 di `FormLaporPage` berhasil mengirim berkas dan foto tampil di halaman moderasi admin.
- [ ] **[BE-50]** **(baru - hasil audit)** `GET /api/v1/reports/mine` (token wajib) - laporan milik pemanggil
      untuk halaman "Laporan Saya".
  - **FEAT:** FEAT-013 PRD (Riwayat "Laporan Saya"). **Dibutuhkan:** `getUserReports` di
    `apps/web/src/services/laporanService.js` kini memanggil `GET /reports` tanpa filter pemilik,
    jadi "Laporan Saya" berpotensi menampilkan laporan orang lain.
  - **Langkah:** service `get_reports()` di `app/services/laporan.py:76` **sudah menerima `user_id`** -
    tambahkan param di router (atau buat path terpisah `/reports/mine`), wajib `Depends(get_current_active_user)`.
  - **Verifikasi:** login 2 user, kirim laporan masing-masing, endpoint hanya mengembalikan milik pemanggil;
    tanpa token -> 401.

---

## B4. Moderation Service - Khusus Admin (FEAT-011)

- [ ] **[BE-28]** `GET /admin/reports?status=menunggu_verifikasi` - antrian tinjauan admin, proteksi role `admin`.
  - **Parsial:** fungsinya dipenuhi `GET /reports?status=` (`app/api/v1/laporan.py:39`) tetapi
    **tanpa `get_current_admin`** sehingga publik bisa membaca seluruh laporan -> task **BE-52**.
- [ ] **[BE-29]** `POST /admin/reports/{id}/approve` - ubah status jadi tayang.
  - **Parsial:** dipenuhi `PATCH /reports/{id}/status` (`app/api/v1/laporan.py:84`, sudah admin), tetapi
    `payload.status` berupa string bebas - tidak divalidasi ke kamus status -> task **BE-51**.
- [ ] **[BE-30]** `POST /admin/reports/{id}/reject` - status `ditolak`, wajib sertakan alasan.
  - **Parsial:** alasan hanya ditulis sebagai deskripsi timeline (`app/services/laporan.py:126`),
    **tidak disimpan di kolom laporan** sehingga tidak bisa ditampilkan ulang di daftar/FE -> task **BE-51**.
- [ ] **[BE-31]** `GET /admin/reports/flagged` - daftar laporan yang di-flag pengguna, terpisah dari antrian.
  - **Belum ada** (bergantung BE-25).
- [ ] **[BE-51]** **(baru - hasil audit)** Validasi enum status + alasan penolakan tersimpan:
      (a) `PATCH /reports/{id}/status` hanya menerima kamus kanonik, selain itu -> 422/400;
      (b) migration kolom `alasan_penolakan` (nullable) di `laporan`, **wajib diisi** bila status `ditolak`;
      (c) field `alasan_penolakan` ikut di response detail supaya FE bisa menampilkannya.
  - **FEAT:** FEAT-011. **Dibutuhkan:** `apps/web/.../DetailModerasiPage.jsx` (tombol Setujui/Tolak + alasan, FE-25).
  - **Verifikasi:** PATCH dengan status `dibuang_sana` -> 422; reject tanpa alasan -> 400;
    alasan muncul di `GET /reports/{id}` untuk pemilik/admin.
- [ ] **[BE-52]** **(baru - hasil audit)** Rapikan jalur moderasi & tutup kebocoran baca laporan:
      (a) buat `GET /admin/reports?status=&flagged=` terproteksi `get_current_admin` (menggantikan pemakaian
      `GET /reports` untuk antrian); (b) `GET /reports` publik hanya mengembalikan laporan tayang;
      (c) `GET /reports/{id}` hanya untuk pemilik laporan atau admin.
  - **FEAT:** FEAT-011 + FEAT-010. **Memperbaiki** BE-28 dan sebagian BE-35.
  - **Verifikasi:** tanpa token `GET /reports` hanya berisi laporan tayang; `GET /reports/{id}` milik orang lain -> 403/404;
    token admin tetap bisa membuka semua.

---

## B5. Data Master Service - Khusus Admin (FEAT-012)

- [ ] **[BE-32]** `GET /admin/public-spaces` - list lengkap data master untuk Panel Admin (termasuk penanda
      field hasil edit manual).
  - **Belum ada:** yang ada hanya `GET /public-spaces` publik. Halaman FE
    `/dashboard/data-master` kini membaca lewat endpoint publik itu.
- [ ] **[BE-33]** `PATCH /admin/public-spaces/{id}` - edit manual per field; setiap field yang diubah
      otomatis ditandai "diedit manual" (dipakai logika merge di BE-16).
  - **Belum ada.** Tombol "Edit Master" di FE masih `alert()`.
  - **Prasyarat:** BE-05 (penanda field-level merge).
- [x] **[BE-53]** **(baru - hasil audit)** CRUD fasilitas untuk admin:
      `GET/POST /admin/facilities`, `PATCH /admin/facilities/{id}`, `DELETE /admin/facilities/{id}`,
      `POST /admin/facilities/import` (semua `get_current_admin`).
  - **FEAT:** FEAT-005 + FEAT-012. **Keputusan path:** namespace `/api/v1/admin/facilities`
    (bukan nested `POST /public-spaces/{id}/fasilitas`) — alasan & tabel di
    `features/data-master-service.md` §2.2.
  - **FE:** `apps/web/src/features/data-master/pages/KelolaFasilitasPage.jsx` sudah terhubung
    (`services/fasilitasService.js`), termasuk impor CSV dari halaman.
  - **Verifikasi:** skrip black-box dengan `TestClient` + DB MySQL nyata: 29 pemeriksaan lolos
    (401/403 non-admin, 201 buat, 400 status salah, 404 induk tak ada, patch/hapus, 409 saat ada
    laporan, impor CSV parsial, terbaca lagi di `GET /public-spaces/{id}` dan masuk opsi
    `GET /facilities`); `npm run build` sukses.

---

## B6. Admin Auth & Pemisahan Akses (FEAT-014)

- [ ] **[BE-34]** `POST /admin/login` - terpisah dari login publik, validasi role `admin` sebelum issue token.
  - **Parsial:** `POST /auth/login` (`app/api/v1/auth.py:14`) dipakai semua role dan **tidak memvalidasi role
    saat issue token** - proteksi baru terjadi di `get_current_admin`. Untuk FE ini cukup, tetapi ketentuan
    "login terpisah" di PRD belum terpenuhi: perlu pengecekan role di login admin (atau catatkan deviasi di PRD).
  - **Verifikasi:** login dengan akun `warga` lewat endpoint admin -> 403; akun admin -> 200.
- [ ] **[BE-35]** Middleware/dependency proteksi khusus role `admin` di seluruh endpoint `/admin/*`,
      endpoint publik tidak bisa diakses ambigu dengan token admin.
  - **Parsial:** `get_current_admin` dipakai di `/users*`, `/reports/stats/*`, `PATCH /reports/{id}/status`.
    **Masih bocor:** `GET /reports`, `GET /reports/{id}`, `POST /categories` -> task **BE-52** dan **BE-54**.
  - **Verifikasi:** audit tiap endpoint: daftar di `docs/04-api-endpoints.md` cocok dengan kolom Auth di kode.
- [x] **[BE-36]** Konfigurasi CORS mengizinkan domain FE Admin spesifik, terpisah dari FE Publik.
  - **Lokasi kode:** `app/main.py:24` (`FRONTEND_PUBLIC_URL` + `FRONTEND_ADMIN_URL`).
  - **Catatan:** nilai kedua origin menunggu FE Admin benar-benar dipisah (lihat BE-07).
- [ ] **[BE-54]** **(baru - hasil audit)** Tutup sisa kebocoran non-admin: `POST /api/v1/categories`
      wajib `Depends(get_current_admin)`, lalu audit seluruh router terhadap daftar endpoint publik vs admin
      dan catat hasilnya di `docs/04-api-endpoints.md`.
  - **FEAT:** FEAT-014. **Memperbaiki** BE-35.
  - **Verifikasi:** `POST /categories` tanpa token -> 403, dengan token admin -> 201; tidak ada endpoint tulis
    yang bisa dipanggil publik.
- [ ] **[BE-55]** **(baru - hasil audit)** Refresh / logout token (rotasi atau blacklist sederhana),
      supaya sesi tidak hidup 7 hari tanpa kendali saat perangkat hilang/keluar.
  - **NFR:** NFR-002. **Dibutuhkan:** alur keluar di FE admin dan warga.
  - **Langkah:** minimal satu dari: tabel `token_blacklist` (jti + expiry) + endpoint `POST /auth/logout`;
    atau refresh token pendek untuk akses panjang. Catat keputusannya di `docs/API.md`.
  - **Verifikasi:** logout -> token lama ditolak di endpoint terproteksi; token yang belum kedaluwarsa tetap
    berfungsi sebelum logout.

---

## B7. Testing Backend

- [ ] **[BE-37]** Unit test (pytest) menyeluruh: Public Space, Report, Moderation, Data Master, Auth.
- [ ] **[BE-38]** **Black-box testing**: uji tiap endpoint dari input-output yang diharapkan tanpa melihat kode,
      mencakup skenario normal dan edge case (input kosong, koordinat tidak valid, file bukan gambar).
- [ ] **[BE-39]** **Testing API dengan Postman**: collection seluruh endpoint (publik & admin) beserta
      assertion status code & struktur response, dipakai untuk regression testing.
- [ ] **[BE-40]** **User concurrent testing**: simulasi banyak pengguna di endpoint pencarian & submit laporan
      (Locust/JMeter/k6) - pastikan tidak ada race condition pada status laporan & merge data master.
- [ ] **[BE-41]** Uji performa query radius search dengan volume data skala penuh (ribuan titik). *(NFR-001)*
- **Status kelima task: belum ada sama sekali** - `backend/tests/` tidak ada dan file test masuk `.gitignore`.
  Panduan pembuatan ulang: `docs/06-testing-strategy.md` (bagian 3).
  Gerbang: `..\.venv\Scripts\python.exe -m pytest tests\unit -q` dari `backend/` harus 0 gagal.

---

## B8. Deployment Backend

- [ ] **[BE-42]** Setup server (VPS/cloud), install dependency Python, konfigurasi Uvicorn + reverse proxy (Nginx).
- [ ] **[BE-43]** Setup MySQL production, jalankan migration Alembic.
- [ ] **[BE-44]** Deploy ETL Worker sebagai proses terpisah (systemd/cron/scheduler) - tidak menyatu dengan
      proses API utama (lihat bagian 5 PRD).
- [ ] **[BE-45]** Setup folder local storage foto di production dengan permission benar + backup berkala.
- **Status keempat task: belum ada** - `docker-compose.yml` di root hanya berisi service MySQL; belum ada
  Dockerfile aplikasi, Nginx, systemd unit, maupun skrip backup.

---

## B9. Konten Situs (baru)

- [ ] **[BE-56]** **(baru - hasil audit)** Pindahkan konten beranda/tentang dari hardcode ke database:
      (a) tabel + seed untuk `testimonials` dan `hero-slides`; (b) `GET /statistics/testimonials` dan
      `GET /statistics/hero-slides` membaca dari tabel; (c) endpoint CRUD admin untuk mengelolanya;
      (d) perbaiki karakter emoji rusak (mojibake) di response testimonials.
  - **Dibutuhkan:** `apps/web/src/features/ruang-publik/pages/HomePage.jsx` dan `TentangPage.jsx`
    (kini memakai mock fallback), `app/api/v1/statistics.py:33` dan `:44` (isi hardcode).
  - **Verifikasi:** response valid UTF-8 saat dirender FE; mengubah testimonial lewat API langsung terlihat di beranda.

---

## Peta Kebutuhan FE -> Task Backend

Dipakai saat FE minta endpoint; cek daftar ini dulu sebelum menambah task baru.

| Halaman / fitur FE | Endpoint yang ditunggu | Task |
|---|---|---|
| `FormLaporPage` (foto wajib) | `POST /uploads` | BE-49 |
| `RiwayatLaporanPage` ("Laporan Saya") | `GET /reports/mine` | BE-50 |
| `DetailRuangPublikPage` (riwayat laporan + galeri) | `GET /public-spaces/{id}/reports` yang benar, gabungan foto | BE-47, BE-48 |
| `DetailModerasiPage` (Setujui/Tolak + alasan) | enum status + `alasan_penolakan` | BE-51 |
| `AntrianModerasiPage` (antrian + daftar flagged) | `GET /admin/reports`, `/admin/reports/flagged` | BE-52, BE-31 |
| `DataMasterPage` (Edit Master, Impor Satu Data, Riwayat sinkronisasi) | `PATCH /admin/public-spaces/{id}`, `POST`/`GET /admin/sync-data` | BE-33, BE-18, BE-19 |
| `KelolaFasilitasPage` | CRUD fasilitas admin | BE-53 |
| Form lapor (validasi anti fake-GPS) | kolom lokasi + EXIF + ambang batas | BE-46, BE-21, BE-22, BE-23 |
| Flag laporan tayang (belum ada UI di FE) | `POST /reports/{id}/flag`, `GET /admin/reports/flagged` | BE-25, BE-31 |
| Halaman keluar / ganti perangkat | logout / refresh token | BE-55 |

**Catatan FE (bukan tugas backend):** `route-config.js` menunjuk `EditRuangPublikPage.jsx` dan
`NotFoundPage.jsx` yang filenya belum ada; UI flag (FE-21), galeri (FE-14), riwayat per ruang publik (FE-20)
dan routing OSRM (FE-15, kini memakai link Google Maps) juga belum terpasang.

---

## Urutan Pengerjaan yang Disarankan

1. **BE-46** (migration kolom lokasi) + **BE-47** (fix filter tayang) + **BE-54** (tutup kebocoran) - kecil,
   memperbaiki data/keamanan yang sudah bocor sekarang.
2. **BE-49** (upload foto) + **BE-50** (laporan saya) -> menyekat FE-16 dan FE-20.
3. **BE-51** + **BE-52** (moderasi rapi) -> FE-24, FE-25, FE-26.
4. **BE-32**, **BE-33**, **BE-53** (data master) -> halaman admin FE; sejalan dengan **BE-14 s/d BE-19** (ETL) yang tidak menahan FE.
   (BE-05 penanda field-level sudah beres, jadi BE-33 tinggal memanggil `mark_fields_edited()`.)
5. **BE-21**, **BE-22**, **BE-23** (validasi lokasi) setelah BE-46 beres.
6. **BE-25**, **BE-31** (flag), **BE-55** (logout), **BE-56** (konten situs).
7. Testing **BE-13**, **BE-27**, **BE-37 s/d BE-41** - dikerjakan tiap kali satu modul di atas selesai,
   jangan ditunda ke akhir.
8. Deployment **BE-42 s/d BE-45** terakhir, sebelum FE production build (FE-32, FE-33).

---

## Definition of Done (Backend)

- [ ] Kotak `[x]` di dokumen ini sama dengan kenyataan di kode dan di `docs/04-api-endpoints.md`.
- [ ] Tidak ada endpoint aktif yang tidak terdokumentasi, dan tidak ada baris di `04-api-endpoints.md`
      yang sudah tidak berlaku.
- [ ] Semua FEAT-001 s/d FEAT-014 dan NFR-001 s/d NFR-004 punya task tercentang.
- [ ] Black-box testing, Postman collection, dan concurrent testing (B7) pernah dijalankan minimal sekali
      dengan hasil terdokumentasi.
- [ ] UAT dan kuesioner TAM sesuai PRD bagian 8 selesai.
- [ ] Setiap task yang berubah jadi `[x]` punya entri changelog bertanggal di
      [`CHANGELOG.md`](CHANGELOG.md) (satu baris, sesuai aturan di bagian Cara Baca).
