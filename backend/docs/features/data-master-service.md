# features — Data Master Service (FEAT-012)

> **Scope file ini HANYA FEAT-012 (Manajemen Data Master Ruang Publik — Admin)** — sesuai PRD [`../../../docs/PRD.md`](../../../docs/PRD.md).
> Foto galeri (FEAT-007) → `public-space-service.md`; pipeline masuk data → `etl-worker.md`.

Kode terkait:
- Baca saat ini: `app/api/v1/ruang_publik.py` (GET list/detail/stats), `app/services/ruang_publik.py`
- Skema siap pakai: `app/schemas/ruang_publik.py` → `RuangPublikCreate`, `RuangPublikUpdate`, `RuangPublikResponse` **sudah ada, belum dipakai endpoint mana pun**
- Konsumen FE: `apps/web/src/features/data-master/pages/DataMasterPage.jsx` (baca saja), `KelolaFasilitasPage.jsx` (CRUD penuh lewat `apps/web/src/services/fasilitasService.js`)

---

## Status Ringkas

| Aspek PRD FEAT-012 | Status |
|---|---|
| Admin mengimpor/memperbarui data dari Satu Data Jakarta | **Sudah** — sinkronisasi bisa dijalankan dari panel admin (`POST /admin/sync-data`, BE-18); jalur lain: scheduler (BE-17) & shell |
| Admin mengedit data manual | **Sebagian** — fasilitas sudah (CRUD `/admin/facilities`, BE-53); daftar admin ruang publik sudah `GET /admin/public-spaces` (BE-32), edit manual `PATCH` masih BE-33 |
| Perubahan manual tidak hilang saat sinkronisasi ETL | **Sudah** — field-level merge BE-16: kolom `ETL_OWNED` disegarkan, kolom tercatat `field_source` ditahan (lihat §4) |

---

## 1. Kondisi Saat Ini

- Halaman admin FE `/dashboard/data-master`: `GET /admin/public-spaces` (BE-32) sudah menyediakan daftar lengkap dengan penanda `field_source`; tombol "Edit Master" masih menunggu `PATCH` (BE-33). `/dashboard/fasilitas` sudah penuh CRUD lewat `GET/POST/PATCH/DELETE /admin/facilities` + impor CSV (BE-53).
- Tabel `ruang_publik` & `fasilitas` sudah punya kolom lengkap yang dibutuhkan edit (deskripsi, jam operasional, fasilitas status, dll.).
- Skema Pydantic update (`RuangPublikUpdate`) sudah tersedia — mempercepat implementasi (tinggal pakai).
- ETL (`seed_db`, BE-16) **insert baris baru + update terbatas**: hanya kolom `ETL_OWNED`, hanya untuk kolom yang belum tercatat di `field_source` → edit admin otomatis aman (lihat §4).
- Tabel `fasilitas` terisi oleh `app/etl/seed_fasilitas.py` (katalog `data/processed/fasilitas.csv`, idempoten), sumber Satu Data tidak punya kolom fasilitas.

---

## 2. Endpoint yang Perlu Dibuat (semua Admin)

Pola wajib untuk seluruh endpoint di bawah: `_: User = Depends(get_current_admin)`, service-layer di `services/ruang_publik.py`, response schema yang sudah ada, terdaftar di `api.py`.

### 2.1 Ruang Publik

| Method & Path | Body | Perilaku |
|---|---|---|
| `GET /api/v1/admin/public-spaces` | query `?q=&category=&wilayah=&diedit_manual=&skip=&limit=` | Data master lengkap + `field_source` + `jumlah_fasilitas` + `stats` (BE-32) |
| `PATCH /api/v1/public-spaces/{id}` | `RuangPublikUpdate` (semua field opsional) | Edit sebagian kolom (deskripsi, jam_operasional, alamat, verified, image_url, ...). 404 bila tak ada. |
| *(opsional)* `POST /api/v1/public-spaces` | `RuangPublikCreate` | Tambah ruang publik manual baru — **hanya bila PRD/produk meminta**; default MVP cukup PATCH + ETL |
| *(opsional)* `DELETE /api/v1/public-spaces/{id}` | — | **Hati-hati**: cascade menghapus fasilitas & laporan terkait. Rekomendasi MVP: **nonaktifkan soft-delete dulu** (mis. set `verified=false` / flag khusus) atau jangan dibuatkan sama sekali sampai ada kebutuhan jelas |

### 2.2 Fasilitas (per ruang publik)

> **Keputusan path (2026-10-04):** memakai namespace admin terpisah, bukan nested
> di bawah ruang publik. Semua di `/api/v1/admin/facilities`, dilindungi
> `Depends(get_current_admin)`, terdaftar lewat `admin_router` di
> `app/api/v1/fasilitas.py`.

| Method & Path | Body | Perilaku |
|---|---|---|
| `GET /api/v1/admin/facilities` | `?q=&kategori=&status=&wilayah=&skip=&limit=` | Semua baris fasilitas + `ruang_publik_nama` (join eksplisit + `contains_eager`) |
| `POST /api/v1/admin/facilities` | `{ nama, ruang_publik_id, kategori?, status?, deskripsi? }` | Tambah fasilitas; `201`; `404` induk tak ada |
| `PATCH /api/v1/admin/facilities/{id}` | sebagian field di atas | Ubah sebagian; `404` bila tak ada |
| `DELETE /api/v1/admin/facilities/{id}` | — | Hapus; `laporan.fasilitas_id` FK dipakai → **tolak dengan `409`** kalau masih ada laporan |
| `POST /api/v1/admin/facilities/import` | `file` CSV multipart | Impor masal; jawaban parsial `{created, failed, errors}` |

> **Alasan ditolaknya bentuk nested** (`POST /api/v1/public-spaces/{id}/fasilitas`):
> endpoint publik `GET /public-spaces/{id}` memakai prefix yang sama, sehingga
> penulisan fasilitas jadi tersembunyi di bawah resource publik dan pola admin
> lain (`/admin/reports`, `/admin/users`) jadi tidak seragam. Nested path juga
> membuat pemanggilan impor CSV (`POST .../public-spaces/import`) ambigu.
> Konsekuensi: induk wajib dikirim sebagai field `ruang_publik_id`, jadi
> divalidasi service (`404` bila tak ada).

> **Kategori fasilitas**: tidak butuh tabel/master CRUD terpisah — `fasilitas.kategori` berupa teks bebas dan filter FE memakai `GET /facilities` aggregate.

### 2.3 Impor/Refresh dari Satu Data Jakarta

Pilihan (pilih satu & catat):

- **Opsi A (MVP, disarankan):** endpoint admin `POST /api/v1/public-spaces/re-sync` yang **menjalankan ulang fungsi seed** (`seed_db` dipanggil sebagai fungsi, bukan subprocess) → response jumlah baris baru. Admin tidak perlu akses shell.
- **Opsi B:** tetap manual lewat shell (`python -m app.etl.seed_db`) — cukup didokumentasikan di `etl-worker.md`, tanpa endpoint.

Keduanya **wajib mempertahankan** strategi merge §4. Catatan: pipeline ini sudah jalan otomatis lewat `scheduler.py` (BE-17, jadwal `ETL_JADWAL`); opsi di atas menyangkut **trigger tambahan dari panel admin** (task BE-18).

> **Keputusan (2026-10-04, BE-18):** Opsi A dengan dua deviasi yang dicatat:
> 1. **Path** `POST /api/v1/admin/sync-data` (namespace admin, mengikuti keputusan §2.2), bukan `/public-spaces/re-sync`.
> 2. **Isi run = pipeline penuh** (extract → transform → seed lewat `jalankan_tahap` subprocess, sama seperti BE-17), bukan seed saja — tombol panel admin berarti "ambil data terbaru dari portal", dan file raw lama kadang sudah usang.
> Kontrak lengkap: `04-api-endpoints.md` §8.

---

## 3. Langkah Implementasi (urut)

- [x] Keputusan bentuk path fasilitas (§2.2): namespace admin terpisah `/admin/facilities`
- [x] Pilih opsi impor Satu Data (§2.3): Opsi A dengan deviasi path & pipeline penuh (BE-18)
- [x] Implementasi `GET /admin/public-spaces`: service `list_ruang_publik_admin()` (filter `q`/`category`/`wilayah`/`diedit_manual`, urut `nama`, `id`), router `admin_router` + `get_current_admin` + response `AdminRuangPublikResponse` (2026-10-08, BE-32)
- [ ] Implementasi `PATCH /public-spaces/{id}`:
  - service `update_ruang_publik(db, id, payload)` — update field yang **tidak `None`** di payload (patch semantics, jangan menimpa kolom terisi dengan `None`)
  - router + `get_current_admin` + response `RuangPublikResponse`
- [x] Implementasi CRUD fasilitas (bentuk path terpilih, lihat §2.2)
- [x] (Opsi A) endpoint re-sync memanggil seed idempoten — kini lewat pipeline penuh `jalankan_tahap` (BE-18), seed tetap idempoten (BE-16)
- [x] Daftarkan semua di `app/api/v1/api.py`
- [x] Update `04-api-endpoints.md` **dan** `docs/API.md`
- [x] Beri tahu workflow frontend: `DataMasterPage`/`KelolaFasilitasPage` tinggal menyambungkan `services.js` ke endpoint ini
- [ ] Test regresi §5

---

## 4. Strategi Merge — Edit Admin vs ETL (inti FEAT-012)

**Masalah PRD:** "Perubahan manual tidak hilang saat sinkronisasi ETL berikutnya."

**Mekanisme yang sudah ada di kode (`app/etl/seed_db.py`, BE-16):**

```python
if record["id"] in ada:                      # atau cocok natural key / nama
    # hanya kolom ETL_OWNED yang disegarkan:
    for kolom in ETL_OWNED:
        if kolom in baris.field_source:      # milik admin -> ditahan
            continue
        if nilai_sumber is None or sama(nilai_lama, nilai_sumber):
            continue                         # sumber kosong bukan perintah hapus
        setattr(baris, kolom, nilai_sumber)
else:
    db.add(RuangPublik(**record))            # baris baru
```

Konsekuensi:

| Jenis perubahan | Selamat dari seed ulang? |
|---|---|
| Edit manual admin (alamat, deskripsi, verified, foto) | ✅ Ya — kolom tercatat di `field_source`, ETL menahannya |
| Data resmi yang diperbaiki sumber (mis. koordinat dikoreksi) | ✅ Ikut masuk — kolom `ETL_OWNED` disegarkan tiap seed |
| Data baru dari sumber resmi | ✅ Masuk (id baru, atau merge lewat natural key bila barisnya sudah ada) |
| Fasilitas/laporan yang menempel | ✅ `seed_db` tidak menyentuh keduanya (hanya `categories` + `ruang_publik`); `seed_fasilitas.py` hanya INSERT baris untuk ruang publik yang belum punya fasilitas |

**Pemetaan kolom (BE-16; sumber kebenaran: konstanta `ETL_OWNED` / `KOLOM_ADMIN` di `app/etl/seed_db.py`):**

| Kelompok | Kolom | Aturan |
|---|---|---|
| `ETL_OWNED` | `nama`, `kecamatan`, `kelurahan`, `wilayah`, `alamat`, `latitude`, `longitude`, `kategori_id` | Ditulis ulang dari file sumber, **kecuali** kolom sudah tercatat di `field_source`. Nilai sumber NULL dilewati (tidak mengosongkan data terisi). |
| `KOLOM_ADMIN` | `deskripsi`, `jam_operasional`, `tiket_masuk`, `akses_disabilitas`, `ramah_hewan`, `verified`, `status_general`, `image_url` | Tidak pernah ditulis ETL, berapa pun isi sumbernya. |
| `KOLOM_SISTEM` | `id`, `field_source`, `created_at`, `updated_at` | Ditulis sistem (`mark_fields_edited()`, timestamp); `id` sekaligus kunci pencocokan pertama. |

Kolom tabel yang belum masuk salah satu kelompok membuat seed **berhenti dengan pesan error**
(`_cek_pemetaan`) — keputusan kolom baru harus ditulis di tabel ini dulu.

**Pencocokan baris (urut, berhenti di yang pertama cocok):** `id` file sumber -> natural key
`nama|kecamatan|kelurahan` ternormalisasi (kunci di `app/etl/kunci.py`, dipakai transform & seed) ->
`nama` saja bila tepat satu baris. Nama yang cocok di banyak baris tidak ditebak: barisnya dilewati
dan dicatat (`nama_ambigu`) supaya direview manual. `kecamatan`/`kelurahan` ada di tabel justru
supaya kunci natural bisa dihitung dari database (migrasi `d7b19b0b82cc`).

**Aturan lanjutan (wajib dipatuhi ketika menulis sinkronisasi apa pun):**

1. **Jangan** mengganti pola merge dengan UPDATE overwrite seluruh baris.
2. Perubahan kolom `ETL_OWNED` <-> `KOLOM_ADMIN` wajib lewat pemetaan di atas + konstanta di
   `seed_db.py`, jangan diam-diam pindah satu kolom.
3. **Keputusan penanda (BE-05, sudah dijalankan 2026-10-03):** penanda memakai kolom **`ruang_publik.field_source` (JSON, nullable)**, bukan tabel log terpisah. Isinya `{"nama_kolom": "waktu edit ISO-8601"}`; `NULL` = belum pernah diedit. Ditulis oleh `mark_fields_edited(db, ruang_publik, fields)` di `app/services/ruang_publik.py` — dipanggil endpoint edit admin (BE-33), dibaca proses merge ETL (BE-16). Migrasi: `c1f4a9d2e073_add_ruang_publik_field_source`.
4. Setiap perubahan skema (flag/dst.) = migrasi Alembic baru (`03-database-schema.md` §3).

---

## 5. Test Regresi Wajib

- [ ] `PATCH /public-spaces/{id}` tanpa token / token warga → 401/403; token admin → 200
- [ ] PATCH hanya `deskripsi` → field lain tidak berubah (patch semantics)
- [ ] PATCH body `{}` / field None → tidak menimpa kolom terisi dengan NULL
- [x] Tambah fasilitas → muncul di `GET /facilities` (aggregate) & detail ruang publik (2026-10-04, skrip black-box BE-53)
- [x] **Merge test:** edit `nama` + `latitude` lewat `mark_fields_edited()` → `seed_db` ulang → perubahan tetap ada (`2 kolom ditahan`) dan kolom lain (`longitude` tanpa penanda) tetap ter-update dari CSV; `field_source` tidak pernah ditulis seed (2026-10-04; jalur API menyusul bersama BE-33)
- [ ] 404 untuk id tak ada; response selalu `RuangPublikResponse` valid

---

## 6. Verifikasi Akhir File Ini

- [ ] Hanya membahas FEAT-012 (+ dependensi yang ditandai jelas)
- [x] Setiap endpoint baru terdaftar: `get_current_admin` ✅, `04-api-endpoints.md` ✅, `docs/API.md` ✅
- [ ] Strategi merge tertulis dan teruji (test seed ulang)
- [x] Tidak ada endpoint tulis untuk warga/publik di file ini
