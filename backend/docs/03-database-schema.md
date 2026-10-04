# 03 — Skema Database MySQL

Sumber: `docs/schema.sql` + model SQLAlchemy di `backend/app/models/` (kode = kebenaran utama) + migrasi di `backend/alembic/versions/`. Database: **`raku_db`** (container Docker `raku-db`).

---

## 1. Enam Tabel & Relasi

```
categories ──┐
             ├──< ruang_publik ──┬──< fasilitas ──┐
users ───────┴──────┬───────────┘                │
                    └──< laporan >────────────────┘
                            └──< laporan_timeline
```

| Tabel | Model | Relasi |
|---|---|---|
| `categories` | `models/category.py` | Di-referensikan `ruang_publik.kategori_id` |
| `users` | `models/user.py` | Di-referensikan `laporan.user_id` (opsional) |
| `ruang_publik` | `models/ruang_publik.py` | FK `kategori_id → categories.id`; induk `fasilitas` & `laporan` (cascade delete) |
| `fasilitas` | `models/fasilitas.py` | FK `ruang_publik_id → ruang_publik.id` (wajib); induk `laporan` |
| `laporan` | `models/laporan.py` | FK `user_id` (opsional), `ruang_publik_id` (wajib), `fasilitas_id` (opsional) |
| `laporan_timeline` | `models/laporan_timeline.py` | FK `laporan_id → laporan.id`, cascade delete |

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
| `is_active` | BOOLEAN | **Ada di migrasi** `b7e2c1049a3f_add_user_is_active.py` (tidak ada di `schema.sql` lama — kode menang) |
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
| `image_url` | TEXT NULL | **Satu foto** — dibungkus jadi list `foto[]` di response detail (lihat §5) |
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
| `lokasi_spesifik` | VARCHAR(255) NULL | |
| `deskripsi` | TEXT NULL | |

Isi tabel: `app/etl/seed_fasilitas.py` (data contoh berprefix `seed-`, idempoten) + buatan admin lewat `/api/v1/admin/facilities` atau impor CSV. Sumber Satu Data tidak punya kolom fasilitas.

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
| `foto_url` | TEXT NULL | **Belum pernah terisi** — endpoint upload belum ada (FEAT-008 gap) |
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

---

## 3. Migrasi Alembic

| Revisi | Isi |
|---|---|
| `34fc1fc4d761_initial_schema` | Seluruh tabel awal |
| `b7e2c1049a3f_add_user_is_active` | Menambah `users.is_active` |
| `c1f4a9d2e073_add_ruang_publik_field_source` | Menambah `ruang_publik.field_source` (JSON, nullable) — penanda edit manual admin (BE-05) |
| `d7b19b0b82cc_tambah_kecamatan_kelurahan_ke_ruang_` | Menambah `ruang_publik.kecamatan` & `kelurahan` (VARCHAR(100), nullable) — kunci natural untuk merge ETL (BE-16) |

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

**Gap terverifikasi:** nilai `disetujui` / `tayang_otomatis` yang ditulis di `services/laporan.py::get_reports_by_ruang_publik` **tidak pernah dibuat oleh sistem mana pun** → filter itu selalu kosong. Perbaikannya ada di `features/moderation-service.md` (FEAT-010/011).

Kamus **kondisi fasilitas** (`fasilitas.status`) terpisah: `baik` · `perlu_perhatian` · `rusak` (jangan tertukar dengan status laporan).

---

## 5. Catatan Field-Level Penting untuk Kontrak FE

| Field | Perilaku | Alasan |
|---|---|---|
| `ruang_publik.image_url` (1 kolom) | Response detail `GET /public-spaces/{id}` mengembalikan **`foto: [image_url]` (list)** | Kontrak FE sudah list; saat foto bertambah, hanya isi list yang berubah (lihat `api/v1/ruang_publik.py`) |
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
- Foto pengguna (FEAT-007) tersimpan **terpisah dari kolom `image_url` resmi** — bila tabel galeri dibuat nanti, relasinya ke `ruang_publik_id` sehingga penghapusan/penimpaan data resmi tidak ikut menghapus foto.
- Saat ini galeri foto laporan belum ada (lihat gap di `features/public-space-service.md` §Galeri).

---

## 7. Verifikasi Skema

```bash
cd "d:\Ruka Jakarta"
docker compose up -d
# tunggu container healthy (~30 detik saat volume baru)

cd backend
..\.venv\Scripts\python.exe -m alembic current   # harus: head (d7b19b0b82cc)
..\.venv\Scripts\python.exe -m alembic upgrade head   # bila belum
```

Cek data: `GET http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3` harus mengembalikan array berisi entri (bukan `[]`) — membuktikan tabel terisi dan koordinat hidup.
