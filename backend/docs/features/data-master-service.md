# features — Data Master Service (FEAT-012)

> **Scope file ini HANYA FEAT-012 (Manajemen Data Master Ruang Publik — Admin)** — sesuai PRD [`../../../docs/PRD.md`](../../../docs/PRD.md).
> Foto galeri (FEAT-007) → `public-space-service.md`; pipeline masuk data → `etl-worker.md`.

Kode terkait:
- Baca saat ini: `app/api/v1/ruang_publik.py` (GET list/detail/stats), `app/services/ruang_publik.py`
- Skema siap pakai: `app/schemas/ruang_publik.py` → `RuangPublikCreate`, `RuangPublikUpdate`, `RuangPublikResponse` **sudah ada, belum dipakai endpoint mana pun**
- Konsumen FE (baca saja): `apps/web/src/features/data-master/pages/DataMasterPage.jsx`, `KelolaFasilitasPage.jsx`

---

## Status Ringkas

| Aspek PRD FEAT-012 | Status |
|---|---|
| Admin mengimpor/memperbarui data dari Satu Data Jakarta | **Sebagian** — ETL seed ada, tetapi **manual/script** (bukan dari panel admin) |
| Admin mengedit data manual | **BELUM** — semua endpoint ruang publik/fasilitas saat ini GET saja |
| Perubahan manual tidak hilang saat sinkronisasi ETL | **Sudah dijamin mekanismenya** (seed idempoten skip ID ada) — dipertahankan |

---

## 1. Kondisi Saat Ini

- Halaman admin FE `/dashboard/data-master` dan `/dashboard/fasilitas` **sudah dibuat**, tetapi hanya memanggil `GET /public-spaces` (read-only). Tombol simpan di FE belum punya backend.
- Tabel `ruang_publik` & `fasilitas` sudah punya kolom lengkap yang dibutuhkan edit (deskripsi, jam operasional, fasilitas status, dll.).
- Skema Pydantic update (`RuangPublikUpdate`) sudah tersedia — mempercepat implementasi (tinggal pakai).
- ETL (`seed_db`) **hanya INSERT ID baru, tidak pernah UPDATE** → edit admin otomatis aman (lihat §4).

---

## 2. Endpoint yang Perlu Dibuat (semua Admin)

Pola wajib untuk seluruh endpoint di bawah: `_: User = Depends(get_current_admin)`, service-layer di `services/ruang_publik.py`, response schema yang sudah ada, terdaftar di `api.py`.

### 2.1 Ruang Publik

| Method & Path | Body | Perilaku |
|---|---|---|
| `PATCH /api/v1/public-spaces/{id}` | `RuangPublikUpdate` (semua field opsional) | Edit sebagian kolom (deskripsi, jam_operasional, alamat, verified, image_url, ...). 404 bila tak ada. |
| *(opsional)* `POST /api/v1/public-spaces` | `RuangPublikCreate` | Tambah ruang publik manual baru — **hanya bila PRD/produk meminta**; default MVP cukup PATCH + ETL |
| *(opsional)* `DELETE /api/v1/public-spaces/{id}` | — | **Hati-hati**: cascade menghapus fasilitas & laporan terkait. Rekomendasi MVP: **nonaktifkan soft-delete dulu** (mis. set `verified=false` / flag khusus) atau jangan dibuatkan sama sekali sampai ada kebutuhan jelas |

### 2.2 Fasilitas (per ruang publik)

| Method & Path | Body | Perilaku |
|---|---|---|
| `POST /api/v1/public-spaces/{id}/fasilitas` | `{ nama, kategori?, status?, lokasi_spesifik?, deskripsi? }` | Tambah fasilitas ke ruang publik |
| `PATCH` (padanan dari bentuk di atas) | sebagian field | Ubah fasilitas — **pilih bentuk path & catat keputusannya** (disarankan nested agar jelas induknya) |
| `DELETE` (padanan dari bentuk di atas) | — | Hapus fasilitas; ingat `laporan.fasilitas_id` FK — putuskan: tolak bila masih ada laporan (409) atau set NULL |

> **Kategori fasilitas**: tidak butuh tabel/master CRUD terpisah — `fasilitas.kategori` berupa teks bebas dan filter FE memakai `GET /facilities` aggregate.

### 2.3 Impor/Refresh dari Satu Data Jakarta

Pilihan (pilih satu & catat):

- **Opsi A (MVP, disarankan):** endpoint admin `POST /api/v1/public-spaces/re-sync` yang **menjalankan ulang fungsi seed** (`seed_db` dipanggil sebagai fungsi, bukan subprocess) → response jumlah baris baru. Admin tidak perlu akses shell.
- **Opsi B:** tetap manual lewat shell (`python -m app.etl.seed_db`) — cukup didokumentasikan di `etl-worker.md`, tanpa endpoint.

Keduanya **wajib mempertahankan** strategi merge §4.

---

## 3. Langkah Implementasi (urut)

- [ ] Pilih & tulis keputusan bentuk path (§2.2) + opsi impor (§2.3)
- [ ] Implementasi `PATCH /public-spaces/{id}`:
  - service `update_ruang_publik(db, id, payload)` — update field yang **tidak `None`** di payload (patch semantics, jangan menimpa kolom terisi dengan `None`)
  - router + `get_current_admin` + response `RuangPublikResponse`
- [ ] Implementasi CRUD fasilitas (nested path terpilih)
- [ ] (Opsi A) endpoint re-sync memanggil seed idempoten
- [ ] Daftarkan semua di `app/api/v1/api.py`
- [ ] Update `04-api-endpoints.md` **dan** `docs/API.md`
- [ ] Beri tahu workflow frontend: `DataMasterPage`/`KelolaFasilitasPage` tinggal menyambungkan `services.js` ke endpoint ini
- [ ] Test regresi §5

---

## 4. Strategi Merge — Edit Admin vs ETL (inti FEAT-012)

**Masalah PRD:** "Perubahan manual tidak hilang saat sinkronisasi ETL berikutnya."

**Mekanisme yang sudah ada di kode (`app/etl/seed_db.py`):**

```python
ada = set(db.scalars(select(RuangPublik.id)).all())
...
if record["id"] in ada:
    continue        # ← baris yang sudah ada TIDAK disentuh
db.add(RuangPublik(**record))
```

Konsekuensi:

| Jenis perubahan | Selamat dari seed ulang? |
|---|---|
| Edit manual admin (alamat, deskripsi, verified, foto) | ✅ Ya — seed tidak meng-update baris lama |
| Data resmi yang diperbaiki sumber (mis. koordinat dikoreksi) | ❌ Tidak ikut masuk — seed melewati ID lama |
| Data baru dari sumber resmi | ✅ Masuk (ID baru) |
| Fasilitas/laporan yang menempel | ✅ Tidak tersentuh seed (seed hanya `categories` + `ruang_publik`) |

**Aturan lanjutan (wajib dipatuhi ketika menulis sinkronisasi apa pun):**

1. **Jangan** mengganti pola "skip ID ada" dengan UPDATE overwrite seluruh baris.
2. Bila nanti perlu sinkron kolom tertentu dari sumber resmi, terapkan **field-level merge**: tentukan daftar kolom `ETL_OWNED` (mis. `latitude`, `longitude`, `alamat` bila sumber lebih otoritatif) vs `ADMIN_OWNED` (`deskripsi`, `verified`, `image_url`, `status_general`) → seed hanya menulis kolom `ETL_OWNED`, dan hanya untuk kolom yang belum pernah diedit admin.
3. **Keputusan penanda (BE-05, sudah dijalankan 2026-10-03):** penanda memakai kolom **`ruang_publik.field_source` (JSON, nullable)**, bukan tabel log terpisah. Isinya `{"nama_kolom": "waktu edit ISO-8601"}`; `NULL` = belum pernah diedit. Ditulis oleh `mark_fields_edited(db, ruang_publik, fields)` di `app/services/ruang_publik.py` — dipanggil endpoint edit admin (BE-33), dibaca proses merge ETL (BE-16). Migrasi: `c1f4a9d2e073_add_ruang_publik_field_source`.
4. Pemetaan kolom `ETL_OWNED` vs `ADMIN_OWNED` **masih ditulis di sini** saat task BE-16 dikerjakan.
5. Setiap perubahan skema (flag/dst.) = migrasi Alembic baru (`03-database-schema.md` §3).

---

## 5. Test Regresi Wajib

- [ ] `PATCH /public-spaces/{id}` tanpa token / token warga → 401/403; token admin → 200
- [ ] PATCH hanya `deskripsi` → field lain tidak berubah (patch semantics)
- [ ] PATCH body `{}` / field None → tidak menimpa kolom terisi dengan NULL
- [ ] Tambah fasilitas → muncul di `GET /facilities` (aggregate) & detail ruang publik
- [ ] **Merge test:** edit deskripsi 1 ruang publik → jalankan `seed_db` ulang → perubahan tetap ada, data baru dari CSV tetap masuk
- [ ] 404 untuk id tak ada; response selalu `RuangPublikResponse` valid

---

## 6. Verifikasi Akhir File Ini

- [ ] Hanya membahas FEAT-012 (+ dependensi yang ditandai jelas)
- [ ] Setiap endpoint baru terdaftar: `get_current_admin` ✅, `04-api-endpoints.md` ✅, `docs/API.md` ✅
- [ ] Strategi merge tertulis dan teruji (test seed ulang)
- [ ] Tidak ada endpoint tulis untuk warga/publik di file ini
