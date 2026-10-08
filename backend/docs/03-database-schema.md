# 03 — Skema Database MySQL

Sumber: `docs/schema.sql` + model SQLAlchemy di `backend/app/models/` (kode = kebenaran utama) + migrasi di `backend/alembic/versions/`. Database: **`raku_db`** (container Docker `raku-db`).

---

## 1. Sembilan Tabel & Relasi

```
categories ──┐
             ├──< ruang_publik ──┬──< fasilitas ──┐
 users ───────┴──────┬───────────┤                │
                     │           └──< ruang_publik_foto
                     ├──< laporan >────────────────┘
                     │       └──< laporan_timeline
                     │       └──< laporan_flag
 etl_run (berdiri sendiri, log run ETL)
```

| Tabel | Model | Relasi |
|---|---|---|
| `categories` | `models/category.py` | Di-referensikan `ruang_publik.kategori_id` |
| `users` | `models/user.py` | Di-referensikan `laporan.user_id` (opsional) & `laporan_flag.user_id` (wajib) |
| `ruang_publik` | `models/ruang_publik.py` | FK `kategori_id → categories.id`; induk `fasilitas`, `laporan` & `ruang_publik_foto` (cascade delete) |
| `ruang_publik_foto` | `models/ruang_publik_foto.py` | FK `ruang_publik_id → ruang_publik.id` (wajib); foto resmi galeri (BE-48) |
| `fasilitas` | `models/fasilitas.py` | FK `ruang_publik_id → ruang_publik.id` (wajib); induk `laporan` |
| `laporan` | `models/laporan.py` | FK `user_id` (opsional), `ruang_publik_id` (wajib), `fasilitas_id` (opsional) |
| `laporan_timeline` | `models/laporan_timeline.py` | FK `laporan_id → laporan.id`, cascade delete |
| `laporan_flag` | `models/laporan_flag.py` | FK `laporan_id → laporan.id` + `user_id → users.id`, unique `(laporan_id, user_id)`, cascade delete (BE-25) |
| `etl_run` | `models/etl_run.py` | Tanpa FK; satu baris per run ETL (BE-19), dibaca `GET /admin/sync-data` |

---

## 2. Detail Kolom

### `categories`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(50) PK | **Bukan auto-increment** — diisi manual (mis. `taman`, `jalur-hijau`) |
| `label` | VARCHAR(100) NOT NULL | Nama tampil |
| `icon_name` | VARCHAR(50) NULL | Masih `NULL` semua di seed; kolom sudah tersedia |

### `users`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `name` | VARCHAR(255) NOT NULL | |
| `email` | VARCHAR(255) NOT NULL | Diseragamkan **lowercase** di titik masuk (Pydantic validator) |
| `password_hash` | VARCHAR(255) | bcrypt — tidak pernah plaintext |
| `role` | VARCHAR(20) default `'warga'` | Nilai: `warga`, `admin` |
| `is_active` | BOOLEAN NOT NULL default TRUE | Migrasi `b7e2c1049a3f_add_user_is_active.py`; sudah sinkron dengan `docs/schema.sql` (2026-10-06, BE-04) |
| `created_at` / `updated_at` | DATETIME | `utcnow` |

### `ruang_publik`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(50) PK | Mis. `rth-1a407d88182a` |
| `nama` | VARCHAR(255) NOT NULL | |
| `kategori_id` | VARCHAR(50) FK → categories | |
| `wilayah` | VARCHAR(100) | Mis. `Jakarta Selatan` (dinormalisasi ETL dari `KOTA ADM. ...`) |
| `alamat` | TEXT | |
| `latitude` / `longitude` | DECIMAL(10,8) / DECIMAL(11,8) NULL | **Sudah terisi semua** (1200 baris di `data/processed/ruang_publik.csv`) |
| `deskripsi` | TEXT NULL | Banyak yang kosong → tampil "data tidak tersedia" (FEAT-006) |
| `jam_operasional`, `tiket_masuk`, `akses_disabilitas`, `ramah_hewan` | VARCHAR(255) NULL | Atribut tidak seragam antar dataset (PRD §6.3) |
| `verified` | BOOLEAN default FALSE | |
| `status_general` | VARCHAR(50) NULL | |
| `image_url` | TEXT NULL | Foto resmi lama; **di-backfill jadi baris pertama `ruang_publik_foto`** (migrasi `tambah_tabel_ruang_publik_foto`), tetap ditampilkan bila belum punya baris foto (lihat §5) |
| `field_source` | JSON NULL | Penanda field hasil **edit manual admin**: `{"deskripsi": "2026-10-03T14:44:38"}`. **`NULL` = belum pernah diedit manual**, aman ditimpa ETL (FEAT-012, task BE-05). Ditulis lewat `mark_fields_edited()` di `app/services/ruang_publik.py`, ikut di response detail. |
| `kecamatan`, `kelurahan` | VARCHAR(100) NULL | Dipakai **kunci natural** saat merge ETL (BE-16, migrasi `d7b19b0b82cc`); ikut file sumber & response detail, diisi/backfill oleh seed |

### `fasilitas`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(50) PK | |
| `ruang_publik_id` | VARCHAR(50) FK wajib | |
| `nama` | VARCHAR(255) NOT NULL | Mis. `Toilet Umum` — dipakai filter FE (`GET /facilities` = aggregate unik) |
| `kategori` | VARCHAR(100) | Mis. `Sanitasi` |
| `status` | VARCHAR(50) default `'baik'` | Kamus kondisi: **`baik` · `perlu_perhatian` · `rusak`** |
| `deskripsi` | TEXT NULL | |

Isi tabel: `app/etl/seed_fasilitas.py` (katalog `data/processed/fasilitas.csv`, baris berprefix `seed-`, idempoten) + buatan admin lewat `/api/v1/admin/facilities` atau impor CSV. Sumber Satu Data tidak punya kolom fasilitas.

**Keputusan relasi (BE-04, 2026-10-06):** fasilitas memakai **1-FK** `ruang_publik_id`, bukan tabel join many-to-many seperti jobdesk. Setiap baris = atribut milik satu induk (katalog 12 nama dipakai filter FEAT-005 lewat query aggregate), tidak ada entitas fasilitas global lintas tempat; pivot hanya menambah migrasi data dan merombak filter/CRUD/seed/response beserta kontrak FE. Jangan diubah tanpa koordinasi FE.

### `ruang_publik_foto`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID hex |
| `ruang_publik_id` | VARCHAR(50) FK wajib, index | Induk `ruang_publik`, cascade delete lewat ORM |
| `foto_url` | TEXT NOT NULL | Path relatif `/uploads/ruang-publik/<hex>.jpg` |
| `created_at` / `updated_at` | DATETIME | `created_at` menentukan urutan galeri resmi (terlama dulu) |

Isi tabel: migrasi `tambah_tabel_ruang_publik_foto` (backfill dari `image_url`) + admin lewat
`GET/POST/DELETE /api/v1/admin/public-spaces/{id}/photos` (BE-48). Hanya **foto resmi** — foto laporan
tayang tidak disimpan di sini, di-merge langsung dari tabel `laporan` oleh `gabung_foto`.

### `laporan`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID |
| `user_id` | VARCHAR(36) FK NULL | **`NULL` = laporan anonim** |
| `ruang_publik_id` | VARCHAR(50) FK wajib | Laporan selalu terikat titik lokasi |
| `fasilitas_id` | VARCHAR(50) FK NULL | |
| `jenis_masalah` | VARCHAR(100) | Kategori masalah pilihan pengguna |
| `deskripsi` | TEXT NOT NULL | |
| `mode_identitas` | VARCHAR(50) default `'tampilkan_nama'` | Nilai: **`anonim`** / **`tampilkan_nama`** (FEAT-009) |
| `nama_pelapor` | VARCHAR(255) NULL | **Diisi server dari user login** saat mode `tampilkan_nama` — payload klien diabaikan (anti-spoofing) |
| `status` | VARCHAR(50) default **`'menunggu_verifikasi'`** | Lihat §4 |
| `alasan_penolakan` | TEXT NULL | **Diisi server** saat admin menolak laporan (BE-30); ikut response agar FE bisa menampilkannya |
| `foto_url` | TEXT NULL | URL path foto bukti tersimpan (`/uploads/laporan/<hex>.jpg`) (BE-49, FEAT-008) |
| `lat_user` | DOUBLE NULL | Latitude posisi perangkat saat submit laporan (BE-46, FE-17) |
| `long_user` | DOUBLE NULL | Longitude posisi perangkat saat submit laporan (BE-46, FE-17) |
| `lat_exif` | DOUBLE NULL | Latitude hasil ekstraksi metadata EXIF foto (BE-46, diisi server di BE-21) |
| `long_exif` | DOUBLE NULL | Longitude hasil ekstraksi metadata EXIF foto (BE-46, diisi server di BE-21) |
| `created_at` / `updated_at` | DATETIME | `updated_at` auto-update saat row berubah |

### `laporan_timeline`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `laporan_id` | VARCHAR(50) FK | |
| `status` | VARCHAR(50) NOT NULL | Nilai = kamus status laporan §4 |
| `title` | VARCHAR(255) | Mis. `Laporan dikirim` |
| `description` | TEXT NULL | Untuk alasan penolakan (FEAT-010) |
| `created_at` | DATETIME | Menjadi "waktu pembaruan" di UI timeline |

### `laporan_flag`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID |
| `laporan_id` | VARCHAR(50) FK | Ke `laporan.id`, index; cascade delete |
| `user_id` | VARCHAR(36) FK | Ke `users.id`, index; **wajib** (flag butuh akun, BE-25) |
| `created_at` | DATETIME | Waktu flag |
| *unique* | `(laporan_id, user_id)` | `uq_laporan_flag_pengguna` — satu pengguna satu flag per laporan |

### `etl_run`
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `pemicu` | VARCHAR(20) NOT NULL | `manual` (BE-18), `terjadwal` (BE-17), `sekali` (`--once`) |
| `status` | VARCHAR(20) NOT NULL | `berjalan`, `sukses`, `gagal` |
| `mulai` | DATETIME NOT NULL | Waktu UTC tanpa zona (ditandai UTC di schema API) |
| `selesai` | DATETIME NULL | Masih `NULL` selama `berjalan` |
| `tahap_gagal` | VARCHAR(50) NULL | Nama tahap yang gagal, atau `terputus` bila proses mati |
| `hitung` | JSON NULL | Angka `seed_db` dari baris `ETL_HITUNG` (`baru`, `diupdate`, `tanpa_perubahan`, dll); terisi bila tahap `seed_db` sukses |
| `tahap` | JSON NULL | Daftar tahap: nama, status, detik, 100 baris log terakhir |

---

## 3. Migrasi Alembic

| Revisi | Isi |
|---|---|
| `34fc1fc4d761_initial_schema` | Seluruh tabel awal |
| `b7e2c1049a3f_add_user_is_active` | Menambah `users.is_active` |
| `c1f4a9d2e073_add_ruang_publik_field_source` | Menambah `ruang_publik.field_source` (JSON, nullable) — penanda edit manual admin (BE-05) |
| `d7b19b0b82cc_tambah_kecamatan_kelurahan_ke_ruang_` | Menambah `ruang_publik.kecamatan` & `kelurahan` (VARCHAR(100), nullable) — kunci natural untuk merge ETL (BE-16) |
| `tambah_tabel_etl_run` | Menambah tabel `etl_run` - log hasil run ETL per tahap (BE-19) |
| `37c407708e27_tambah_kolom_lokasi_laporan` | Menambah `laporan.lat_user`, `long_user`, `lat_exif`, `long_exif` (DOUBLE, nullable), koordinat pengguna & EXIF (BE-46) |
| `hapus_lokasi_spesifik_fasilitas` | Menghapus `fasilitas.lokasi_spesifik` (penyelarasan model) |
| `tambah_tabel_ruang_publik_foto` | Menambah tabel `ruang_publik_foto` + backfill `image_url` jadi baris foto pertama (BE-48) |
| `74d05cd21291_tambah_kolom_jarak_laporan` | Menambah `laporan.jarak_browser_rp`, `jarak_exif_rp` (DOUBLE, nullable), hasil Haversine ke ruang publik (BE-22) |
| `3996fdaf0f5f_tambah_kolom_lokasi_pilihan_laporan` | Menambah `laporan.lat_lokasi_pilihan`, `long_lokasi_pilihan` (DOUBLE, nullable), titik presisi fasilitas pilihan warga |
| `fe1d83da4fca_tambah_tabel_laporan_flag` | Menambah tabel `laporan_flag` + unique `(laporan_id, user_id)` — flag pengguna lain atas laporan tayang (BE-25) |
| `a1b2c3d4e5f6_tambah_alasan_penolakan_laporan` | Menambah `laporan.alasan_penolakan` (TEXT, nullable) — alasan penolakan tersimpan, bukan hanya di timeline (BE-30) |

Aturan kerja:
1. Ubah model → `python -m alembic revision --autogenerate -m "pesan jelas"` → periksa file hasilnya → `python -m alembic upgrade head`.
2. **Jangan edit** revisi yang sudah terpakai (di dev/produk lain) — buat revisi baru.
3. Cek status: `python -m alembic current` (harus `head`) dan `python -m alembic history`.
4. `docs/schema.sql` = referensi ringkas awam — **tidak otomatis ikut berubah**; perbarui manual bila skema berubah supaya tidak menyesatkan.

---

## 4. Enum Status LAPORAN (kanonik — jangan dilepas)

Satu daftar ini dipakai lintas backend & frontend. **Mengubah nilai key = merusak FE** (label tampilan di `apps/web/src/components/StatusBadge.jsx`):

```
menunggu_verifikasi  →  diverifikasi  →  dalam_penanganan  →  selesai
        └──────────────────────────────────────→ ditolak  (+ alasan via timeline.description)
```

- Default saat insert: `menunggu_verifikasi` (di `models/laporan.py`).
- Timeline dibuat otomatis: saat create (`Laporan dikirim`) dan setiap `PATCH /reports/{id}/status`.
- Konsumsi FE: filter tab `Laporan Saya`, badge, stepper detail, aksi moderasi (`dalam_penanganan`, `selesai`, `ditolak`).

**Bug lama, sudah diperbaiki (BE-47):** filter `services/laporan.py::get_reports_by_ruang_publik` pernah memakai
`disetujui` / `tayang_otomatis` — nilai yang tidak pernah dibuat sistem mana pun → selalu kosong. Sekarang
memakai konstanta `STATUS_TAYANG` (`diverifikasi`, `dalam_penanganan`, `selesai`) di `schemas/laporan.py`;
regresinya dijaga `tests/unit/test_public_space_reports.py`. Galeri foto (BE-48) memakai konstanta yang sama.

Kamus **kondisi fasilitas** (`fasilitas.status`) terpisah: `baik` · `perlu_perhatian` · `rusak` (jangan tertukar dengan status laporan).

---

## 5. Catatan Field-Level Penting untuk Kontrak FE

| Field | Perilaku | Alasan |
|---|---|---|
| `ruang_publik.image_url` (1 kolom) | Response detail `GET /public-spaces/{id}` mengembalikan **`foto: list[str]`** hasil `gabung_foto` (BE-48): baris `ruang_publik_foto` + `image_url` bila belum punya baris + `foto_url` laporan tayang | Kontrak FE tetap list; isi list bertambah saat foto resmi/laporan bertambah (lihat `api/v1/ruang_publik.py`) |
| `jarak_km` | **Dihitung di Python/SQL**, tidak ada kolomnya | `null` bila `lat`/`long` tidak dikirim |
| `laporan.ruang_publik_nama`, `wilayah`, `fasilitas_nama` | Properti turunan relasi (eager load `joinedload`) | Memperkaya response tanpa join manual di FE |
| `user` (di `LaporanDetailResponse`) | Relasi user ikut ter-serialize untuk detail | Bisa `null` untuk laporan anonim |

---

## 6. Strategi Field-Level Merge (FEAT-007 & FEAT-012)

Masalah: data resmi di-ETL ulang berkala, tetapi **edit manual admin tidak boleh hilang** (PRD FEAT-012).

**Mekanisme yang sudah ada di kode:**

1. `seed_db.py::seed_ruang_publik` (BE-16) → baris sumber dicocokkan id → natural key `nama|kecamatan|kelurahan` → nama. Bila cocok, **hanya kolom `ETL_OWNED` yang disegarkan**, dan hanya bila belum tercatat di `field_source`; nilai sumber NULL dilewati. Baris yang tidak cocok di-INSERT.
2. `seed_categories` → idem, hanya insert ID belum ada.

**Konsekuensi & aturan lanjutan:**

- **Jangan** membuat seed yang menimpa seluruh kolom (UPDATE overwrite) — itu akan menghapus edit admin.
- Pemetaan kolom **sudah ditulis** (BE-16): kelompok `ETL_OWNED` vs `KOLOM_ADMIN` ada sebagai konstanta di `app/etl/seed_db.py` dan di tabel `features/data-master-service.md` §4. Kolom tabel baru wajib masuk salah satu kelompok dulu, seed berhenti dengan pesan error bila belum (`_cek_pemetaan`).
- Penanda field-level **sudah ada** (BE-05): kolom `ruang_publik.field_source` diisi oleh `mark_fields_edited()`
  tiap kali admin menyunting suatu kolom (endpoint edit admin = task BE-33). ETL
  **lewati kolom yang sudah tercatat di `field_source`**, tanpa perlu mengandalkan flag baris.
- Foto pengguna (FEAT-007) tersimpan **terpisah dari kolom `image_url` resmi**: tabel `ruang_publik_foto`
  (BE-48) hanya menampung foto resmi, relasinya ke `ruang_publik_id` sehingga penghapusan/penimpaan data
  resmi tidak ikut menghapus foto laporan — foto laporan memang tidak ikut terhapus karena tidak pernah
  masuk tabel ini (di-merge dari `laporan` saat request).
- Galeri foto laporan **sudah ada** (BE-48): `GET /public-spaces/{id}` menggabungkan foto resmi + laporan
  `STATUS_TAYANG` lewat `gabung_foto` — lihat `features/public-space-service.md` §FEAT-007.

---

## 7. Verifikasi Skema

```bash
cd "d:\Ruka Jakarta"
docker compose up -d
# tunggu container healthy (~30 detik saat volume baru)

cd backend
..\.venv\Scripts\python.exe -m alembic current   # harus: head (fe1d83da4fca — tambah_tabel_laporan_flag)
..\.venv\Scripts\python.exe -m alembic upgrade head   # bila belum
```

Cek data: `GET http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3` harus mengembalikan array berisi entri (bukan `[]`) — membuktikan tabel terisi dan koordinat hidup.
