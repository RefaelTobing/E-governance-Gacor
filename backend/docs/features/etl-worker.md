# features — ETL Worker (Sinkronisasi Satu Data Jakarta)

> **Scope file ini HANYA pipeline sinkronisasi data resmi Satu Data Jakarta** (PRD §5 alur data, §6.1, §6.3).
> Edit data master oleh admin → `data-master-service.md`; galeri foto → `public-space-service.md`.

Kode terkait (semua di `app/etl/`):
- `read_raw.py` — baca file mentah dari `data/raw/`
- `kategori.py` — master kategori (4 tipe) dipakai seed dan transform
- `transform_rth_raw.py` — transformasi utama → `data/processed/ruang_publik_mentah.json`
- `transform_rth.py` — varian transform (legacy/alternatif) → `data/processed/ruang_publik_mentah.csv`
- `seed_db.py` — muat `categories` + `ruang_publik` ke MySQL (`--file`, `--reset`)
- `seed_fasilitas.py` — isi tabel `fasilitas` dengan data contoh per ruang publik (`--reset`); **bukan** bagian sinkron data resmi, karena sumber Satu Data tidak punya kolom fasilitas
- `seed_admin.py` — buat admin pertama (bukan bagian sinkron data; lihat `admin-auth.md` §3)

Data:
- Sumber mentah: `data/raw/` (mis. `data-ruang-terbuka-hijau-(rth)-komponen-data.xls`, `rth_dki_coordinates.csv`)
- Sumber seed (bawaan): `data/processed/ruang_publik.csv` — 1200 baris, kolom lengkap, `tipe` diisi
- Baris rusak (kolom bergeser, 334 baris) terpisah di `data/processed/ruang_publik_perlu_perbaikan.csv`, tidak di-seed
- Master kategori: `data/processed/categories.json` (+ `.csv`) — 4 tipe: taman-lingkungan, rptra, taman-interaktif, taman-kota

---

## Status Ringkas

| Aspek | Status |
|---|---|
| Pipeline mentah → processed → DB | **Ada & berjalan** (script manual) |
| Idempoten (aman diulang) | **Ya** — seed skip ID sudah ada (inti FEAT-012) |
| Koordinat terisi | **Ya** — 1200/1200 baris `ruang_publik.csv` punya `latitude`/`longitude` |
| Kategori konsisten | **Ya** — kolom `tipe` di file sumber → `kategori_id` lewat `kategori.py`; tipe di luar master → `NULL` |
| Penjadwalan otomatis (cron) | **Belum** — PRD §5 menyebut "cron job/scheduled task"; saat ini manual |
| Isi tabel `fasilitas` | **Data contoh** lewat `seed_fasilitas.py` — sumber resmi tidak punya kolom fasilitas |
| Endpoint trigger dari admin API | **Belum** — opsional, lihat `data-master-service.md` §2.3 |
| Pemetaan field lengkap vs sumber | Sebagian atribut (`deskripsi`, `jam_operasional`, dll.) tidak seragam → kolom nullable (PRD §6.3) |

---

## 1. Alur Data (sesuai PRD §5 + kode)

```
Satu Data Jakarta (unduhan manual — portal menyediakan CSV/Excel, bukan API real-time)
        │  (manusia mengunduh ke data/raw/)
        ▼
[1] read_raw.py            baca file mentah (xls/csv)
        ▼
[2] transform_rth_raw.py   normalisasi:
        │                    - koordinat dari kolom X/Y sumber → latitude/longitude
        │                    - wilayah "KOTA ADM. JAKARTA SELATAN" → "Jakarta Selatan"
        │                    - tipe: nama diawali "RPTRA", atau JENIS_OBJEK ∈ 3 tipe taman
        ▼
   data/processed/ruang_publik_mentah.json  (data mentah; bukan file seed)
        ▼
[3] seed_db.py             ke MySQL raku_db — INSERT idempoten
        │                   sumber bawaan: data/processed/ruang_publik.csv
        │                   --file <path> memakai sumber lain, --reset mengganti total isi
        ▼
   tabel categories (4 tipe) + ruang_publik
```

**Bentuk kerja: worker terpisah** — script batch dijalankan manusia lewat shell, **bukan** proses di dalam server (alasan: `02-architecture.md` §3).

---

## 2. Cara Menjalankan (urut)

```powershell
cd "d:\Ruka Jakarta\backend"

# 1. pastikan DB hidup & migrasi head
docker compose up -d            # dari root repo; tunggu raku-db healthy
..\.venv\Scripts\python.exe -m alembic upgrade head

# 2. transform (bila ada file baru di data/raw/; opsional, tulis ke *_raw.*)
..\.venv\Scripts\python.exe -m app.etl.transform_rth_raw

# 3. seed (idempoten; jalankan lagi boleh)
..\.venv\Scripts\python.exe -m app.etl.seed_db

# 3b. isi fasilitas (data contoh; dilewati untuk lokasi yang sudah punya fasilitas)
..\.venv\Scripts\python.exe -m app.etl.seed_fasilitas

# 4. ganti total isi tabel (backup DB dulu!), atau seed file lain
..\.venv\Scripts\python.exe -m app.etl.seed_db --reset
..\.venv\Scripts\python.exe -m app.etl.seed_db --file ../data/processed/ruang_publik_lainnya.csv
```

Keluaran `seed_db`: nama file sumber, jumlah kategori & ruang publik **baru** + total, lalu baris per kategori.
Keluaran `seed_fasilitas`: jumlah fasilitas **baru** + total, lalu baris per kategori ruang publik; `--reset` menghapus hanya baris berprefix `seed-` (baris buatan admin lewat API/CSV tetap ada).

Flag:
- `--file <path>` — sumber ruang publik (csv/json); path relatif terhadap `data/processed/` juga diterima. Default: `ruang_publik.csv`.
- `--reset` — kosongkan `ruang_publik` + `categories` dulu. **Ditolak** kalau masih ada `laporan`/`fasilitas` yang menempel. Backup DB sebelum dipakai.

> Perhatian path: script menghitung `data/` relatif terhadap lokasi file (`parents[3]`) → jalankan dari folder mana pun tidak masalah, **asalkan struktur folder repo utuh**.

---

## 3. Aturan Merge (kunci FEAT-012 — ringkas; detail di `data-master-service.md` §4)

`seed_ruang_publik`:

```python
if record["id"] in ada:
    continue        # ID sudah ada → DILEWATI, tidak pernah di-UPDATE
```

| Konsekuensi | Implikasi |
|---|---|
| Edit admin selamat dari seed ulang ✅ | Syarat utama FEAT-012 terpenuhi oleh mekanisme ini |
| Perbaikan kolom dari sumber resmi **tidak** meng-update baris lama | Trade-off yang diterima untuk MVP; bila kelak perlu, pakai **field-level merge** (kolom ETL_OWNED vs ADMIN_OWNED — langkahnya tertulis di `data-master-service.md` §4) |
| Data baru masuk otomatis ✅ | Tidak ada duplikat (dicek via set ID) |
| `categories` idem (insert ID baru saja) ✅ | Tambah kategori sumber tidak menimpa label buatan admin |

**Jangan** mengubah pola ini jadi UPDATE overwrite tanpa membaca `data-master-service.md` §4.

---

## 4. Kualitas Data & Keterbatasan (didokumentasikan apa adanya)

| Fakta | Status | Tindakan |
|---|---|---|
| Koordinat semua baris terisi (1200) | ✅ | Pencarian radius hidup; verifikasi dengan curl radius kecil |
| 333 baris `alamat` NULL di sumber 4tipe | Diketahui | FE menampilkan "Alamat tidak tersedia"; jangan diisi teks default di backend |
| 334 baris sumber asli kolomnya bergeser (koma tak di-quote) | Diketahui | Terpisah di `ruang_publik_perlu_perbaikan.csv`; baris layak harus dipisah manual sebelum masuk seed |
| Atribut (`deskripsi`, `jam_operasional`, `tiket_masuk`, dll.) tidak seragam antar dataset | Sesuai PRD §6.3 | Kolom nullable; FE wajib menandai "data tidak tersedia" — jangan isi default palsu di backend |
| Foto resmi sering dummy/kosong (PRD §2) | Diketahui | Kolom `image_url` nullable; kelengkapan bertahap via data partisipatif |
| Sumber tersedia sebagai **unduhan berkala**, bukan API real-time (PRD §6.3) | Diterima | Sinkronisasi manual berkala; **catat tanggal data** di UI adalah urusan FE/produk |
| `kecamatan`/`kelurahan` ada di file tapi tidak di model | Sengaja | Dibuang saat seed (whitelist `KOLOM_RUANG_PUBLIK`) — jangan tambahkan kolom tanpa kebutuhan jelas + migrasi |
| `verified` datang sebagai string `'True'` | Ditangani | Dikonversi `_ke_bool` sebelum insert, kalau tidak MySQL mengubahnya jadi 0 |
| `transform_rth.py` vs `transform_rth_raw.py` | Dua varian | Keduanya menulis `ruang_publik_mentah.*`; **seed tidak membaca keduanya** |

**Validasi data (PRD §8):** lakukan spot-check sampel hasil transform terhadap file sumber — terutama **akurasi koordinat** (latitude negatif lintang SELATAN, longitude ~106) dan `kategori_id` yang valid di tabel `categories`.

```powershell
# contoh pemeriksaan cepat (dari folder backend)
..\.venv\Scripts\python.exe -c "import pandas as pd;d=pd.read_csv('../data/processed/ruang_publik.csv');print(len(d),'baris');print(d['tipe'].value_counts(dropna=False).to_dict());print('tanpa koord:',int(d['latitude'].isna().sum()))"
```

---

## 5. Penjadwalan (belum ada — keputusan perlu ditulis)

PRD §5: "Proses berkala (cron job/scheduled task)". Saat ini **manual**.

- [ ] **Keputusan MVP:** jalankan manual tiap kali ada rilis data baru dari Satu Data Jakarta → cukup tandai "disetujui manual" di sini, **tanpa kode**.
- [ ] **Bila wajib otomatis nanti:** OS cron / Task Scheduler memanggil `python -m app.etl.seed_db` harian — **tanpa** menambah dependency ke server (jangan integrasikan celery/redis ke `app/main.py`; lihat larangan `01-tech-stack.md` §7).
- [ ] **Opsi API trigger** (admin-only `POST /public-spaces/re-sync`) → keputusan & langkah ada di `data-master-service.md` §2.3.

---

## 6. Test / Verifikasi Regresi

- [ ] **Idempoten:** jalankan `seed_db` dua kali berturut-turut → keluaran kedua `0 baru` dan total tidak berubah
- [x] **Idempoten fasilitas:** `seed_fasilitas` dua kali berturut-turut → kedua kali `0 baru`, total tetap 5428; `--reset` lalu seed ulang → jumlahnya sama persis (2026-10-04)
- [x] **Fasilitas admin aman:** ruang publik yang sudah punya fasilitas (dibuat lewat `POST /admin/facilities`) dilewati `seed_fasilitas` (2026-10-04)
- [ ] **Merge:** catat `deskripsi` 1 baris → edit via SQL/API → seed ulang → editan tetap ada
- [ ] **Koordinat:** `curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=1"` → hasil tidak kosong dan `jarak_km` terisi
- [ ] **Kategori:** semua `kategori_id` hasil seed ada di `GET /categories` (tidak ada orphan — FK constraint akan menolak, tapi cek sebelum insert penuh)
- [ ] **Jumlah per tipe:** `GET /categories` → 4 entri; `GET /public-spaces?category=<id>` → taman-lingkungan 950, rptra 119, taman-interaktif 102, taman-kota 29 (limit 500, jadi haluskan dengan `skip` untuk taman-lingkungan)
- [ ] **Kesegaran data:** `GET /public-spaces/stats` → `total_ruang_publik` = 1200 = jumlah baris `ruang_publik.csv`

---

## 7. Verifikasi Akhir File Ini

- [ ] Hanya membahas sinkronisasi data resmi (edit admin → `data-master-service.md`)
- [ ] Urutan perintah bisa diikuti mentah-mentah di mesin baru
- [ ] Aturan merge tidak diubah tanpa membaca dampaknya ke FEAT-012
- [ ] Keputusan penjadwalan (manual/otomatis) ditulis eksplisit di §5
