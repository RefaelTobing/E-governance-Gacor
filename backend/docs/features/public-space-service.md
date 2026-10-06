# features — Public Space Service (FEAT-001 s/d 007)

> **Scope file ini HANYA FEAT-001, 002, 003, 004, 005, 006, 007** (sesuai PRD §4.1 [`../../../docs/PRD.md`](../../../docs/PRD.md)).
> Definisi fitur lain ada di file fitur lain — jangan melebar ke topik laporan/moderasi di sini.

Kode terkait:
- Router: `app/api/v1/ruang_publik.py`, `app/api/v1/fasilitas.py`
- Service: `app/services/ruang_publik.py`
- Schema: `app/schemas/ruang_publik.py`
- Model: `app/models/ruang_publik.py`, `app/models/fasilitas.py`

---

## Status Ringkas

| FEAT | Judul | Status |
|---|---|---|
| 001 | Peta Interaktif & Radius | **Backend siap** (Haversine + koordinat terisi) |
| 002 | Daftar (List View) Ruang Publik | **Backend siap** — ada gap koordinasi unit radius FE↔BE |
| 003 | Petunjuk Arah (Direction) | **Di luar lingkup backend** (FE + OSRM) |
| 004 | Filter Kategori | **Selesai** |
| 005 | Filter Berdasarkan Fasilitas | **Selesai** |
| 006 | Halaman Detail Ruang Publik | **Selesai** (penandaan "data tidak tersedia" = tugas FE) |
| 007 | Galeri Foto | **Sebagian** — foto resmi 1/file; foto laporan belum masuk galeri |

---

## FEAT-001 — Peta Interaktif & Radius

**PRD:** titik ruang publik di peta sesuai lokasi pengguna; radius bisa diatur (default ±10 km mengikuti pola JAKI); marker ter-cluster saat kepadatan tinggi.

**Implementasi saat ini:**
- `GET /api/v1/public-spaces?lat=&long=&radius=` → Haversine dihitung **di SQL** (`_haversine_km` di `services/ruang_publik.py`), bukan di Python → filter radius + urut terdekat terjadi di database.
- Baris tanpa koordinat **dibuang** dari hasil pencarian radius (tidak bisa diukur jaraknya).
- Response menyertakan `jarak_km` (float, dihitung ulang; bukan kolom DB).
- Koordinat **sudah tersedia**: semua 1200 baris `data/processed/ruang_publik.csv` punya `latitude`/`longitude` (klaim "koordinat kosong" di dokumen lama sudah tidak berlaku).
- Clustering marker & default radius = **tugas FE** (Leaflet sudah dipakai di `apps/web`; konstanta `VITE_DEFAULT_RADIUS_KM` ada di env FE).

**Status: backend siap.** Langkah yang tersisa:

- [ ] (Koordinasi lintas) **Samakan satuan radius FE↔BE.** Backend memakai **km**; `apps/web/src/services/ruangPublikService.js` mengirim `radius` default `5000` dengan komentar "meter" → efektif 5000 km (tanpa penyaringan berarti). Pilih salah satu dan catat keputusannya:
  - opsi A (disarankan): FE kirim km (mis. `radius=2` sesuai `VITE_DEFAULT_RADIUS_KM`), backend tidak berubah;
  - opsi B: backend menerima meter → ubah unit + dokumentasikan.
- [ ] Verifikasi endpoint dengan titik acuan nyata (lihat §Verifikasi).

**Verifikasi:**
```bash
curl "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=3"
# → array berisi entri dengan jarak_km terisi dan menaik
curl ".../public-spaces?lat=-6.1754&long=106.8272&radius=0.01"
# → hampir kosong (membuktikan radius benar-benar menyaring, satuan km)
```

---

## FEAT-002 — Daftar (List View) Ruang Publik

**PRD:** daftar ruang publik dalam radius; dapat diurutkan jarak terdekat; **sinkron dengan hasil peta**.

**Implementasi saat ini:**
- Endpoint yang sama (`GET /public-spaces`) → urut `jarak` bila `lat/long` diberikan, urut `nama` bila tidak.
- `GET /api/v1/public-spaces/stats` → `{ total_ruang_publik, status_prima, perlu_perhatian }` (summary metric bar halaman daftar). Hitung fasilitas: `baik` = status_prima; selain itu (termasuk `NULL`) = perlu_perhatian.
- Sinkronisasi peta↔list = konsumsi data FE (satu response untuk dua tampilan) — tidak ada endpoint terpisah.
- `skip`/`limit` (max 500) untuk pagination.

**Status: backend siap.** Tersisa:

- [ ] (koordinasi) unit radius — sama seperti FEAT-001.
- [ ] Pastikan FE memakai `/public-spaces/stats` (sudah ada pemanggilnya di `ruangPublikService.getPublicSpacesStats`).

**Verifikasi:**
```bash
curl "http://localhost:8000/api/v1/public-spaces/stats"
# → {"total_ruang_publik": <angka>, "status_prima": <angka>, "perlu_perhatian": <angka>}
```

---

## FEAT-003 — Petunjuk Arah (Direction)

**PRD:** rute dari lokasi pengguna ke ruang publik terpilih + estimasi jarak/waktu; routing via OSRM / OpenRouteService (PRD §6.4).

**Status: TIDAK ADA tugas backend.** Routing dilakukan FE langsung ke instance OSRM publik (`VITE_OSRM_BASE_URL` di `apps/web`). Backend tidak menyimpan rute.

- [ ] (Cek lintas, opsional) Pastikan FE menampilkan estimasi jarak/waktu tanpa meminta endpoint baru. Bila nanti butuh proxy server-side (mis. agar kuota OSRM tidak dari browser), buat endpoint terpisah **di luar scope file ini** dan catat di `04-api-endpoints.md`.

---

## FEAT-004 — Filter Kategori Ruang Publik

**PRD:** filter berdasarkan kategori (RTH/taman kota, RPTRA, hutan kota, dll.), bisa dikombinasikan dengan filter fasilitas.

**Implementasi saat ini:**
- `GET /public-spaces?category=<kategori_id>` → `WHERE kategori_id = ...` (mis. `taman`, `jalur-hijau`).
- Kategori tersedia via `GET /api/v1/categories` → `[{ id, label, icon_name }]` (id manual, bukan auto-increment).
- Kombinasi kategori + fasilitas + wilayah + q sudah didukung **bersamaan dalam satu request** (semua filter AND).

**Status: selesai.**

- [ ] (Lintas FE) `apps/web/src/config/categories.js` masih mengekspor mock — FE perlu mengganti ke `GET /categories` (workflow frontend; bukan tugas backend).

**Verifikasi:**
```bash
curl "http://localhost:8000/api/v1/categories"
curl "http://localhost:8000/api/v1/public-spaces?category=taman&limit=5"
# → seluruh hasil punya kategori_id "taman"
```

---

## FEAT-005 — Filter Berdasarkan Fasilitas

**PRD:** menyaring ruang publik berdasarkan fasilitas tersedia (area bermain anak, jalur lari, toilet umum, dll.); daftar fasilitas dari data master, dapat bertambah tanpa migrasi besar.

**Implementasi saat ini:**
- `GET /facilities` → aggregate unik `(nama, kategori)` dari seluruh tabel `fasilitas` — dipakai FE mengisi dropdown; **tidak perlu CRUD fasilitas endpoint** untuk filter.
- `GET /public-spaces?facilities=X&facilities=Y` → **semua** yang diminta harus tersedia (semantik **AND** via subquery `GROUP BY ... HAVING count(distinct) = n`) — sesuai PRD "dapat dikombinasikan".
- Tabel `fasilitas` berkembang lewat seed/edit admin → kategori fasilitas baru tidak butuh migrasi (NFR-004 terpenuhi pada sisi skema).

**Status: selesai.**

**Verifikasi:**
```bash
curl "http://localhost:8000/api/v1/facilities"
curl "http://localhost:8000/api/v1/public-spaces?facilities=Bangku%20Taman&facilities=Pohon%20Peneduh&limit=5"
# → setiap entri hasil punya kedua fasilitas (cek `fasilitas[]` di respons atau detail masing-masing)
```

---

## FEAT-006 — Halaman Detail Ruang Publik

**PRD:** nama, kategori, alamat/kelurahan, koordinat, jam operasional, deskripsi, daftar fasilitas; **field yang tidak tersedia ditandai eksplisit "data tidak tersedia"** (bukan dikosongkan).

**Implementasi saat ini:**
- `GET /public-spaces/{id}` → `RuangPublikDetailResponse` = field list + `kecamatan`/`kelurahan` (BE-16) + `kategori{...}` + `fasilitas[]` + `foto[]` + `stats{baik, perlu_perhatian, rusak}`.
- Relasi di-eager-load (`joinedload` kategori & fasilitas) → anti N+1. Di list, fasilitas pakai `selectinload` karena `joinedload` koleksi + `LIMIT` memotong baris page.
- Koordinat ikut diresponse (`latitude`/`longitude`) — FE yang menampilkan di peta.
- `404` bila id tak ada.

**Status: backend siap.** Penandaan "data tidak tersedia" untuk field `NULL` (`deskripsi`, `jam_operasional`, dst.) adalah **konvensi tampilan FE** — backend sengaja mengirim `null` apa adanya (jangan mengarang nilai default di backend).

- [ ] (Lintas) Pastikan FE menampilkan penanda eksplisit sesuai PRD, bukan string kosong.

**Verifikasi:**
```bash
curl "http://localhost:8000/api/v1/public-spaces/<id>"
# → 200 dengan fasilitas[] dan foto[]; 404 untuk id ngawur
```

---

## FEAT-007 — Galeri Foto

**PRD:** foto ruang publik = gabungan sumber data resmi **dan** unggahan pengguna; **foto hasil laporan (FEAT-008) otomatis masuk galeri setelah lolos moderasi.**

**Implementasi saat ini:**
- Sisi resmi: kolom `ruang_publik.image_url` (satu URL). Router detail **membungkusnya jadi list** `foto: [image_url]` agar kontrak FE tidak berubah saat foto bertambah (lihat `api/v1/ruang_publik.py` komentar di kode).
- Sisi foto laporan: **BELUM ADA.** `laporan.foto_url` saja belum pernah terisi karena endpoint upload belum ada, apalagi mekanisme "foto lolos moderasi → galeri".

**Gap & langkah (urut):**

1. Endpoint upload foto → **prasyarat** untuk `laporan.foto_url` (pengerjaan di `features/report-service.md`, FEAT-008 — di luar file ini, hanya disebut sebagai dependensi).
2. Putuskan representasi galeri (pilih satu, catat keputusan):
   - **Opsi A (tanpa tabel baru):** galeri = `foto[]` berisi `image_url` + `foto_url` dari laporan berstatus tayang (`diverifikasi`/`dalam_penanganan`/`selesai`) milik ruang_publik tersebut → query gabungan di service detail.
   - **Opsi B (tabel baru `ruang_publik_foto`):** kolom `id, ruang_publik_id, foto_url, sumber(resmi|laporan), laporan_id NULL, created_at` → lebih rapi untuk merge FEAT-012, tapi butuh migrasi Alembic.
   Rekomendasi untuk MVP: **Opsi A** (cukup untuk "otomatis masuk galeri setelah moderasi", tanpa migrasi).
3. Rumus "lolos moderasi" mengikuti daftar status tayang yang **sama** dengan FEAT-010 (lihat `features/moderation-service.md` — perbaikan filter tayang juga menyentuh rumus ini; jangan definisikan dua daftar status tayang yang berbeda).
4. Sinkronkan `docs/API.md` + `04-api-endpoints.md` bila response berubah.

**Checklist:**

- [ ] Keputusan Opsi A/B tertulis di sini/di commit message
- [ ] `GET /public-spaces/{id}` mengembalikan foto resmi + foto laporan tayang (bila Opsi A)
- [ ] Setelah sebuah laporan di-`PATCH` status jadi `selesai`, foto-nya muncul di galeri ruang publik terkait
- [ ] `foto[]` tetap berupa list meski `image_url` masih satu

**Verifikasi:**
```bash
# sebelum: catat foto[] detail
curl "http://localhost:8000/api/v1/public-spaces/<id>"
# setelah ada laporan tayang dengan foto:
curl "http://localhost:8000/api/v1/public-spaces/<id>"   # foto[] bertambah
```

---

## Verifikasi Akhir File Ini (semua FEAT 001–007)

- [ ] Radius menyaring benar (uji radius kecil vs besar) — satuan terdokumentasi
- [ ] Urutan terdekat aktif saat `lat/long` dikirim, `jarak_km` terhitung
- [ ] Filter kategori + fasilitas + wilayah + q bisa dikombinasikan
- [ ] `/public-spaces/stats` mengembalikan 3 metrik
- [ ] Detail: 200 lengkap / 404 tidak ada; `foto[]` list
- [ ] Tidak ada endpoint baru di luar FEAT 001–007 yang dicampur ke file ini (laporan → `report-service.md`)
- [ ] `04-api-endpoints.md` & `docs/API.md` masih sinkron dengan kode
