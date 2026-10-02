# features — ETL Worker (Sinkronisasi Satu Data Jakarta)

> **Scope file ini HANYA pipeline sinkronisasi data resmi Satu Data Jakarta** (PRD §5 alur data, §6.1, §6.3).
> Edit data master oleh admin → `data-master-service.md`; galeri foto → `public-space-service.md`.

Kode terkait (semua di `app/etl/`):
- `read_raw.py` — baca file mentah dari `data/raw/`
- `transform_rth_raw.py` — transformasi utama → `data/processed/ruang_publik.json`
- `transform_rth.py` — varian transform (legacy/alternatif)
- `seed_db.py` — muat `categories` + `ruang_publik` ke MySQL
- `seed_admin.py` — buat admin pertama (bukan bagian sinkron data; lihat `admin-auth.md` §3)

Data:
- Sumber mentah: `data/raw/` (mis. `data-ruang-terbuka-hijau-(rth)-komponen-data.xls`, `rth_dki_coordinates.csv`)
- Hasil olah: `data/processed/ruang_publik.json` (+ `.csv`), `categories.json` (+ `.csv`)

---

## Status Ringkas

| Aspek | Status |
|---|---|
| Pipeline mentah → processed → DB | **Ada & berjalan** (script manual) |
| Idempoten (aman diulang) | **Ya** — seed skip ID sudah ada (inti FEAT-012) |
| Koordinat terisi | **Ya** — 5542/5542 baris berkoordinat (klaim lama "koordinat kosong" sudah kedaluwarsa) |
| Penjadwalan otomatis (cron) | **Belum** — PRD §5 menyebut "cron job/scheduled task"; saat ini manual |
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
        │                    - kategori dinormalisasi ke id (taman, jalur-hijau, ...)
        ▼
   data/processed/ruang_publik.json  (+ categories.json; varian .csv legacy)
        ▼
[3] seed_db.py             ke MySQL raku_db — INSERT idempoten
        ▼
   tabel categories + ruang_publik (+ fasilitas bila ikut di sumber)
```

**Bentuk kerja: worker terpisah** — script batch dijalankan manusia lewat shell, **bukan** proses di dalam server (alasan: `02-architecture.md` §3).

---

## 2. Cara Menjalankan (urut)

```powershell
cd "d:\Ruka Jakarta\backend"

# 1. pastikan DB hidup & migrasi head
docker compose up -d            # dari root repo; tunggu raku-db healthy
..\.venv\Scripts\python.exe -m alembic upgrade head

# 2. transform (bila ada file baru di data/raw/)
..\.venv\Scripts\python.exe -m app.etl.transform_rth_raw

# 3. seed (idempoten; jalankan lagi boleh)
..\.venv\Scripts\python.exe -m app.etl.seed_db
```

Keluaran `seed_db`: format (json/csv), jumlah kategori & ruang publik **baru** + total.

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
| Koordinat semua baris terisi (5542) | ✅ | Pencarian radius hidup; verifikasi dengan curl radius kecil |
| Atribut (`deskripsi`, `jam_operasional`, `tiket_masuk`, dll.) tidak seragam antar dataset | Sesuai PRD §6.3 | Kolom nullable; FE wajib menandai "data tidak tersedia" — jangan isi default palsu di backend |
| Foto resmi sering dummy/kosong (PRD §2) | Diketahui | Kolom `image_url` nullable; kelengkapan bertahap via data partisipatif |
| Sumber tersedia sebagai **unduhan berkala**, bukan API real-time (PRD §6.3) | Diterima | Sinkronisasi manual berkala; **catat tanggal data** di UI adalah urusan FE/produk |
| `kecamatan`/`kelurahan` ada di CSV tapi tidak di model | Sengaja | Dibuang saat seed (`KOLOM_DILEWATI`) — jangan tambahkan kolom tanpa kebutuhan jelas + migrasi |
| `transform_rth.py` vs `transform_rth_raw.py` | Dua varian | `transform_rth_raw.py` = jalur utama koordinat; pastikan memakai script yang benar sebelum seed |

**Validasi data (PRD §8):** lakukan spot-check sampel hasil transform terhadap file sumber — terutama **akurasi koordinat** (latitude negatif lintang SELATAN, longitude ~106) dan `kategori_id` yang valid di tabel `categories`.

```powershell
# contoh pemeriksaan cepat
..\.venv\Scripts\python.exe -c "import json;d=json.load(open('../data/processed/ruang_publik.json',encoding='utf-8'));print(len(d),'baris');print('tanpa koord:',sum(1 for r in d if not r.get('latitude')))"
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
- [ ] **Merge:** catat `deskripsi` 1 baris → edit via SQL/API → seed ulang → editan tetap ada
- [ ] **Koordinat:** `curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=1"` → hasil tidak kosong dan `jarak_km` terisi
- [ ] **Kategori:** semua `kategori_id` hasil seed ada di `GET /categories` (tidak ada orphan — FK constraint akan menolak, tapi cek sebelum insert penuh)
- [ ] **Kesegaran data:** `GET /public-spaces/stats` → `total_ruang_publik` ≈ jumlah baris processed

---

## 7. Verifikasi Akhir File Ini

- [ ] Hanya membahas sinkronisasi data resmi (edit admin → `data-master-service.md`)
- [ ] Urutan perintah bisa diikuti mentah-mentah di mesin baru
- [ ] Aturan merge tidak diubah tanpa membaca dampaknya ke FEAT-012
- [ ] Keputusan penjadwalan (manual/otomatis) ditulis eksplisit di §5
