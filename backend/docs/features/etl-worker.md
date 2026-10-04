# features — ETL Worker (Sinkronisasi Satu Data Jakarta)

> **Scope file ini HANYA pipeline sinkronisasi data resmi Satu Data Jakarta** (PRD §5 alur data, §6.1, §6.3).
> Edit data master oleh admin → `data-master-service.md`; galeri foto → `public-space-service.md`.

Kode terkait (semua di `app/etl/`):
- `extract_satudata.py` — **tahap Extract (BE-14):** unduh dataset terbaru dari Satu Data Jakarta +
  layer koordinat Jakarta Satu Geoportal ke `data/raw/`
- `read_raw.py` — baca file mentah dari `data/raw/`
- `kategori.py` — master kategori (4 tipe) dipakai seed dan transform
- `kunci.py` — normalisasi `nama|kecamatan|kelurahan` dipakai transform (BE-15) dan load (BE-16),
  supaya kedua tahap menghitung kunci yang sama
- `transform_rth_raw.py` — **tahap Transform (BE-15):** 3 file extract + master 1200 →
  `ruang_publik_terbaru.csv` + `kandidat/ruang_publik_kandidat.csv` + `transform_laporan.json`
- `transform_rth.py` — varian transform legacy dari file `.xls`; bukan bagian pipeline utama
- `seed_db.py` — **tahap Load (BE-16):** muat `categories` + `ruang_publik` ke MySQL (`--file`,
  `--reset`, `--pakai-kandidat`); baris sudah ada dicocokkan id → natural key → nama, lalu hanya
  kolom `ETL_OWNED` yang disegarkan (aturan merge di `data-master-service.md` §4)
- `seed_fasilitas.py` — isi tabel `fasilitas` dengan data contoh per ruang publik (`--reset`); **bukan** bagian sinkron data resmi, karena sumber Satu Data tidak punya kolom fasilitas
- `seed_admin.py` — buat admin pertama (bukan bagian sinkron data; lihat `admin-auth.md` §3)

Data:
- **Hasil Extract (gitignored, bisa diunduh ulang kapan saja):**
  | File | Sumber | Isi |
  |---|---|---|
  | `satudata_rth.csv` | Satu Data `data-ruang-terbuka-hijau-rth` | 2545 baris, 7 kolom atribut, **tanpa koordinat** |
  | `satudata_rptra.csv` | Satu Data `jumlah-ruang-publik-terpadu-ramah-anak-rptra` | 648 baris, 2023–2024, punya `nama_rptra` |
  | `satudata_rptra_belum_diresmikan.csv` | Satu Data (link PRD) | 56 baris, 2016, per kelurahan, **tanpa nama & koordinat** |
  | `geoportal_rth_koordinat.csv` | ArcGIS `RTH_SKPD_DKI/RTH_SKPD_DKI_View` | 6512 baris x 18 kolom, kolom `X`/`Y` = lon/lat |
  | `geoportal_rptra_koordinat.csv` | ArcGIS `RPTRA_DKI_Jakarta` | 324 baris, `NAMA_RPTRA` + `X`/`Y` + alamat |

  Tiap CSV punya `<nama>.meta.json` (tanggal unduh, jumlah baris, kolom, tanggal rilis sumber).
- **Hasil Transform (BE-15):**
  | File | Isi |
  |---|---|
  | `ruang_publik_terbaru.csv` | 1200 baris, id & urutan identik master; hanya `latitude`/`longitude`/`tipe`/`kategori_id` disegarkan (1121 baris ketemu sumber) |
  | `kandidat/ruang_publik_kandidat.csv` | 687 baris baru, `verified=False`, **ditolak `seed_db`** tanpa `--pakai-kandidat` |
  | `transform_laporan.json` | buang per alasan, 79 baris master tanpa pasangan sumber, 1 koordinat luar rentang |
- **File lama:** `data/raw/rth_dki_coordinates.csv` dan `data-ruang-terbuka-hijau-(rth)-komponen-data.xls`
  tidak dibaca transform lagi, tetap sebagai arsip unduhan manual.
- Sumber seed (bawaan): `data/processed/ruang_publik_terbaru.csv` (hasil transform; ada → dipakai
  otomatis). Cadangan `data/processed/ruang_publik.csv` — 1200 baris, hasil pembersihan manual,
  **tidak pernah ditulis ulang**. Sumber lain lewat `seed_db --file <path>`
- Baris rusak (kolom bergeser, 334 baris) terpisah di `data/processed/ruang_publik_perlu_perbaikan.csv`, tidak di-seed
- Master kategori: `data/processed/categories.json` (+ `.csv`) — 4 tipe: taman-lingkungan, rptra, taman-interaktif, taman-kota

---

## Status Ringkas

| Aspek | Status |
|---|---|
| Extract dari portal (BE-14) | **Ada** — `python -m app.etl.extract_satudata`, 5 dataset, jalankan manual |
| Transform + filter 4 kategori (BE-15) | **Ada** — `python -m app.etl.transform_rth_raw`; baris baru keluar sebagai kandidat, tidak pernah masuk database sendirian |
| Pipeline mentah → processed → DB | **Ada & berjalan** (script manual) |
| Idempoten (aman diulang) | **Ya** — seed ulang kedua kalinya `0 diupdate` (inti FEAT-012) |
| Merge field-level (BE-16) | **Ya** — kolom `ETL_OWNED` disegarkan, kolom di `field_source` ditahan; pemetaan kolom di `data-master-service.md` §4 |
| Koordinat terisi | **Ya** — 1200/1200 baris `ruang_publik.csv` punya `latitude`/`longitude` |
| Kategori konsisten | **Ya** — kolom `tipe` → `kategori_id` lewat `kategori.py`; `kategori_id` lama (`taman`, `jalur-hijau`) dinormalisasi ulang saat transform |
| Penjadwalan otomatis (cron) | **Belum** — PRD §5 menyebut "cron job/scheduled task"; saat ini manual |
| Isi tabel `fasilitas` | **Data contoh** lewat `seed_fasilitas.py` — sumber resmi tidak punya kolom fasilitas |
| Endpoint trigger dari admin API | **Belum** — opsional, lihat `data-master-service.md` §2.3 |
| Pemetaan field lengkap vs sumber | Sebagian atribut (`deskripsi`, `jam_operasional`, dll.) tidak seragam → kolom nullable (PRD §6.3) |

---

## 1. Alur Data (sesuai PRD §5 + kode)

```
Satu Data Jakarta (API JSON: detail + get-table-data)   Jakarta Satu Geoportal (ArcGIS REST query)
  atribut: nama, alamat, jenis, wilayah                   koordinat: kolom X/Y (lon/lat), nama
        │                                                        │
        └──────────────────┬─────────────────────────────────────┘
                           ▼
[0] extract_satudata.py    unduh → data/raw/satudata_*.csv + geoportal_*.csv (+ .meta.json)
        │                  (retry otomatis; jumlah baris dicek ke total API)
        ▼
[1] read_raw.py            baca file mentah dari data/raw/
        ▼
[2] transform_rth_raw.py   normalisasi + filter:
        │                    - koordinat X/Y → float, dicek ke rentang DKI (hilang/salah = dibuang)
        │                    - buang baris di luar 4 kategori final, hapus duplikat by natural key
        │                    - segarkan lat/lng/tipe baris master yang ketemu di sumber
        ▼
   ruang_publik_terbaru.csv (1200 baris, id identik master)
   + kandidat/ruang_publik_kandidat.csv (687, belum direview)
   + categories.json + transform_laporan.json
        ▼
[3] seed_db.py             ke MySQL raku_db — insert baris baru + update field-level (BE-16)
        │                   sumber bawaan: ruang_publik_terbaru.csv (cadangan: ruang_publik.csv)
        │                   --file <path> memakai sumber lain, --reset mengganti total isi
        │                   file kandidat ditolak kecuali --pakai-kandidat
        ▼
   tabel categories (4 tipe) + ruang_publik
```

**Catatan tahap [0] vs [2]:** sumber transform kini hasil extract BE-14, bukan `rth_dki_coordinates.csv`.
Master 1200 tetap acuan: `ruang_publik_terbaru.csv` berisi baris yang sama (id identik), dan baris baru
hanya muncul di `kandidat/` yang tidak bisa di-seed tanpa persetujuan eksplisit.

**Bentuk kerja: worker terpisah** — script batch dijalankan manusia lewat shell, **bukan** proses di dalam server (alasan: `02-architecture.md` §3).

---

## 2. Cara Menjalankan (urut)

```powershell
cd "d:\Ruka Jakarta\backend"

# 0. extract: unduh dataset terbaru (butuh internet; aman diulang)
..\.venv\Scripts\python.exe -m app.etl.extract_satudata

# 1. pastikan DB hidup & migrasi head
docker compose up -d            # dari root repo; tunggu raku-db healthy
..\.venv\Scripts\python.exe -m alembic upgrade head

# 2. transform (baca data/raw hasil extract; keluar: ruang_publik_terbaru.csv + kandidat/ + laporan)
..\.venv\Scripts\python.exe -m app.etl.transform_rth_raw

# 3. seed / load (idempoten; sumber bawaan ruang_publik_terbaru.csv; jalankan lagi boleh)
..\.venv\Scripts\python.exe -m app.etl.seed_db

# 3b. isi fasilitas (data contoh; dilewati untuk lokasi yang sudah punya fasilitas)
..\.venv\Scripts\python.exe -m app.etl.seed_fasilitas

# 4. ganti total isi tabel (backup DB dulu!), atau seed file lain
..\.venv\Scripts\python.exe -m app.etl.seed_db --reset
..\.venv\Scripts\python.exe -m app.etl.seed_db --file ../data/processed/ruang_publik_lainnya.csv
```

Keluaran `seed_db`: nama file sumber, jumlah kategori & ruang publik **baru**, **diupdate**, dan tanpa perubahan + total, jumlah kolom yang ditahan penanda edit manual bila ada (plus baris yang cocok tanpa id), lalu baris per kategori.
Keluaran `seed_fasilitas`: jumlah fasilitas **baru** + total, lalu baris per kategori ruang publik; `--reset` menghapus hanya baris berprefix `seed-` (baris buatan admin lewat API/CSV tetap ada).
Keluaran `extract_satudata`: nama dataset, jumlah baris & kolom, tanggal rilis sumber (bila ada), nama file di `data/raw/`; dataset gagal tidak menghentikan yang lain, dan membuat keluaran exit code 1.
Keluaran `transform_rth_raw`: jumlah sumber tersimpan, jumlah buang per alasan, jumlah baris master yang disegarkan/tanpa pasangan, jumlah kandidat; daftar lengkap (79 nama tanpa pasangan, 1 koordinat luar rentang) ada di `transform_laporan.json`.

Flag `extract_satudata`:
- `--source all|satudata|geoportal` — sumber mana yang dijalankan (default `all`).
- `--dataset <KEY>` — hanya satu dataset dari registry (contoh `satudata_rth`); key yang salah dicetak beserta daftar pilihan, exit 2.
- `--page-url <slug> --output <nama>` — dataset acak di luar registry (wajib berduaan); hasilnya `data/raw/<nama>.csv` + `.meta.json`.
- `--timeout <detik>` — timeout per request (default 60).

Flag:
- `--file <path>` — sumber ruang publik (csv/json); path relatif terhadap `data/processed/` juga diterima. Default: `ruang_publik_terbaru.csv` bila ada, selanjutnya `ruang_publik.csv`.
- `--pakai-kandidat` — syarat bila `--file` menunjuk `data/processed/kandidat/`; tanpa flag ini seed menolak dengan pesan jelas dan exit 1.
- `--reset` — kosongkan `ruang_publik` + `categories` dulu. **Ditolak** kalau masih ada `laporan`/`fasilitas` yang menempel. Backup DB sebelum dipakai.

> Perhatian path: script menghitung `data/` relatif terhadap lokasi file (`parents[3]`) → jalankan dari folder mana pun tidak masalah, **asalkan struktur folder repo utuh**.

---

## 3. Aturan Merge (kunci FEAT-012 — ringkas; detail di `data-master-service.md` §4)

`seed_ruang_publik` (BE-16) per baris sumber:

```python
target = by_id.get(record["id"])            # [1] id
      or by_kunci.get(nama|kecamatan|kelurahan)   # [2] natural key
      or by_nama[nama] if unik            # [3] nama, bila tepat satu baris
if target is None:
    db.add(RuangPublik(**record))          # baris baru
else:
    # hanya kolom ETL_OWNED; lewati bila tercatat di field_source / nilai sumber NULL
    terapkan_etl(target, record)
```

| Konsekuensi | Implikasi |
|---|---|
| Edit admin selamat dari seed ulang ✅ | Kolom yang ditandai `field_source` ditahan ETL (inti FEAT-012) |
| Perbaikan kolom dari sumber resmi ikut masuk ✅ | Kolom `ETL_OWNED` (koordinat, alamat, kategori, kecamatan/kelurahan, ...) disegarkan tiap seed; pemetaan kolom di `data-master-service.md` §4 |
| Nama sama di beberapa baris → baris ditahan | Hitungannya dicetak (`nama_ambigu`); review manual, tidak ditebak jadi update/duplikat |
| Data baru masuk otomatis ✅ | Tidak ada duplikat: id dulu, lalu natural key, lalu nama |
| `categories` idem (insert ID baru saja) ✅ | Tambah kategori sumber tidak menimpa label buatan admin |

**Jangan** mengubah pola ini jadi UPDATE overwrite seluruh baris tanpa membaca `data-master-service.md` §4.

---

## 4. Kualitas Data & Keterbatasan (didokumentasikan apa adanya)

| Fakta | Status | Tindakan |
|---|---|---|
| Koordinat semua baris terisi (1200) | ✅ | Pencarian radius hidup; verifikasi dengan curl radius kecil |
| 333 baris `alamat` NULL di sumber 4tipe | Diketahui | FE menampilkan "Alamat tidak tersedia"; jangan diisi teks default di backend |
| 334 baris sumber asli kolomnya bergeser (koma tak di-quote) | Diketahui | Terpisah di `ruang_publik_perlu_perbaikan.csv`; baris layak harus dipisah manual sebelum masuk seed |
| Atribut (`deskripsi`, `jam_operasional`, `tiket_masuk`, dll.) tidak seragam antar dataset | Sesuai PRD §6.3 | Kolom nullable; FE wajib menandai "data tidak tersedia" — jangan isi default palsu di backend |
| Foto resmi sering dummy/kosong (PRD §2) | Diketahui | Kolom `image_url` nullable; kelengkapan bertahap via data partisipatif |
| Sumber tersedia sebagai **unduhan berkala**, bukan API real-time (PRD §6.3) | Sebagian berubah | Tahap [0] kini memakai API kedua portal (lihat `extract_satudata.py`); **tanpa SLA** — endpoint bisa berubah/berat sewaktu-waktu, karena itu retry + pengecekan `total` sebelum menulis CSV. Tarikh data tetap dicatat di `.meta.json` |
| Satu Data **tidak punya kolom koordinat** | Ditangani (BE-15) | Koordinat diambil dari layer Geoportal (`geoportal_rth_koordinat.csv`), join by nama+kecamatan+kelurahan ternormalisasi |
| `geoportal_rth_koordinat.csv`: 970 dari 6512 baris tanpa `X`/`Y` | Diketahui (sama persis dengan file lama) | Baris ini beratribut tanpa titik koordinat; jangan dibuang, tapi tandai "tanpa lokasi" di UI |
| Koordinat berasal dari geometri EPSG:32748 | Sengaja tidak dipakai | Yang dipakai kolom `X`/`Y` yang sudah lon/lat (WGS84); transformasi butuh `pyproj`, tidak perlu |
| `kecamatan`/`kelurahan` ada di file dan kini juga di model | Ditangani (BE-16) | Masuk tabel (migrasi `d7b19b0b82cc`) karena dipakai kunci natural saat merge; diisi/backfill oleh seed, dan ikut response detail |
| `verified` datang sebagai string `'True'` | Ditangani | Dikonversi `_ke_bool` sebelum insert, kalau tidak MySQL mengubahnya jadi 0 |
| `transform_rth.py` vs `transform_rth_raw.py` | Dua varian | `transform_rth_raw.py` (pipeline) menulis `ruang_publik_terbaru.csv` + `kandidat/`; varian legacy menulis `ruang_publik_mentah.*` yang **tidak dibaca siapa-siapa** |
| Master punya `kategori_id` lama `taman` (1185) + `jalur-hijau` (15) | Diperbaiki (BE-15) | Diturunkan ulang dari kolom `tipe` → 950/119/102/29; kolom `tipe` tidak pernah berubah (0 baris) |
| 79 baris master tidak ketemu di sumber mana pun | Dipertahankan | Baris tetap ikut `ruang_publik_terbaru.csv` apa adanya; namanya tercatat di `transform_laporan.json`. Load (BE-16) tidak pernah menghapus baris, hanya menyegarkan kolom `ETL_OWNED` |
| 687 baris baru hasil extract | Kandidat saja | Hanya `kandidat/ruang_publik_kandidat.csv`; `seed_db` menolak path kandidat tanpa `--pakai-kandidat`. Kandidat yang natural key/nama-nya sudah ada di DB meng-update baris itu, bukan menambah baris (BE-16) |
| 1 baris (`RPTRA Tidung Ceria`) koordinatnya di luar rentang DKI | Dipertahankan | Editan manual di master tidak ditimpa; jangan "diperbaiki" otomatis tanpa cek sumber |
| Nama sumber memakai prefix `RTH ` (1044 baris) & RPTRA tanpa awalan | Dinormalisasi | Prefix dibuang saat mencocokkan, nama diseragamkan `RPTRA <nama>`; kolom `nama` master tidak diubah |

**Validasi data (PRD §8):** lakukan spot-check sampel hasil transform terhadap file sumber — terutama **akurasi koordinat** (latitude negatif lintang SELATAN, longitude ~106) dan `kategori_id` yang valid di tabel `categories`.

```powershell
# contoh pemeriksaan cepat (dari folder backend)
..\.venv\Scripts\python.exe -c "import pandas as pd;d=pd.read_csv('../data/processed/ruang_publik.csv');print(len(d),'baris');print(d['tipe'].value_counts(dropna=False).to_dict());print('tanpa koord:',int(d['latitude'].isna().sum()))"
```

---

## 5. Penjadwalan (belum ada — keputusan perlu ditulis)

PRD §5: "Proses berkala (cron job/scheduled task)". Saat ini **manual**, termasuk tahap [0] extract (butuh internet).

- [ ] **Keputusan MVP:** jalankan manual tiap kali ada rilis data baru dari Satu Data Jakarta → cukup tandai "disetujui manual" di sini, **tanpa kode**. Bila kelak dijadwalkan, urutannya `extract_satudata` → `transform_rth_raw` → `seed_db` dalam satu jadwal.
- [ ] **Bila wajib otomatis nanti:** OS cron / Task Scheduler memanggil `python -m app.etl.seed_db` harian — **tanpa** menambah dependency ke server (jangan integrasikan celery/redis ke `app/main.py`; lihat larangan `01-tech-stack.md` §7).
- [ ] **Opsi API trigger** (admin-only `POST /public-spaces/re-sync`) → keputusan & langkah ada di `data-master-service.md` §2.3.

---

## 6. Test / Verifikasi Regresi

- [x] **Extract 5 dataset:** `python -m app.etl.extract_satudata` → 2545 / 648 / 56 / 6512 / 324 baris sesuai `total` API, masing-masing dengan `.meta.json` (2026-10-04)
- [x] **Extract idempoten:** dijalankan dua kali → isi CSV identik (`0 file berubah`) (2026-10-04)
- [x] **Kesegaran extract vs unduhan manual:** `satudata_rth.csv` kolom & jumlah barisnya sama dengan `.xls` yang diunduh manual; `geoportal_rth_koordinat.csv` sama strukturnya dengan `rth_dki_coordinates.csv` (6512 x 18, 970 baris tanpa `X`, baris pertama sama) (2026-10-04)
- [x] **`read_raw` baca hasil extract:** ke-7 file di `data/raw/` terbaca tanpa error (2026-10-04)
- [x] **Transform valid:** `python -m app.etl.transform_rth_raw` → 11 pemeriksaan lolos (id & kolom master identik, hanya 4 tipe final, `kategori_id` valid, koordinat dalam rentang DKI, tanpa duplikat, kandidat `verified=False`) (2026-10-04)
- [x] **Transform idempoten:** dijalankan dua kali → `0 file berubah` (2026-10-04)
- [x] **Master aman:** `ruang_publik.csv` tetap 1200 baris dengan isi sama sebelum & sesudah transform (tidak pernah dibuka untuk ditulis) (2026-10-04)
- [x] **Guard kandidat:** `seed_db --file .../kandidat/ruang_publik_kandidat.csv` ditolak exit 1; `seed_db --file .../ruang_publik_terbaru.csv` → `0 baru (total 1200)` (2026-10-04)
- [x] **Idempoten:** jalankan `seed_db` dua kali berturut-turut → keluaran kedua `0 baru` dan total tidak berubah (2026-10-04)
- [x] **Idempoten fasilitas:** `seed_fasilitas` dua kali berturut-turut → kedua kali `0 baru`, total tetap 5428; `--reset` lalu seed ulang → jumlahnya sama persis (2026-10-04)
- [x] **Fasilitas admin aman:** ruang publik yang sudah punya fasilitas (dibuat lewat `POST /admin/facilities`) dilewati `seed_fasilitas` (2026-10-04)
- [x] **Merge field-level (BE-16):** edit `nama` + `latitude` lewat `mark_fields_edited()` -> seed ulang -> nilai edit bertahan dan tercatat `2 kolom ditahan`; `longitude` tanpa penanda dibetulkan balik dari CSV; `field_source` 0 baris disentuh seed (2026-10-04)
- [x] **Load update + backfill (BE-16):** seed pertama `0 baru, 1018 diupdate` (koordinat disegarkan + `kecamatan`/`kelurahan` terisi 1006 baris), diulang 2x -> `0 diupdate`; selisih kolom `ETL_OWNED` vs `ruang_publik_terbaru.csv` = 0; `verified` 1200 True tak tersentuh (2026-10-04)
- [x] **Pencocokan tanpa id (BE-16):** baris uji ber-id baru dengan natural key kandidat -> masuk jalur update `natural key`, 687 kandidat -> 48 jalur update + 639 insert, tanpa duplikat; baris uji dibersihkan setelah uji, DB kembali 1200 baris (2026-10-04)
- [x] **Transform tetap identik pasca-refactor kunci:** `transform_rth_raw` dijalankan 2x -> `ruang_publik_terbaru.csv` & kandidat identik dengan sebelum refactor, `transform_laporan.json` sama kecuali `generated_at` (2026-10-04)
- [x] **Koordinat:** `GET /api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3` → hasil tidak kosong dan `jarak_km` terisi (2026-10-04)
- [x] **Kategori:** semua `kategori_id` hasil seed lolos FK (seed tanpa error) dan `GET /categories` → 4 entri (2026-10-04)
- [ ] **Jumlah per tipe:** `GET /categories` → 4 entri; `GET /public-spaces?category=<id>` → taman-lingkungan 950, rptra 119, taman-interaktif 102, taman-kota 29 (limit 500, jadi haluskan dengan `skip` untuk taman-lingkungan)
- [x] **Kesegaran data:** `GET /public-spaces/stats` → `total_ruang_publik` = 1200 = jumlah baris `ruang_publik.csv` (2026-10-04)

---

## 7. Verifikasi Akhir File Ini

- [ ] Hanya membahas sinkronisasi data resmi (edit admin → `data-master-service.md`)
- [ ] Urutan perintah bisa diikuti mentah-mentah di mesin baru
- [ ] Aturan merge tidak diubah tanpa membaca dampaknya ke FEAT-012
- [ ] Keputusan penjadwalan (manual/otomatis) ditulis eksplisit di §5
