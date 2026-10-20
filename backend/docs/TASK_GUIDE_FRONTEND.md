# Task Guide Frontend

Dokumen ini mencatat status implementasi frontend dan pekerjaan yang masih perlu diselesaikan.

Status:

- ✅ Selesai
- ⚠️ Sebagian selesai atau perlu verifikasi
- ❌ Belum dikerjakan

## A0. Setup dan Fondasi Frontend Publik

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-01 | ✅ | x` |
| FE-02 | ✅ | Routing React Router | Route publik, warga, dan admin tersedia. |
| FE-03 | ✅ | Styling dasar dan design system | Token desain serta komponen button, card, dan badge tersedia. |
| FE-04 | ✅ | Setup HTTP client Axios dengan interceptor | `config/api.js` memakai axios instance + interceptor (Bearer token & normalisasi error). Semua raw `fetch` (authService, import CSV, LoginPage) sudah dimigrasi. |
| FE-05 | ✅ | Setup environment variable | `config/constants.js` jadi satu-satunya pembaca `import.meta.env` (4 var + `IS_DEV`). `.env.example` diperbaiki (tanpa suffix `/api/v1`) dan semua var dipakai kode. |

### FE-05. Setup environment variable

**Status:** ✅

**File utama:** `apps/web/src/config/constants.js`

**File terkait:**
- `apps/web/src/config/api.js`
- `apps/web/src/services/{laporan,ruangPublik,category,stats,fasilitas}Service.js`
- `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`
- `apps/web/src/features/laporan/pages/FormLaporPage.jsx`
- `apps/web/.env.example`, `apps/web/.env`

**Pekerjaan:**

1. `config/constants.js` jadi **satu-satunya** pembaca `import.meta.env` (sesuai `docs/CONVENTIONS.md` §7). Ekspor: `API_BASE_URL`, `OSRM_BASE_URL`, `DEFAULT_RADIUS_KM`, `FAKE_GPS_THRESHOLD_M`, `IS_DEV`, dengan fallback aman + `console.warn` bila nilai numerik invalid.
2. `config/api.js` mengimpor `API_BASE_URL` dari constants (tidak lagi baca env langsung).
3. Kelima service yang membaca `import.meta.env.DEV` diganti memakai `IS_DEV` dari constants.
4. `DaftarRuangPublikPage` memakai `DEFAULT_RADIUS_KM` (default 700 km, tidak mengubah UX saat ini).
5. `FormLaporPage` menampilkan teks bantuan ambang `FAKE_GPS_THRESHOLD_M` di sidebar.
6. `.env.example` diperbaiki: `VITE_API_BASE_URL` **tanpa** suffix `/api/v1` (sebelumnya menyebabkan double-prefix `/api/v1/api/v1/...`), plus komentar per var.

**Acceptance criteria:**

- `import.meta.env` hanya dibaca di `config/constants.js`.
- `.env.example` tidak lagi menyebabkan double-prefix.
- Aplikasi tetap jalan saat env var kosong/invalid (fallback + peringatan di DEV).
- Salin `.env.example` → `.env` tidak memicu 404.

---

## A1. Peta dan Direktori Ruang Publik

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-06 | ✅ | Leaflet dan OpenStreetMap | Sudah dipakai pada peta sebaran, detail ruang publik, dan form laporan. |
| FE-07 | ✅ | Geolocation pengguna dengan fallback manual | Hook geolocation tersedia; fallback lokasi manual lewat klik/tarik pin di peta sebaran. |
| FE-08 | ✅ | Marker ruang publik dengan clustering | `react-leaflet-cluster` dipakai di peta sebaran publik dan peta dashboard admin; batas marker buatan dihapus. |
| FE-09 | ✅ | Kontrol radius pencarian | Radius pencarian sudah tersedia di halaman daftar ruang publik. |
| FE-10 | ✅ | List view sinkron dengan peta dan urutan jarak | Daftar dan sorting jarak sudah tersedia. |
| FE-11 | ✅ | Filter kategori | Filter kategori ruang publik tersedia. |
| FE-12 | ✅ | Filter fasilitas multi-select | Menggunakan dropdown multi-select khusus, filter dari API, dengan logika client-side AND. Tersinkronisasi ke URL parameter. |
|cd
| FE-14 | ✅ | Galeri foto detail | Galeri di detail ruang publik: foto resmi + dokumentasi warga digabung backend (`gabung_foto`), label "Dokumentasi Warga" via cross-ref, lightbox (prev/next). |
| FE-15 | ✅ | Routing OSRM | Hook `useRuteOsrm` + `Polyline` di peta detail (marker lokasi user + fitBounds). Default domain diperbaiki ke `router.project-osrm.org`. Tombol Google Maps tetap fallback. |

### FE-12. Filter fasilitas multi-select

**Status:** ✅

**File utama:**
- `apps/web/src/components/MultiSelectDropdown.jsx` (baru)
- `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`

**File terkait:**
- `apps/web/src/components/index.js`
- `apps/web/src/services/fasilitasService.js` (`getFacilityOptions`, sudah ada)

**Pekerjaan:**

1. Komponen `MultiSelectDropdown` (re-use CSS `.select-dropdown*`): trigger `Fasilitas (n)`, panel checklist dengan centang, tombol "Hapus pilihan", label "opsi kosong" via prop, navigasi keyboard, `role="listbox"` + `aria-selected`.
2. Halaman daftar memuat opsi filter dari `GET /api/v1/facilities` lewat `getFacilityOptions()`.
3. Filter jalan di sisi klien pada `filteredList` (useMemo) dengan semantik **AND** — sama seperti param `facilities` backend: hanya ruang publik yang memiliki **semua** fasilitas terpilih.
4. Pilihan tersinkron ke query string `?fasilitas=a,b` (CONVENTIONS §1.2); perubahan filter juga me-reset halaman ke 1.
5. `?fasilitas=` lama yang berisi nama tak dikenal dibuang saat opsi API terbaca, supaya daftar tidak kosong tanpa sebab.

**Acceptance criteria:**

- Opsi filter datang dari API, bukan hardcode.
- Multi-select: bisa memilih >1 dan membatalkan satu per satu; jumlah pilihan tampil di trigger.
- Hasil list dan peta terfilter (AND) dan berfungsi bersama search/kategori/wilayah/radius.
- "Reset Filter" mengosongkan pilihan fasilitas; ganti filter mengembalikan halaman ke 1.
- Aman saat opsi API kosong/gagal; tanpa console error.

---

### FE-07. Geolocation pengguna dengan fallback lokasi manual

**Status:** ✅

**File utama:** `apps/web/src/hooks/useGeolocation.js`

**File terkait:**
- `apps/web/src/features/ruang-publik/components/PetaSebaranLokasi.jsx`
- `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`

**Pekerjaan:**

1. `useGeolocation` menambah `setManualLocation(lat, lng)` dan `clearLocation()`, plus flag `isManual` untuk membedakan sumber koordinat (GPS vs ditandai manual).
2. `PetaSebaranLokasi` menerima prop `onSetManualLocation`: klik peta menandai lokasi (via `PetaKlikHandler`), marker "Lokasi Anda" dapat digeser, dan petunjuk singkat tampil di sudut peta.
3. `DaftarRuangPublikPage` menyalurkan `setManualLocation` ke peta; saat `geoError` muncul, pengguna diarahkan menandai lokasi manual; banner sukses menampilkan sumber lokasi + tombol "Hapus Lokasi".
4. Koordinat manual disimpan di `sessionStorage` yang sama sehingga bertahan saat refresh.

**Acceptance criteria:**

- Saat izin GPS ditolak/gagal, pengguna bisa menandai lokasi lewat klik peta dan jarak langsung dihitung dari titik itu.
- Marker lokasi bisa digeser untuk presisi.
- Label membedakan sumber lokasi (GPS vs manual).
- "Hapus Lokasi" mengembalikan acuan ke pusat Jakarta.

### FE-08. Marker ruang publik dengan clustering

**Status:** ✅

**File utama:**
- `apps/web/src/features/ruang-publik/components/PetaSebaranLokasi.jsx`
- `apps/web/src/features/moderasi/components/PetaDashboardAdmin.jsx`

**Pekerjaan:**

1. Install `react-leaflet-cluster@3.1.1` (versi kompatibel dengan React 18 & react-leaflet v4).
2. Membungkus iterasi `<Marker>` ruang publik dengan `<MarkerClusterGroup chunkedLoading disableClusteringAtZoom={17} showCoverageOnHover={false}>`.
3. Menghapus batasan manipulasi array (`slice(0, 200)` dan `slice(0, 500)`) karena library clustering bisa menangani ribuan titik tanpa membebani performa peramban (NFR-001).
4. Menyuntikkan `iconCreateFunction` khusus (`createClusterCustomIcon`) berwujud lingkaran *teal* (`#0F766E`) dan angka untuk konsistensi *brand*, menghindari class standar `MarkerCluster.Default.css`.

**Acceptance criteria:**

- Pada zoom rendah, ratusan titik ruang publik menyatu ke dalam cluster dengan angka hitungan.
- Meng-klik cluster akan mengarahkan zoom langsung ke batas-batas titik di dalamnya.
- Marker tunggal (termasuk Pin "Lokasi Anda" GPS/Manual berwarna biru) tetap tampil tersendiri tanpa dipaksa menjadi cluster tunggal.
- Peta tetap responsif merender data skala utuh dari backend tanpa *freeze*.

---

## A2. Lapor Fasilitas

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-16 | ✅ | Form laporan, kategori masalah, deskripsi, dan unggah foto | Validasi tipe serta ukuran gambar tersedia. |
| FE-17 | ✅ | Ambil lokasi HP saat submit | Browser Geolocation API mengirim `lat_user` dan `long_user`. |
| FE-18 | ✅ | Pilihan identitas anonim atau tampilkan nama | Pilihan tersedia dengan default anonim. |
| FE-19 | ✅ | Status hasil submit | Mengganti alert umum dengan panel hasil interaktif membedakan laporan tayang dan menunggu tinjauan beserta alasan kualitatif. |
| FE-20 | ✅ | Riwayat laporan per ruang publik | Section "Pembaruan Partisipasi Warga" diperkaya: filter status tersinkron query string (`?status=`) + tombol "Muat Lebih Banyak". |
| FE-21 | ✅ | Flag laporan tayang | Aksi "Tandai Tidak Pantas" di detail ruang publik (BE-25); 409 = sudah ditandai. Selesai di Fase C. |

### FE-19. Status hasil submit laporan

**Status:** ✅

**File utama:** `apps/web/src/features/laporan/pages/FormLaporPage.jsx`

**File terkait:**
- `apps/web/src/features/laporan/components/StatusHasilSubmit.jsx` (baru)
- `apps/web/src/services/laporanService.js`

**Pekerjaan:**

1. `createReport` di `laporanService.js` menangkap response `POST /api/v1/reports` dan menormalisasinya lewat `transformLaporanResponse` (camelCase + `status`).
2. Komponen `StatusHasilSubmit.jsx` menampilkan dua mode sesuai `status`:
   - `diverifikasi`/`dalam_penanganan`/`selesai` → **Laporan Tayang** (auto-tayang lolos validasi lokasi).
   - `menunggu_verifikasi` → **Menunggu Tinjauan Admin**, lengkap dengan alasan kualitatif dari `jarak_browser_rp`/`jarak_exif_rp` (tanpa angka presisi).
3. `FormLaporPage` menyimpan response ke state `submitResult`; saat terisi, form diganti panel hasil (bukan `alert` + redirect).
4. Tombol "Lihat Detail Laporan" hanya tampil saat login (route `/laporan-saya/:id` dilindungi), plus "Kirim Laporan Lain" dan "Kembali ke Beranda".
5. Aksesibilitas: `role="status"`, `aria-live="polite"`, fokus otomatis ke heading hasil.

**Acceptance criteria:**

- Pengguna melihat panel hasil yang membedakan laporan tayang vs menunggu tinjauan sesuai respons backend.
- Panel menampilkan ID laporan, fasilitas, dan ruang publik.
- Pengguna anonim tidak diarahkan ke route protected.
- Tidak ada angka presisi koordinat/jarak yang bocor ke UI publik.

---

### Titik Presisi Fasilitas

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-16A | ✅ | Peta titik presisi fasilitas | Form laporan memakai Leaflet dan tile OpenStreetMap. |
| FE-16B | ✅ | Pin lokasi fasilitas | Pin dapat digeser atau dipindahkan dengan klik peta. |
| FE-16C | ✅ | Kirim koordinat lokasi fasilitas | Mengirim `lat_lokasi_pilihan` dan `long_lokasi_pilihan`, terpisah dari GPS HP pengguna. |
| FE-16D | ⚠️ | Koordinat individual fasilitas | Master fasilitas belum memiliki koordinat individual, sehingga posisi awal menggunakan koordinat ruang publik. |

## A3. Panel Admin

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-22 | ✅ | Struktur panel admin dan routing | Admin layout serta route dashboard tersedia dalam aplikasi saat ini. |
| FE-23 | ⚠️ | Login admin | Halaman login dan guard tersedia, alur redirect perlu diuji. |
| FE-24 | ✅ | Dashboard moderasi laporan | Daftar laporan menunggu verifikasi tersedia. **Catatan BE-52/BE-28:** baca antrian dari `GET /api/v1/admin/reports` (semua status, `?status` tervalidasi kanonik), bukan `GET /reports` yang kini hanya laporan tayang; `AntrianModerasiPage`/`DashboardPage` perlu ganti URL (sesi FE). |
| FE-25 | ⚠️ | Detail laporan moderasi | Foto, deskripsi, dan aksi status tersedia. Titik presisi masih perlu memakai data laporan, bukan teks hardcode. Tombol **Setujui** (BE-29) dan **Tolak** (BE-30) belum ada; endpoint `POST /admin/reports/{id}/approve` dan `POST /admin/reports/{id}/reject` sudah siap, lihat sub-bagian FE-25A/FE-25B di bawah. |
| FE-26 | ❌ | Daftar laporan yang di-flag | Backend siap: `GET /api/v1/admin/reports/flagged` (BE-31) mengembalikan laporan ter-flag + `flag_count`, urut terbanyak. UI belum dibuat. |
| FE-27 | ⚠️ | Manajemen data master ruang publik | Halaman tersedia, indikator edit manual perlu diverifikasi/dilengkapi. |
| FE-28 | ❌ | Trigger sinkronisasi ETL dari admin | Endpoint backend tersedia, kontrol UI belum tersedia. |

### FE-25A. Tombol Setujui di Detail Moderasi (integrasi BE-29)

**Status:** ❌ (backend siap sejak 2026-10-08, UI belum ada)

**File utama:** `apps/web/src/features/moderasi/pages/DetailModerasiPage.jsx`, `apps/web/src/services/laporanService.js`

**Pekerjaan:**

1. Tambah tombol "Setujui" di panel Tindakan Petugas (urutan pertama, sebelum "Tandai Dalam Penanganan").
2. Panggil `POST /api/v1/admin/reports/{id}/approve` dengan body opsional `{ "description": catatanPetugas }`; tanpa catatan, kirim tanpa body.
3. Tangani `409` (status sekarang di luar `menunggu_verifikasi`/`ditolak`, misal laporan sudah tayang): tampilkan pesan jelas dan muat ulang detail, jangan tampilkan sukses palsu.
4. Setelah `200`, perbarui state halaman dari response (`LaporanDetailResponse`: status + timeline) lalu arahkan kembali ke antrian.

**Acceptance criteria:**

- Laporan `menunggu_verifikasi` bisa disetujui dari UI: status jadi `diverifikasi`, timeline bertambah "Laporan disetujui", laporan muncul di halaman publik.
- Approve ganda atau laporan yang sudah tayang memunculkan pesan `409`, bukan sukses.
- Tanpa sesi admin, permintaan tidak terkirim (atau error `401`/`403` tampil jelas).

**Catatan backend untuk FE (per 2026-10-08, yang kurang dari sisi backend):**

- `PATCH /reports/{id}/status` **kini memvalidasi enum + transisi** (BE-51, 2026-10-08). FE wajib hanya mengirim nilai kanonik: `menunggu_verifikasi`, `diverifikasi`, `dalam_penanganan`, `selesai`, `ditolak`. Nilai lain → `422`; transisi mundur (mis. `selesai` → `menunggu_verifikasi`) → `422`. Alur yang tetap diizinkan: `dalam_penanganan`/`selesai` dari tahap sebelumnya, `ditolak` dari status mana pun, `ditolak` → `diverifikasi`, dan mengirim status yang sama (idempotent).
- `GET /admin/reports` **belum mendukung `?flagged=`** (BE-31) - daftar flagged (FE-26) ada di route terpisah `GET /admin/reports/flagged` (sudah siap), bukan query param.
- Setujui dari status `ditolak` memang diizinkan (laporan bisa ditinjau ulang); hanya status yang sudah tayang yang ditolak `409`.

### FE-25B. Tombol Tolak di Detail Moderasi (integrasi BE-30)

**Status:** ❌ (backend siap sejak 2026-10-09, UI belum ada)

**File utama:** `apps/web/src/features/moderasi/pages/DetailModerasiPage.jsx`, `apps/web/src/services/laporanService.js`

**Pekerjaan:**

1. Ganti aksi tombol "Tolak" (kini `PATCH /reports/{id}/status` dengan `status: 'ditolak'`) menjadi `POST /api/v1/admin/reports/{id}/reject`.
2. Wajib kirim body `{ "alasan": "..." }`; munculkan dialog/input alasan dulu. Alasan kosong dijaga klien **dan** backend (`422`).
3. Tangani `409` (laporan sudah `ditolak`): tampilkan pesan jelas dan muat ulang detail.
4. Setelah `200`, perbarui state dari response (`LaporanDetailResponse`): `status: 'ditolak'`, field `alasan_penolakan` terisi, timeline bertambah "Laporan ditolak".

**Acceptance criteria:**

- Laporan `menunggu_verifikasi` bisa ditolak dari UI: status jadi `ditolak`, `alasan_penolakan` tampil, timeline bertambah, laporan hilang dari halaman publik.
- Tolak tanpa alasan tidak terkirim (validasi UI) atau menampilkan error `422`.
- Laporan yang sudah `ditolak` memunculkan pesan `409`, bukan sukses.

**Catatan backend untuk FE (per 2026-10-09):**

- Field `alasan_penolakan` kini **ada di response** (`LaporanResponse`/`LaporanDetailResponse`); tampilkan dari field ini, bukan hanya dari timeline.
- Aksi tolak kini endpoint khusus dengan alasan tersimpan; `PATCH /reports/{id}/status` tetap ada untuk transisi `dalam_penanganan`/`selesai` (enum + transisi sudah divalidasi = BE-51, 2026-10-08: nilai di luar kanonik atau lompatan mundur → `422`; `ditolak` via PATCH masih diizinkan sementara sampai tombol ini pindah).
- Laporan tayang boleh diturunkan lewat reject (tidak `409`); hanya yang sudah `ditolak` yang `409`.

---

## A4. Testing Frontend

| ID | Status | Task |
| --- | --- | --- |
| FE-29 | ✅ | Unit test komponen kritikal memakai React Testing Library (vitest; 7 file/42 test: StatusBadge, Button, Input, Modal, MultiSelectDropdown, redirectAman, useRuteOsrm). |
| FE-30 | ✅ | Uji manual browser desktop dan mobile untuk halaman publik serta admin - checklist: `CHECKLIST_UJI_MANUAL-2026-10-10.md`. |
| FE-31 | ✅ | Uji alur end-to-end: cari ruang publik, lihat detail, kirim laporan, cek status, dan moderasi admin - checklist: `CHECKLIST_E2E_FE31-2026-10-10.md`. |

## A5. Build dan Deploy

| ID | Status | Task |
| --- | --- | --- |
| FE-32 | ✅ | Build production frontend publik dan admin, serta konfigurasi environment production (`.env.production`; placeholder URL API `https://api.example.com`). |
| FE-33 | ❌ | Deploy frontend publik dan admin ke domain atau subdomain terpisah. **Ditunda** atas keputusan user (backend belum di-deploy). |

## A6. Task Tambahan (Bug Fix & Improvement)

Ringkasan status:

| ID | Status | Task |
| --- | --- | --- |
| FE-34 | ✅ | Kolom alamat di halaman Kelola Fasilitas |
| FE-35 | ✅ | Kartu peta sebaran dashboard jadi kotak |
| FE-36 | ✅ | Detail ruang publik wajib login |
| FE-37 | ✅ | Guest tidak boleh menyimpan ruang |
| FE-38 | ✅ | Hapus opsi "Paling Relevan" |
| FE-39 | ✅ | Hapus gambar dummy "Area Pelaporan" |
| FE-40 | ✅ | Label "Kondisi Baik" konsisten |
| FE-41 | ✅ | Pengaturan page size 10/20/50/100 |
| FE-42 | ✅ | Status fasilitas HomePage jadi Baik |
| FE-43 | ✅ | Tampilan session admin di navbar publik |
| FE-45 | ✅ | Zoom pinch trackpad di peta (selesai, terverifikasi di 3 peta) |
| FE-46 | ✅ | Foto ruang publik jadi kotak, hapus teks di atas foto |
| FE-47 | ✅ | Tombol panah kiri-kanan pada galeri foto ruang publik |
| FE-48 | ✅ | Seragamkan rounded corner tombol dan kontrol |
| FE-49 | ✅ | Halaman dimulai dari tengah saat berpindah rute |
| FE-50 | ✅ | Hapus simbol yang tidak membawa informasi di judul dan label |
| FE-51 | ✅ | Filter kondisi fasilitas publik jadi dropdown |
| FE-52 | ✅ | Perbaikan tampilan foto bukti di halaman review laporan |
| FE-53 | ✅ | Hapus atau ganti simbol di halaman Tentang |
| FE-54 | ❌ | Perbaikan sistem warna: badge, mode gelap, dan palet |

### FE-34. Tambah kolom alamat pada halaman Kelola Fasilitas (Admin)

**Status:** ✅

**File utama:** `apps/web/src/features/data-master/pages/KelolaFasilitasPage.jsx`

**Pekerjaan:**

1. Tambahkan header tabel `ALAMAT` (line ~115).
2. Tambahkan sel `<td>` khusus untuk alamat menggunakan `ruang.alamat || 'Alamat belum tersedia'`.
3. Hapus rendering alamat yang saat ini berada di bawah nama ruang publik (line 127-129).
4. Pertahankan kolom nama ruang publik hanya untuk nama, tanpa ikon MapPin dan alamat.
5. Pastikan layout tabel tidak overflow pada layar kecil.

**Acceptance criteria:**

- Tabel memiliki kolom: Ruang Publik, Alamat, Wilayah, Fasilitas Standar, Aksi.
- Alamat tidak lagi tampil di bawah nama ruang publik.
- Layout tabel responsif tanpa scroll horizontal pada layar mobile.

---

### FE-35. Ubah kartu peta sebaran dashboard menjadi kotak

**Status:** ✅

Catatan: permintaan awal adalah mengubah bentuk pin marker, tetapi maksud sebenarnya
adalah mengubah kontainer/kartu peta pada dashboard dari persegi panjang menjadi kotak.
Pin marker dikembalikan ke bentuk semula.

**File utama:** `apps/web/src/features/moderasi/pages/DashboardPage.jsx`

**File terkait:** `apps/web/src/features/moderasi/components/PetaDashboardAdmin.jsx`

**Pekerjaan:**

1. Ubah grid dashboard dari `1fr 340px` menjadi `repeat(auto-fit, minmax(340px, 1fr))` agar kartu peta dan ringkasan kategori seimbang.
2. Ubah tinggi peta dari `320px` tetap menjadi `aspectRatio: 1 / 1` dengan `maxHeight: 520px` supaya area peta berbentuk kotak.
3. Kembalikan marker ke bentuk pin semula (`border-radius: 50% 50% 50% 0` + `rotate(-45deg)`) di `PetaDashboardAdmin.jsx` dan `PetaSebaranLokasi.jsx`.

**Acceptance criteria:**

- Kartu peta sebaran di dashboard berbentuk kotak, bukan persegi panjang memanjang.
- Marker tetap berbentuk pin.
- Popup dan klik marker berfungsi normal.
- Layout responsif pada layar kecil.

---

### FE-36. Detail ruang publik wajib login

**Status:** ✅

**File utama:** `apps/web/src/App.jsx`

**File terkait:** `apps/web/src/routes/RequireAuth.jsx`

**Pekerjaan:**

1. Bungkus route `/ruang-publik/:id` (line 46) dengan komponen `RequireAuth`:

```jsx
<Route
  path="/ruang-publik/:id"
  element={
    <RequireAuth>
      <DetailRuangPublikPage />
    </RequireAuth>
  }
/>
```

2. Pastikan pengguna belum login diarahkan ke `/login`.
3. Simpan `state.from` untuk redirect setelah login berhasil.
4. Pastikan route admin tetap memakai `RequireAdmin` tanpa terpengaruh perubahan ini.

**Acceptance criteria:**

- Guest tidak dapat melihat halaman detail ruang publik tanpa login.
- Setelah login, pengguna otomatis kembali ke halaman detail yang sebelumnya dibuka.
- Pengguna terautentikasi dapat mengakses detail tanpa redirect berulang.

---

### FE-37. Guest tidak boleh menyimpan ruang

**Status:** ✅

**File utama:** `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`

**File terkait:**
- `apps/web/src/context/ProfilContext.jsx`
- `apps/web/src/context/AuthContext.jsx`

**Pekerjaan:**

1. Import `useAuth` dan `useProfil`:

```jsx
import { useAuth } from '../../../context/AuthContext';
import { useProfil } from '../../../context/ProfilContext';
```

2. Tambahkan hook di komponen (line ~60):

```jsx
const { user, token } = useAuth();
const { toggleSaveSpace, isSpaceSaved } = useProfil();
const isSaved = isSpaceSaved(detail.id);
```

3. Ganti tombol simpan (line 190-192):

```jsx
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    if (!user || !token) {
      alert('Silakan login untuk menyimpan ruang publik.');
      navigate('/login', { state: { from: location } });
      return;
    }
    toggleSaveSpace(detail.id);
  }}
  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
>
  <Bookmark size={14} /> {isSaved ? 'Tersimpan' : 'Simpan Ruang'}
</Button>
```

4. (Opsional defense-in-depth) Tambahkan guard di `ProfilContext.jsx` pada `toggleSaveSpace` (line 72-76):

```jsx
const toggleSaveSpace = (spaceId) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('toggleSaveSpace dipanggil tanpa autentikasi');
    return;
  }

  setSavedSpaces((prev) =>
    prev.includes(spaceId)
      ? prev.filter((id) => id !== spaceId)
      : [...prev, spaceId]
  );
};
```

5. Pisahkan data ruang tersimpan per pengguna (opsional improvement):
   - Gunakan key localStorage seperti `ruka_saved_spaces_${userId}`.
   - Saat logout, hapus data tersimpan user tersebut atau kosongkan state.

**Acceptance criteria:**

- Guest tidak dapat menyimpan ruang publik; klik tombol mengarahkan ke login.
- User login dapat menyimpan dan membatalkan simpan ruang.
- State tombol berubah sesuai status: `Simpan Ruang` atau `Tersimpan`.
- Ruang tersimpan akun A tidak tampil pada akun B di browser yang sama.

---

### FE-38. Hapus opsi "Paling Relevan" dari filter Urutkan

**Status:** ✅

**File utama:** `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`

**Pekerjaan:**

1. Hapus `'Paling Relevan'` dari `SORT_OPTIONS` (line 17):

```jsx
const SORT_OPTIONS = ['Jarak Terdekat', 'Kondisi Terbaik'];
```

2. Hapus `relevan: 'Paling Relevan'` dari `SORT_LABELS` (line 18-22).

3. Ubah default `sortBy` dari `'relevan'` ke `'terdekat'` (line 42):

```jsx
const [sortBy, setSortBy] = useState('terdekat');
```

4. Pastikan URL lama dengan `?sort=relevan` tidak menyebabkan error; fallback ke `'terdekat'`.

**Acceptance criteria:**

- Dropdown urutkan hanya menampilkan "Jarak Terdekat" dan "Kondisi Terbaik".
- Default sorting adalah "Jarak Terdekat".
- Tidak ada error saat membuka URL lama dengan parameter sort lain.

---

### FE-39. Hapus gambar dummy "Area Pelaporan" di Form Lapor

**Status:** ✅

Catatan: awalnya salah diubah menjadi peta mini di section detail, tetapi maksud sebenarnya
adalah menghapus blok gambar dummy pada sidebar form laporan.

**File utama:** `apps/web/src/features/laporan/pages/FormLaporPage.jsx`

**Pekerjaan:**

1. Hapus blok gambar `detail.image` dengan overlay `AREA PELAPORAN` yang ada di sidebar kanan form laporan (sekitar line 657-663).
2. Pertahankan info teks (jam operasional, status penerangan) dan kotak info biru.
3. Kembalikan section "Peta Akses & Batas Kawasan" di detail ruang publik ke gambar foto semula (revisi dari percobaan peta mini).

**Acceptance criteria:**

- Sidebar form laporan tidak lagi menampilkan gambar dummy "Area Pelaporan".
- Section detail ruang publik menampilkan gambar lokasi seperti semula.
- Layout sidebar dan detail tetap rapi.

---

### FE-40. Samakan label status fasilitas menjadi "Kondisi Baik"

**Status:** ✅

**File utama:**
- `apps/web/src/features/ruang-publik/pages/HomePage.jsx`
- `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`
- `apps/web/src/features/tentang/pages/TentangPage.jsx`

**Pekerjaan:**

1. **HomePage.jsx** (line 468, 490): Status badge sudah memakai "Kondisi Baik" — tidak perlu diubah.

2. **DaftarRuangPublikPage.jsx** (line 296-298): Ganti label "STATUS PRIMA" menjadi "KONDISI BAIK":

```jsx
<span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-success)' }}>KONDISI BAIK</span>
```

3. **TentangPage.jsx** (line 237-239, 324-325): Label sudah memakai "Kondisi Baik" — tidak perlu diubah.

4. Pastikan semua referensi ke `metrics?.statusPrima` tetap berfungsi (hanya label yang berubah, bukan key data).

**Acceptance criteria:**

- Semua label statistik menggunakan istilah konsisten "Kondisi Baik", bukan "Status Prima".
- Tidak ada perubahan pada nilai atau key data dari API.
- Tidak ada visual yang rusak setelah perubahan label.

---

### FE-41. Pengaturan jumlah data per halaman (Page Size: 10/20/50/100)

**Status:** ✅

**File utama:** `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`

**Pekerjaan:**

1. Tetapkan pilihan page size menjadi `PAGE_SIZE_OPTIONS = [10, 20, 50, 100]` (default 10).
2. Letakkan dropdown pilihan di bar navigasi paginasi bawah, sejajar dengan teks "Halaman X dari Y".
3. Simpan pilihan ke `localStorage` (`ruka_page_size`) agar persisten antar-sesi.
4. Reset nomor halaman ke 1 saat pilihan ukuran halaman berubah.

**Acceptance criteria:**

- Dropdown menampilkan opsi 10, 20, 50, dan 100 per halaman.
- Tampil di bar navigasi paginasi bawah.
- Pilihan persisten di `localStorage`.
- Nomor halaman otomatis kembali ke halaman 1 saat ukuran diubah.

---

### FE-42. Section "Cek Kondisi Fasilitas" di HomePage: semua status jadi Baik

**Status:** ✅

---

### FE-43. Tampilan session admin di navbar publik (PublicLayout)

**Status:** ✅

**File utama:** `apps/web/src/layouts/PublicLayout.jsx`

**Pekerjaan:**

1. Tambahkan cabang khusus saat `user && (role === 'admin' || role === 'dinas')` di area `navbar-actions`.
2. Tampilkan tombol **"Dashboard"** (pindah ke `/dashboard`) dan tombol **"Keluar"** (`logout()`).
3. Pengelola yang logout diarahkan ke `/login-pemerintah`.
4. Cegah session admin tersisa yang membuat navbar tampil "Masuk/Register" padahal sedang terautentikasi.

**Acceptance criteria:**

- Akun pengelola yang login melihat tombol Dashboard dan Keluar di navbar publik.
- Klik Keluar membersihkan localStorage dan mengarahkan ke login pemerintah.
- Pengunjung tanpa login tetap melihat tombol Masuk dan Register.

**File utama:** `apps/web/src/features/ruang-publik/pages/HomePage.jsx`

**Pekerjaan:**

1. Ubah status badge pada semua kartu fasilitas (line 452-504) menjadi `status="baik"`:

```jsx
<StatusBadge status="baik" customLabel="Status umum: Kondisi Baik" />
```

2. Hapus kartu dengan status `"rusak"` dan `"perlu_perhatian"` ATAU ubah semua menjadi `"baik"`.

3. Pastikan teks deskripsi masih realistis meskipun statusnya baik semua.

**Acceptance criteria:**

- Semua kartu di section "Cek Kondisi Fasilitas Sebelum Berkunjung" menampilkan badge hijau "Kondisi Baik".
- Tidak ada status "Rusak" atau "Perlu Perhatian".
- Visual badge konsisten dengan status lain di aplikasi.

---

### FE-44. Tombol like foto di galeri ruang publik (rencana)

**Status:** ❌ (rencana, menunggu backend BE-58)

**File utama:** `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`

**Pekerjaan:**

1. Tampilkan tombol like + `like_count` pada tiap foto di galeri (`detail.foto`).
2. Panggil endpoint like/unlike (BE-58) saat diklik; pengunjung tanpa login diarahkan
   untuk masuk lebih dulu.
3. Tandai visual foto yang berasal dari laporan warga yang sudah dipromosikan ke galeri.

**Acceptance criteria:**

- Pengguna login bisa like/unlike; jumlah berubah tanpa reload penuh.
- Pengunjung tanpa login tidak bisa like (diarahkan ke halaman masuk).
- Foto laporan dengan like di atas ambang ikut tampil di galeri ruang publik.

---

### FE-45. Zoom pinch trackpad di peta mengezoom halaman, bukan peta

**Status:** ✅

**Sudah dikerjakan:**

1. Komponen baru `apps/web/src/components/PetaZoomPinch.jsx`, dirender di dalam
   `MapContainer` pada tiga peta: `PetaSebaranLokasi.jsx:218`,
   `DetailRuangPublikPage.jsx:424`, `PetaDashboardAdmin.jsx:164`.
2. Diekspor dari `apps/web/src/components/index.js`.
3. `scrollWheelZoom={false}` dipertahankan di ketiga peta, supaya tidak terjadi
   penanganan ganda antara handler Leaflet dan komponen ini.
4. `FormLaporPage.jsx` dibiarkan apa adanya, karena handler wheel-nya memang sudah aktif.
5. `npm run build` dari `apps/web` lulus.

**Hasil verifikasi jalankan** (dev server 5173, Chromium lebar 1280px, event `ctrl+wheel`
dikirim lewat Chrome DevTools Protocol):

| Kriteria | `/ruang-publik` | `/ruang-publik/:id` | `/dashboard` |
| --- | --- | --- | --- |
| `wheel` listener terpasang | ada (sebelumnya tidak ada) | ada | ada |
| pinch dicegah | `defaultPrevented = true` | terbukti sama | terbukti sama |
| level zoom peta berubah | 13 → 15 → 14 | 15 → 17 → 16 | 13 → 15 → 14 |
| halaman tidak ikut mengezoom | `visualViewport.scale` 1, `devicePixelRatio` 1 | sama | sama |
| scroll biasa tetap menggulir halaman | `scrollY` 411 → 971, zoom tetap 14 | `scrollY` 251 → 811, zoom tetap | `scrollY` 406 → 831, zoom tetap |
| error konsol | tidak ada | tidak ada | tidak ada |

Uji tambahan pada `/ruang-publik`:

- **Zoom terkunci di titik kursor.** Pinch di 4 posisi berbeda; koordinat di bawah kursor
  hanya bergeser `0.000005` sampai `0.000069` derajat, sementara pusat peta bergeser
  `0.0024` sampai `0.0397` derajat. Artinya peta tidak selalu mengezoom ke tengah.
- **Batas zoom.** Rentang peta `minZoom` 0 dan `maxZoom` 18. Dari zoom 13 dengan 28
  dorongan masuk, hasilnya berhenti tepat di 18 tanpa error.
- **Pembersihan listener.** Jumlah listener `wheel` tetap 1 setelah keluar-masuk rute
  sebanyak 3 kali, jadi tidak ada penumpukan.

**Perbandingan sebelum dan sesudah** (bukti bug-nya nyata dan perbaikannya nyata): pada
kode sebelum FE-45, `.leaflet-container` tidak memiliki listener `wheel` sama sekali,
`ctrl+wheel` tiba dengan `defaultPrevented = false`, dan zoom peta tetap 13.

**Catatan pengujian yang penting untuk diingat.** Pengujian peta dengan peramban otomatis
bisa memberi hasil palsu bila tab tidak sedang ditampilkan: `requestAnimationFrame` tidak
menyala, sehingga animasi zoom Leaflet tidak pernah selesai, `_animatingZoom` tertinggal
bernilai benar, dan SEMUA zoom berhenti bekerja, termasuk tombol `+`/`-` bawaan Leaflet.
Terukur langsung: 0 frame per 1,2 detik sebelum tab dibawa ke depan, lalu 144 frame
sesudahnya. Karena itu, panggil `Page.bringToFront` sebelum menguji peta.

**Batas pengujian yang jujur:**

1. Pinch dikirim sebagai event `ctrl+wheel`, persis mekanisme yang dipakai Chromium untuk
   pinch trackpad, tetapi tetap bukan jari di permukaan trackpad fisik. Belum diuji di
   perangkat nyata.
2. Batas bawah zoom tidak dibuktikan sampai dasar; yang terbukti adalah batas atas.
3. Bukan pengujian layar sentuh di HP. Pinch layar sentuh lewat jalur `touchstart` Leaflet,
   masalah berbeda, lihat bagian "Di luar cakupan" di bawah.
4. Halaman yang butuh login diuji memakai mock backend sementara, bukan FastAPI + database
   asli (MySQL di mesin ini tidak berjalan).

**Gejala:** di laptop, arahkan kursor ke peta OSM lalu lakukan pinch trackpad (dua jari
keluar/masuk). Yang mengezoom bukan peta, melainkan halaman browser. Scroll biasa (dua
jari geser) tetap normal.

**Akar masalah:** Chromium menerjemahkan pinch trackpad menjadi event `wheel` dengan
`ctrlKey = true`, bukan event sentuh. Jadi peta harus merebut event itu dan memanggil
`preventDefault()`. Tiga dari empat peta mematikan handler wheel Leaflet:

| File | Baris | Nilai |
| --- | --- | --- |
| `features/ruang-publik/components/PetaSebaranLokasi.jsx` | 213 | `scrollWheelZoom={false}` |
| `features/ruang-publik/pages/DetailRuangPublikPage.jsx` | 417 | `scrollWheelZoom={false}` |
| `features/moderasi/components/PetaDashboardAdmin.jsx` | 155 | `scrollWheelZoom={false}` |
| `features/laporan/pages/FormLaporPage.jsx` | 661 | `scrollWheelZoom` (aktif) |

Dengan `scrollWheelZoom: false`, Leaflet tidak memasang handler `wheel` sama sekali
(`ScrollWheelZoom.removeHooks` memanggil `off(container, 'wheel', ...)` di
`leaflet-src.js`). Tidak ada yang memanggil `preventDefault()`, sehingga browser bebas
melakukan aksi defaultnya: zoom halaman.

**Bukti verifikasi (browser, dev server `localhost:5173`):**

1. `DOMDebugger.getEventListeners` pada `.leaflet-container` halaman `/ruang-publik`:
   ada `scroll, click, dblclick, mousedown, mouseup, mouseover, mouseout, mousemove,
   contextmenu, keypress, keydown, keyup, touchstart ×2, focus, blur`. Event `wheel`
   **tidak ada**.
2. Kirim `wheel` dengan `ctrlKey: true` pada kursor yang berada di atas peta:
   `defaultPrevented = false`, level zoom tile peta tetap `13` (tidak berubah).

Catatan: Leaflet 1.9.4 tidak membedakan `ctrl+wheel` dari wheel biasa; `getWheelDelta()`
memperlakukan keduanya sama. Satu-satunya pembeda adalah kode kita sendiri.

**File utama (baru):** `apps/web/src/components/PetaZoomPinch.jsx`

**File terkait:**

- `apps/web/src/components/index.js` (tambah barrel export)
- `apps/web/src/features/ruang-publik/components/PetaSebaranLokasi.jsx`
- `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`
- `apps/web/src/features/moderasi/components/PetaDashboardAdmin.jsx`

**Penempatan komponen:** dipakai 3 peta di 2 fitur berbeda (ruang-publik dan moderasi),
jadi sesuai `docs/CONVENTIONS.md` (aturan penempatan komponen) tempatnya di
`components/` root, bukan di dalam salah satu fitur.

**Pekerjaan:**

1. Buat komponen `PetaZoomPinch` yang dirender **di dalam** `MapContainer` (memakai
   `useMap()` dari `react-leaflet`). Komponen memasang listener `wheel` pada container
   peta dengan `{ passive: false }`, dan **hanya** menangani event yang `ctrlKey === true`:

```jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Chromium mengirim pinch trackpad sebagai `wheel` + `ctrlKey`.
 * Saat `scrollWheelZoom={false}`, Leaflet tidak memasang handler wheel sama sekali,
 * sehingga browser mengezoom halaman. Komponen ini merebut hanya event pinch,
 * dan membiarkan scroll biasa (tanpa ctrlKey) lewat supaya halaman tetap bisa digeser.
 */
const LANGKAH_ZOOM = 0.5;

export const PetaZoomPinch = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const saatWheel = (event) => {
      if (!event.ctrlKey) return;      // dua jari geser: biarkan halaman yang scroll
      event.preventDefault();           // pinch: tahan zoom halaman

      const arah = event.deltaY < 0 ? 1 : -1;
      map.setZoomAround(
        map.mouseEventToContainerPoint(event),
        map.getZoom() + arah * LANGKAH_ZOOM
      );
    };

    container.addEventListener('wheel', saatWheel, { passive: false });
    return () => container.removeEventListener('wheel', saatWheel);
  }, [map]);

  return null;
};

export default PetaZoomPinch;
```

   Sketsa di atas adalah titik awal, bukan implementasi final yang sudah diuji.
   Yang mengikat adalah kriteria penerimaan di bawah.

2. Ekspor dari `apps/web/src/components/index.js`.
3. Render `<PetaZoomPinch />` di dalam `MapContainer` pada ketiga peta:
   `PetaSebaranLokasi.jsx`, `DetailRuangPublikPage.jsx`, dan `PetaDashboardAdmin.jsx`.
4. **Pertahankan `scrollWheelZoom={false}`** di ketiga peta. Kalau diubah jadi aktif,
   handler wheel Leaflet ikut terpasang dan terjadi penanganan ganda.
5. Jangan menyentuh `FormLaporPage.jsx`: peta di sana sudah aktif dan perilakunya sudah
   benar. Samakan hanya kalau memang ingin seragam, dan sebutkan alasannya.
6. Zoom tetap dibatasi `minZoom`/`maxZoom` peta (otomatis oleh `setZoomAround`).

**Acceptance criteria:**

- Kursor di atas peta + pinch trackpad: level zoom **peta** berubah, halaman browser tidak mengezoom.
- Zoom terjadi di sekitar titik kursor, bukan selalu di tengah peta.
- Scroll biasa (dua jari geser, `ctrlKey` false) di atas peta tetap menggulir halaman; peta tidak ikut zoom.
- Berlaku di ketiga peta (`/ruang-publik`, `/ruang-publik/:id`, `/dashboard`).
- Zoom berhenti di batas minimum dan maksimum tanpa error.
- Tidak ada error di console dan listener dibersihkan saat unmount (pindah halaman lalu kembali tanpa penumpukan listener).
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Jalankan `npm run dev` dari `apps/web` dan buka `/ruang-publik`.
2. Arahkan kursor ke atas peta, lakukan pinch trackpad. Pastikan level zoom peta berubah
   dan halaman tidak ikut mengezoom.
3. Ulangi untuk scroll biasa di atas peta: halaman yang bergeser.
4. Ulangi di `/ruang-publik/:id` (setelah login) dan `/dashboard` (akun admin).
5. Periksa console browser tetap bersih setelah beberapa kali pindah halaman.

**Di luar cakupan:** pinch **layar sentuh** di HP melewati jalur `touchstart` Leaflet,
bukan `wheel`. Di sana dua jari harus mendarat di dalam kontainer peta; karena tinggi peta
saat ini hanya 320px (`PetaSebaranLokasi.jsx:155`), jari mudah jatuh di luar area dan
pinch ikut mati. Perbaikan itu terpisah dan perlu uji di perangkat fisik.

---

### FE-46. Foto ruang publik jadi kotak, hapus teks di atas foto

**Status:** ✅

**Maksud permintaan:** foto ruang publik dibuat berbentuk kotak (rasio persegi), dan
tulisan nama ruang publik yang menempel di atas foto dihapus.

**Preseden "kotak":** FE-35 sudah menetapkan arti kata ini di proyek. Kartu peta dashboard
diubah dari tinggi tetap menjadi `aspectRatio: '1 / 1'` + `maxHeight`
(`PetaDashboardAdmin.jsx:150`). Jadi "kotak" = rasio 1:1, bukan sudut tumpul.

**File utama:** `apps/web/src/features/ruang-publik/pages/HomePage.jsx`

**File terkait:**

- `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`
- `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`
- `apps/web/src/features/laporan/pages/RiwayatLaporanPage.jsx`
- `apps/web/src/features/laporan/pages/DetailStatusLaporanPage.jsx`

**Tulisan di atas foto yang harus dihapus:**

| Lokasi | Baris | Isi |
| --- | --- | --- |
| `HomePage.jsx` | 155-178 | `.hero-location-badge`: `{slide.title} • {slide.location}` |
| `HomePage.jsx` | 378 | `Rekomendasi Warga` (kartu unggulan) |
| `HomePage.jsx` | 382 | badge kategori (kartu unggulan) |
| `HomePage.jsx` | 384 | `{featuredSpaces[0].wilayah}` (kartu unggulan) |
| `HomePage.jsx` | 448 | badge kategori (2 kartu pendamping) |
| `HomePage.jsx` | 451 | `{item.wilayah}` (2 kartu pendamping) |
| `DaftarRuangPublikPage.jsx` | 575-577 | badge kategori di kartu daftar |
| `DetailRuangPublikPage.jsx` | 495-499 | overlay gelap + pill `Lokasi {detail.nama}` |
| `RiwayatLaporanPage.jsx` | 243-245 | badge jenis masalah |
| `DetailStatusLaporanPage.jsx` | 202-206 | badge `Asli` + caption nama fasilitas |

**Pekerjaan:**

1. Ubah setiap kontainer gambar dari tinggi tetap menjadi rasio persegi, mengikuti cara
   FE-35: `aspectRatio: '1 / 1'` dengan `width: '100%'` dan `maxHeight` yang sesuai
   konteks kartu. Kontainer yang diubah:
   - `HomePage.jsx:372` (sekarang `height: '240px'`)
   - `HomePage.jsx:442` (sekarang `height: '140px'`)
   - `DetailRuangPublikPage.jsx:489` (sekarang `height: '220px'`)
   - `RiwayatLaporanPage.jsx:241` (sekarang `minHeight: '160px'` di dalam grid)
   - `DetailStatusLaporanPage.jsx:200` (sekarang `height: '200px'`)
2. Hapus seluruh elemen teks yang diposisikan `absolute` di atas foto pada tabel di atas.
3. Untuk informasi yang hilang karena penghapusan, pindahkan ke luar area foto, jangan
   dibuang:
   - Nama dan wilayah ruang publik sudah ada di heading dan baris alamat kartu, jadi cukup dihapus.
   - Badge kategori sudah ada di tempat lain pada beberapa kartu; kalau hilang seluruhnya,
     letakkan di baris bawah konten (bukan di atas foto).
   - Badge `Dokumentasi Warga` di `DetailRuangPublikPage.jsx:659-663` menandai asal foto,
     jadi bukan sekadar hiasan. Pindahkan ke bawah thumbnail sebagai label terpisah,
     jangan dihapus.
   - Badge `Asli` di `DetailStatusLaporanPage.jsx:202` dihapus; status sudah dibawa `StatusBadge`.
4. Jaga `objectFit: 'cover'` pada foto. Dengan rasio persegi, komposisi tetap penuh tanpa
   distorsi.
5. Periksa tidak ada sisa `position: 'relative'` pada kontainer yang tidak lagi butuh
   penempatan absolut, dan pastikan bayangan/padding kartu tidak goyah setelah tinggi berubah.

**Acceptance criteria:**

- Semua foto ruang publik pada lima file di atas tampil dengan rasio persegi 1:1.
- Tidak ada tulisan yang menempel di atas foto, kecuali label asal foto yang sudah
  dipindahkan ke luar area foto.
- Nama ruang publik, wilayah, dan kategori tetap terbaca di halaman (tidak hilang bersama overlay).
- Tidak ada layout yang rusak di desktop maupun mobile, tidak ada foto gepeng atau terpotong aneh.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka `/home`, `/ruang-publik`, `/ruang-publik/:id`, `/laporan-saya`, dan `/laporan-saya/:id`.
2. Pastikan setiap foto berbentuk kotak dan bersih dari tulisan.
3. Cek satu ruang publik yang punya banyak foto pada galeri detailnya.
4. Periksa di lebar layar 390px dan 1280px.

**Hasil pelaksanaan:**

Foto dibuat persegi 1:1 dengan `aspectRatio: '1 / 1'` pada tujuh kotak foto, lalu
`alignSelf` disetel sesuai konteks kartu. Tinggi tetap lama (240px, 140px, 220px, 110px,
200px) dihapus seluruhnya.

| Halaman | Foto | Sebelum | Sesudah |
| --- | --- | --- | --- |
| Beranda | kartu unggulan | 730x240 (rasio 3,04) | 340x340 (1:1) |
| Beranda | dua kartu samping | 195x225 (0,87) | 195x195 (1:1) |
| Daftar | thumbnail kartu | 260x221 (1,18) | 260x260 (1:1) |
| Detail | foto utama | 547x220 (2,48) | 547x547 (1:1) |
| Detail | thumbnail galeri | 164x110 (1,49) | 164x164 (1:1) |
| Laporan Saya | foto kartu | 240 tebal bebas | 240x240 (1:1) |
| Detail Status Laporan | foto bukti | 330x200 (1,65) | 330x330 (1:1) |

Tulisan yang dihapus dari atas foto: badge hero Beranda (nama ruang publik dan wilayah),
pill `Lokasi {nama}` di foto utama Detail, badge `Asli` dan caption nama fasilitas di
Detail Status Laporan, badge kategori di kartu Daftar, badge kategori dan wilayah di kartu
Beranda, serta badge jenis masalah di kartu Laporan Saya.

Informasi yang tidak dibuang, hanya dipindah keluar dari area foto:

- Kategori di kartu Daftar dan di kartu Beranda pindah ke baris pertama isi kartu.
- Wilayah di kartu Beranda pindah ke bawah judul, karena sebelumnya hanya ada di atas foto.
- `Rekomendasi Warga` di kartu unggulan pindah ke baris badge di atas judul.
- `Dokumentasi Warga` di galeri Detail pindah ke bawah thumbnail, potongan foto asli 6 px.
- Jenis masalah di kartu Laporan Saya pindah ke atas nama fasilitas.

**Temuan teknis yang menentukan hasilnya.** `aspectRatio` pada kotak foto tidak berlaku
selama gambar di dalamnya masih ikut mengalir, karena `height: 100%` pada gambar membuat
tingginya menyetir tinggi kotak. Terukur: kotak 260 px memaksa tinggi jadi 266 px.
Perbaikannya, gambar diberi `position: absolute; inset: 0`. Setelah itu kotak jadi tepat
260x260, dan bentuknya tetap persegi walau gambar aslinya potret (diuji dengan gambar
rasio 1:3: kotak tetap persegi dan tidak melar).

Kartu unggulan Beranda juga diubah jadi mendatar (`display: grid`) supaya tinggi kartu
tidak ikut memanjang setinggi lebar kolomnya. Kolom foto dipatok tetap 340 px, bukan
otomatis, karena versi otomatis terbukti gagal saat teksnya panjang (foto jadi 232x316,
tidak persegi, dan meluber). Dengan patokan tetap, rasionya tetap 1:1 pada teks normal
maupun teks panjang (diuji: judul panjang dan deskripsi tiga kali lebih panjang).

**Perbedaan dari rencana di atas, supaya tidak menyesatkan:**

1. Foto yang dijadikan persegi bukan hanya lima kontainer yang didaftar, melainkan tujuh,
   karena galeri Detail punya satu kotak sendiri dan kartu Laporan Saya juga.
2. Badge kategori, jenis masalah, `Rekomendasi Warga`, dan wilayah tidak dihapus, melainkan
   dipindah keluar dari foto. Alasannya dua: desain Figma memang menaruh badge kategori di
   atas foto, dan menghapusnya berarti informasi wilayah hilang karena di kartu Beranda
   wilayah hanya muncul di atas foto.
3. Berkas yang disentuh ada enam, bukan lima: bertambah `apps/web/src/index.css` karena
   aturan `height: 100% !important` pada kartu samping dan kartu unggulan harus diubah,
   kalau tidak foto tidak akan pernah bisa persegi.

**Hasil verifikasi jalankan** (dev server 5173, Chromium 1280px, semua angka diambil dari
`getBoundingClientRect` di DOM):

- Ketujuh kotak foto terukur persegi tepat, selisih sisi di bawah 1,5 px.
- `textContent` di dalam setiap kotak foto kosong, jadi tidak ada tulisan yang menempel.
- Tidak ada elemen yang meluber keluar kartu pada pengujian teks panjang.
- Beranda: foto kartu unggulan 340x340 dengan sisa ruang 35 px di atas dan 35 px di bawah,
  artinya foto tetap di tengah kolomnya.
- Lebar 390 px: foto kartu 356x356, semua persegi, tidak ada geser horizontal.
- Lebar 768 px: foto kartu unggulan 703x703, kartu samping 343x343, semuanya persegi,
  tidak ada geser horizontal.
- `npm run build` dari `apps/web` lulus.

**Batas pengujian yang jujur:**

1. Halaman diuji memakai server data sementara (bukan FastAPI + MySQL, karena MySQL di
   mesin ini tidak berjalan). Datanya diambil apa adanya dari CSV di repo, tetapi ini bukan
   backend asli.
2. Foto aslinya tidak ada di repo (folder `data/Images/images/` kosong), jadi bentuk foto
   diperiksa memakai gambar SVG pengganti. Justru inilah yang membuka temuan pada bagian
   "Temuan teknis" di atas, karena tinggi kotak ikut berubah mengikuti rasio gambar.
3. Belum diuji di perangkat asli dan layar sentuh. Pengujian lebar layar memakai emulasi
   peramban.
4. Keindahan tata letak hanya dinilai dari pengukuran dan tangkapan layar. Penilaian rasa
   desain tetap perlu mata pemilik produk.

---

### FE-47. Tombol panah kiri-kanan pada galeri foto ruang publik

**Status:** ✅

**Kondisi sekarang:** navigasi foto hanya ada di dalam modal lightbox
(`DetailRuangPublikPage.jsx:794-839`, tombol `Sebelumnya` dan `Berikutnya` di footer Modal).
Galeri inline di halaman (grid thumbnail, baris 642-667) tidak punya panah sama sekali,
jadi pengunjung harus membuka foto satu per satu.

**Alasan fitur ini perlu:** dihitung dari `data/Images/output.csv`, ruang publik dengan
`image_status = ok`: 635 punya 4+ foto, 66 punya 2-3 foto, 27 punya 1 foto. Artinya 96%
entri berfoto memang punya lebih dari satu gambar.

**File utama:** `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`

**Pekerjaan:**

1. Tambahkan tombol panah kiri dan kanan pada galeri inline (baris 642-667), muncul hanya
   bila `galeriFoto.length > 1`.
2. Posisikan panah sebagai tombol melayang di tepi kiri dan tepi kanan area galeri, atau
   sebagai satu baris kontrol di atas grid beserta indikator `Foto n dari m`.
3. Tambahkan navigasi papan tombol pada lightbox: `ArrowLeft` dan `ArrowRight` untuk
   berpindah foto, `Escape` untuk menutup. Modal sudah menangani `Escape` sendiri, jadi
   pastikan `ArrowLeft`/`ArrowRight` tidak bentrok dengan perilaku modal.
4. Sembunyikan tombol `Sebelumnya` saat `fotoAktifIdx === 0` dan `Berikutnya` saat berada
   di foto terakhir (sudah dilakukan lewat `disabled`; bisa dipertahankan).
5. Sinkronkan posisi: membuka foto dari thumbnail harus membuka indeks yang benar, dan
   tombol panah mengubah `fotoAktifIdx` yang sama.
6. Beri `aria-label` yang jelas pada kedua tombol panah dan pastikan tombol bisa dijangkau
   dengan `Tab`.
7. Jangan mengubah tata letak grid thumbnail selain menambah panah.

**Acceptance criteria:**

- Galeri menampilkan tombol panah kiri-kanan bila foto lebih dari satu.
- Panah kiri pada foto pertama dan panah kanan pada foto terakhir berhenti dengan
  aman (tidak error, tidak melewati batas).
- Panah berfungsi pada galeri inline dan di dalam lightbox.
- `ArrowLeft`/`ArrowRight` berfungsi saat lightbox terbuka, `Escape` tetap menutup.
- Indikator posisi foto terlihat (mis. `Foto 2 dari 5`).
- Tombol bisa dijangkau dan diaktifkan lewat papan tombol saja.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka detail ruang publik yang punya lebih dari satu foto.
2. Klik panah kiri-kanan di galeri inline, lalu buka satu foto dan uji panah di lightbox.
3. Uji papan tombol: `Tab` ke tombol panah, `Enter`, lalu `ArrowLeft`/`ArrowRight`/`Escape`.
4. Buka ruang publik yang hanya punya satu foto dan pastikan panah tidak muncul.

**Di luar cakupan:** panah pada kartu di `/home` dan `/ruang-publik`. Endpoint daftar hanya
mengirim satu `image_url` per baris (`schemas/ruang_publik.py`, `RuangPublikListResponse`),
jadi panah di kartu daftar butuh perubahan backend dan tidak dikerjakan di task ini.

**Hasil pelaksanaan:**

Satu berkas disentuh: `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`.

1. Baris kontrol galeri ditambahkan di kanan judul, sebaris dengan badge jumlah foto:
   tombol panah kiri, teks `Foto n dari m`, tombol panah kanan. Dari dua pilihan yang
   ditulis di rencana, yang dipakai adalah baris kontrol, bukan panah melayang di tepi
   grid, karena panah melayang di atas kumpulan thumbnail terbaca seperti tombol yang
   menutupi foto.
2. Indeks foto disatukan. Sebelumnya hanya ada `fotoAktifIdx` yang sekaligus berarti
   "lightbox terbuka" (`null` = tertutup). Sekarang ada `fotoTerpilih` sebagai satu-satunya
   indeks, dipakai bersama oleh sorotan di halaman dan foto di lightbox, plus
   `lightboxTerbuka` sebagai penanda buka-tutup. Alasannya, kalau panah di halaman juga
   mengubah indeks yang sama seperti permintaan rencana, panah itu akan ikut membuka
   lightbox setiap kali ditekan. Dengan pemisahan ini, panah di halaman dan panah di
   lightbox menggerakkan indeks yang sama tanpa memaksa lightbox terbuka.
3. Thumbnail yang sedang dipilih ditandai `outline` 3 px warna utama dan
   `aria-current="true"`. Sengaja memakai `outline`, bukan `border`, supaya ukuran kotak
   foto hasil FE-46 tidak berubah sedikit pun.
4. Papan tombol: `ArrowLeft` dan `ArrowRight` menggeser foto saat lightbox terbuka, dan
   `Escape` tetap ditangani `Modal`. Pendengar tombol dipasang hanya saat lightbox terbuka.
5. Kedua ujung aman: panah kiri nonaktif di foto pertama, panah kanan nonaktif di foto
   terakhir, dan `geserFoto` tetap dibatasi `Math.max` dan `Math.min` walau tombolnya
   ditekan paksa.
6. Indeks dikembalikan ke nol saat berpindah ruang publik, supaya tidak tertinggal di
   nomor foto dari halaman sebelumnya.

**Hasil verifikasi jalankan** (semua angka dari DOM, bukan dari tangkapan layar):

- Panah muncul saat foto lebih dari satu, dan tidak muncul sama sekali pada ruang publik
  yang hanya punya satu foto (diuji pada `rth-930e0d60146a`: bagian Galeri Foto tidak
  dirender).
- Posisi awal `Foto 1 dari 4`: panah kiri nonaktif dengan opasitas 0,45, panah kanan aktif.
- Klik panah kanan tiga kali: indikator bergerak 1, 2, 3, 4 dan sorotan thumbnail mengikuti
  indeks yang sama. Di foto keempat panah kanan nonaktif, dan menekannya lagi tidak
  mengubah apa pun (tetap `Foto 4 dari 4`).
- Klik panah kiri di foto pertama tidak mengubah apa pun (tetap `Foto 1 dari 4`).
- Klik thumbnail ke-3 membuka lightbox dengan judul `Foto 3 dari 4`, dan indikator di
  halaman ikut berpindah ke `Foto 3 dari 4`, jadi keduanya sinkron.
- Di lightbox, `ArrowRight` memindahkan 3 ke 4 dan di ujung tombol `Berikutnya` nonaktif;
  `ArrowLeft` memindahkan 4 ke 3 dan berhenti di 1; `Escape` menutup lightbox.
- Papan tombol: tombol panah bisa difokus, `Enter` di panah kanan memindahkan
  `Foto 1 dari 4` ke `Foto 2 dari 4`, dan setelah itu panah kiri ikut bisa difokus.
  `Enter` pada panah tidak membuka lightbox.
- Sorotan hanya ada di satu thumbnail: yang aktif `outline-style: solid` warna
  `rgb(15, 118, 110)`, sisanya `outline-style: none`.
- Lebar 390 px: thumbnail 173x173, panah masih di dalam layar, tidak ada geser horizontal.
- Ukuran thumbnail tetap 164x164 dan foto utama Detail tetap 547x547 persegi, jadi hasil
  FE-46 tidak terganggu oleh sorotan maupun baris kontrol baru.
- Error konsol nol pada semua pengujian di atas.
- `npm run build` dari `apps/web` lulus.

**Cara pengujian, dan kenapa harus begitu.** Backend asli sudah berjalan di port 8000,
tetapi tabel fotonya kosong: terhitung 1194 ruang publik dan 0 baris di `ruang_publik_foto`.
Artinya `detail.foto` selalu kosong, bagian Galeri Foto tidak pernah dirender, dan panah
tidak akan pernah terlihat dengan data asli. Karena itu pengujian galeri dilakukan di jalur
terpisah: server data di port 8001 dan dev server kedua di port 5174 dengan
`VITE_API_BASE_URL=http://localhost:8001`. Server yang sedang berjalan milik pemilik repo
(dev server 5173 dan backend 8000) tidak dihentikan dan tidak diubah. Sesudah pengujian,
kedua proses tambahan itu dimatikan lagi.

**Temuan yang perlu diketahui di luar task ini:** selama tabel foto masih kosong, seluruh
bagian Galeri Foto di halaman detail tidak tampil untuk ruang publik mana pun. Foto yang
sudah dipotong rapi oleh FE-46 dan panah dari FE-47 baru akan terlihat setelah ETL foto
mengisi `ruang_publik_foto`. Folder `data/Images/images/` di repo juga masih kosong.

**Batas pengujian yang jujur:**

1. Galeri diuji memakai data ruang publik asli dari CSV repo, tetapi disajikan oleh server
   data sementara, bukan lewat backend FastAPI.
2. Foto diperiksa memakai gambar SVG pengganti, bukan foto asli.
3. Belum diuji dengan layar sentuh atau pembaca layar. Papan tombol diuji lewat peristiwa
   tombol asli dari Chrome DevTools Protocol, bukan pembaca layar.
4. Jumlah thumbnail yang diuji 1 dan 4. Belum diuji dengan jumlah foto yang jauh lebih
   banyak sehingga gridnya sampai berbaris banyak.

---

### FE-48. Seragamkan rounded corner tombol dan kontrol

**Status:** ✅

**Gejala:** dalam satu baris filter saja, sudut tombolnya bercampur antara tajam dan
membulat.

**Bukti pengukuran live** (`/ruang-publik`, nilai `border-radius` terhitung per elemen):

| Nilai | Elemen |
| --- | --- |
| `4px` | `btn btn-ghost btn-sm` (1 elemen) |
| `4px` | `btn btn-outline btn-sm` (2 elemen) |
| `9999px` | `select-dropdown-trigger ruang-publik-filter` (3 elemen) |
| `9999px` | `btn btn-outline btn-sm ruang-publik-filter` (1 elemen) |
| `9999px` | `btn btn-ghost btn-sm` (1 elemen) |
| `9999px` | `category-chip` (5 elemen) |

**Akar masalah:** `.btn-sm` memakai `var(--radius-sm)` = `4px`, sedangkan kelas yang
menimpanya (`.ruang-publik-filter`, `.ruang-publik-detail-button`) memakai
`var(--radius-pill)`. Karena spesifisitasnya lebih tinggi, hasilnya tidak seragam.

| Selector | Nilai | Baris `index.css` |
| --- | --- | --- |
| `.btn` | `var(--radius-md)` = 8px | ~185 |
| `.btn-sm` | `var(--radius-sm)` = 4px | ~266 |
| `.btn-lg` | `var(--radius-md)` = 8px | ~405 |
| `.ruang-publik-detail-button` | pill, dengan `!important` | ~271 |
| `.ruang-publik-filter` | pill | ~280 |
| `.select-dropdown-trigger` | pill | ~308 |
| `.select-dropdown-option` | pill | ~382 |
| `.badge` | pill | ~420 |
| `.facility-filter-button` | `var(--radius-md)` = 8px | ~513 |

**Acuan yang sudah ada:** `apps/web/Public/RukaFinalFigma/DESIGN.md` §1.4 dan §1.5 sudah
menetapkan tombol beradius 8px, dan pill hanya untuk tag status dan tombol oval navigasi.
Kode sekarang menyimpang dari dokumen desainnya sendiri.

**Nilai literal yang lolos dari sistem token (di JSX):**

| Nilai | Lokasi |
| --- | --- |
| `'8px'` | `ErrorBoundary.jsx:46`, `PetaSebaranLokasi.jsx:193` |
| `'12px'` | `ErrorBoundary.jsx:34` |
| `'6px'` | `ErrorBoundary.jsx:66` |
| `'999px'` | `PetaSebaranLokasi.jsx:291` |
| `'var(--radius-sm, 6px)'` | `Logo.jsx:53` (nilai fallback 6px tidak ada di token) |

**Keputusan yang perlu diambil sebelum mengerjakan:** pilih salah satu standar.

- Opsi A (sesuai DESIGN.md): semua tombol `var(--radius-md)` = 8px. Pill hanya untuk badge,
  chip, dan tombol oval navigasi.
- Opsi B: semua tombol pill.

Saran: Opsi A. Kalau semua elemen dibuat pill, tombol, chip, dan badge jadi tidak bisa
dibedakan bentuknya, dan itu justru salah satu pemicu kesan seragam yang dibahas di FE-54.

**File utama:** `apps/web/src/index.css`

**File terkait:** `ErrorBoundary.jsx`, `Logo.jsx`, `PetaSebaranLokasi.jsx`

**Pekerjaan:**

1. Tetapkan satu nilai radius untuk tombol, lalu terapkan pada `.btn`, `.btn-sm`, `.btn-lg`.
2. Hapus `!important` pada `.ruang-publik-detail-button` agar tidak ada aturan yang
   bertengkar dengan `.btn-sm`.
3. Ganti nilai literal di JSX dengan token `var(--radius-*)` yang sesuai.
4. Tambahkan token baru bila memang ada nilai yang belum terwakili, misalnya `--radius-xs`
   untuk 6px, lalu pakai di `Logo.jsx` alih-alih fallback yang tidak ada di token.
5. Setelah perubahan, periksa kembali seluruh tombol dan kontrol di halaman publik dan
   admin, bukan hanya halaman daftar.
6. Periksa juga alias `--radius-md` pada `PetaSebaranLokasi.jsx:193` agar popup peta tetap rapi.

**Acceptance criteria:**

- Semua tombol di aplikasi memakai satu nilai radius yang sama.
- Tidak ada lagi nilai radius literal di JSX selain `50%` untuk elemen bulat.
- Tidak ada `!important` yang dipakai untuk memenangkan pertengkaran radius.
- Tombol kecil, sedang, dan besar terlihat konsisten saat berdampingan.
- Pemeriksaan `border-radius` terhitung pada satu baris filter menunjukkan satu nilai saja
  untuk semua tombol.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka `/ruang-publik`, periksa baris filter.
2. Buka `/home`, `/ruang-publik/:id`, `/tentang`, `/dashboard`, dan satu halaman `/profil`.
3. Jalankan pemeriksaan di DevTools Console:

```js
[...document.querySelectorAll('button, a.btn, .btn')]
  .map(b => getComputedStyle(b).borderRadius)
  .forEach(r => console.log(r));
```

   Semua nilai tombol harus sama.

**Keputusan yang diambil:** Opsi B (semua tombol pill `9999px`), dipilih pemilik repo
setelah dua opsi di atas ditawarkan. Karena itu `DESIGN.md` §1.4 dan §1.5 ikut diperbarui:
tombol pindah dari `8px` ke `9999px`, sedangkan input form dan popover dropdown tetap `8px`.
Tanpa pembaruan dokumen, kode akan kembali menyimpang dari dokumen desainnya sendiri.

**Yang dikerjakan:**

1. Satu sumber nilai radius tombol: `.btn` memakai `var(--radius-pill)`. `.btn-sm` dan
   `.btn-lg` tidak lagi menulis `border-radius` sendiri, jadi kecil, sedang, dan besar
   otomatis mewarisi nilai yang sama.
2. Aturan `!important` dihapus seluruhnya. Blok
   `.btn.btn-sm.ruang-publik-detail-button, .btn.ruang-publik-detail-button` dibuang karena
   `.btn` dan `.ruang-publik-detail-button` sekarang sama-sama pill; tidak ada lagi aturan
   yang perlu dimenangkan.
3. Kontrol lain yang punya permukaan sendiri diseragamkan: `.facility-filter-button` dan
   `.facility-reset-filter` (8px → pill), `.akun-sidebar-close`, `.akun-logout-button`,
   `.akun-menu-toggle`, `.profil-link-button`, `.profil-remove-button`, dan
   `.profile-dropdown-logout`.
4. Token `--radius-xs: 6px` ditambahkan. `Logo.jsx` memakai token itu menggantikan
   `var(--radius-sm, 6px)`; fallback lama sebenarnya tidak pernah terpakai sehingga logo
   selama ini 4px, sekarang benar 6px sesuai nilai yang dimaksud.
5. Nilai literal di JSX dihabiskan: `ErrorBoundary.jsx` (12px → `--radius-lg`, 8px →
   `--radius-md`, 6px pada tombol Refresh → pill), `PetaSebaranLokasi.jsx` (8px →
   `--radius-md`, `999px` pada chip kategori → pill), `.hero-dot` di `HomePage.jsx`
   (`9999px` → pill), chip fasilitas di `DaftarRuangPublikPage.jsx` (4px → pill), lima tab
   status `RiwayatLaporanPage.jsx`, tombol nomor halaman, switch Masuk/Daftar di
   `LoginPage.jsx`, tombol keluar `AdminLayout.jsx`, panah galeri `DetailRuangPublikPage.jsx`,
   dan tiga tombol CTA `TentangPage.jsx` yang menimpa radius `.btn`. Fallback
   `var(--radius-md, 6px)` pada dropdown profil ikut dirapikan karena 6px bukan nilai
   `--radius-md`.

**Hasil pengukuran** (`getComputedStyle(...).borderRadius` per elemen, Chrome headless lewat
CDP, dev server baru di `localhost:5199`):

| Halaman | Tombol | Nilai terhitung |
| --- | --- | --- |
| `/ruang-publik` | 28 | `9999px` semua, termasuk baris filter (reset, Gunakan Lokasi Saya, tiga dropdown, chip kategori) |
| `/home` | 15 | `9999px` semua |
| `/tentang` | 5 tombol `.btn` | `9999px` semua |
| `/login`, `/login-pemerintah` | 4 dan 2 | `9999px` semua |
| `/ruang-publik/:id` | 12 | `9999px` semua, termasuk `facility-filter-button` |
| `/laporan-saya` | 8 | `9999px` semua, termasuk lima tab status |
| `/profil` | 6 | `9999px` semua |
| `/profil/keamanan` | 7 | 6 tombol `9999px`, 1 tombol teks "Lihat Sandi" `0px` |
| `/profil/tersimpan` | 6 | `9999px` semua |
| `/profil/bantuan` | 9 | 5 tombol `9999px`, 4 baris akordeon `0px` |
| `/profil/tema` | 8 | 5 tombol `9999px`, 3 kartu pilihan tema `12px` |
| `/dashboard`, `/dashboard/moderasi`, `/dashboard/fasilitas`, `/dashboard/data-master` | 3, 3, 14, 502 | `9999px` semua |

Pemeriksaan statis: tidak ada lagi angka radius di JSX maupun CSS selain `50%` untuk elemen
bulat dan marker peta, dan tidak ada `!important` untuk radius. `npm run build` dari
`apps/web` lulus.

**Pengecualian yang disengaja**, yaitu elemen `<button>` yang bukan tombol berbentuk kontrol,
jadi tidak ikut dipill:

- Baris akordeon `.tentang-faq-toggle` dan `.profil-faq-trigger` (`0px`): selebar kartu
  induknya, tanpa latar. Kalau dipill, ring fokusnya berbentuk stadium dan tidak lagi
  mengikuti sudut kartu.
- Tombol teks tanpa latar: `.profil-show-pass` ("Lihat Sandi"), "Hapus semua" pada dropdown
  fasilitas, dan tautan "Masuk ke RuangTerbuka" di form daftar.
- Wadah berbentuk kartu atau media yang kebetulan dirender sebagai `<button>`:
  `.profil-theme-card` dan `.profil-report-item` (12px) serta thumbnail galeri di halaman
  detail (8px). Ketiganya memakai radius struktural. Kalau ikut dipill, foto dan kartu
  berubah jadi stadium, yaitu keseragaman bentuk yang justru dikritik di FE-54.

**Catatan pengujian:** dev server `5173` yang sudah berjalan menyajikan `index.css` hasil
transform lama (sebagian aturan masih `8px`) walaupun file di disk sudah berubah; permintaan
`/src/index.css?direct` mengembalikan isi terbaru, jadi ini cache transform Vite, bukan file
yang salah. Audit dilakukan lewat dev server kedua di `5199` dan server `5173` milik pemilik
repo tidak dihentikan. `5173` perlu di-restart agar peramban memuat aturan baru. `npm test`
tidak dapat dijalankan karena binari `vitest` tidak ada di `node_modules`; yang tersedia
hanya `npm run build`.

---

### FE-49. Halaman dimulai dari tengah saat berpindah rute

**Status:** ✅

**Gejala:** buka `/ruang-publik`, gulir ke bawah, lalu buka salah satu ruang publik.
Halaman detail terbuka pada posisi gulir yang sama, bukan dari atas, sehingga foto harus
dicari dengan menggulir ke atas lebih dulu.

**Bukti verifikasi (browser, dev server `localhost:5173`):**

1. `history.scrollRestoration` bernilai `"auto"`.
2. Gulir ke `scrollY = 1008` di `/ruang-publik`, lalu klik menu `Tentang`: setelah rute
   berpindah, `scrollY` tetap `1008` dan posisi `<h1>` halaman baru berada di `y = -847`
   (artinya judul sudah lewat di atas layar).
3. Kembali dari `/tentang` ke `/ruang-publik`: `scrollY` tetap `1008`.

**Akar masalah:** tidak ada satu pun komponen atau hook yang mereset posisi gulir saat rute
berubah. Pencarian seluruh `apps/web/src` untuk `scrollTo`, `ScrollToTop`, dan
`scrollRestoration` tidak menghasilkan apa pun. `App.jsx` hanya memasang Router dan Routes
tanpa penanganan gulir. Perilaku `auto` milik browser tidak menolong karena perpindahan ini
adalah navigasi sisi klien SPA, bukan pemuatan dokumen baru.

**File utama (baru):** `apps/web/src/components/ScrollToAtas.jsx`

**File terkait:**

- `apps/web/src/App.jsx`
- `apps/web/src/components/index.js`
- `apps/web/src/main.jsx`

**Pekerjaan:**

1. Buat komponen kecil tanpa tampilan yang memantau `location.pathname` lewat
   `useLocation()` dan memanggil `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`
   setiap kali path berubah.
2. Render komponen itu di dalam `Router` pada `App.jsx`, di posisi yang tidak terpengaruh
   perpindahan rute.
3. Set `history.scrollRestoration = 'manual'` sekali di `main.jsx` agar browser berhenti
   ikut campur.
4. **Jangan memakai `behavior: 'smooth'`.** `DetailRuangPublikPage.jsx:236` sudah memanggil
   `scrollIntoView({ behavior: 'smooth' })` untuk membuka peta. Dua animasi gulir yang
   berjalan bersamaan akan saling mengganggu.
5. Pertimbangkan penyaring agar reset dilewati bila URL hanya berubah pada query string,
   supaya mengganti filter di `/ruang-publik` tidak melempar pengguna ke atas halaman.

**Acceptance criteria:**

- Membuka halaman mana pun selalu dimulai dari posisi paling atas.
- Berlaku untuk perpindahan antar halaman publik, akun, dan admin.
- Mengganti filter, urutan, atau nomor halaman di `/ruang-publik` tidak memaksa gulir ke atas.
- Tombol peta pada detail ruang publik tetap membuka peta dengan lancar, tanpa gulir balik ke atas.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka `/ruang-publik`, gulir ke bawah, klik satu kartu. Halaman harus terbuka di posisi atas.
2. Ulangi dari `/tentang` ke `/ruang-publik`, dan dari `/dashboard` ke `/dashboard/moderasi`.
3. Di `/ruang-publik`, ubah filter kategori dan radius; posisi gulir tidak boleh melompat.
4. Buka `/ruang-publik/:id`, tekan tombol `Tampilkan Peta`; peta terbuka tanpa gulir aneh.

---

### FE-50. Hapus simbol yang tidak membawa informasi di judul dan label

**Status:** ✅

**Daftar lengkap hasil pemindaian** (bukan perkiraan):

**Emoji:**

| Lokasi | Baris | Isi |
| --- | --- | --- |
| `PetaSebaranLokasi.jsx` | 250 | `📍 Lokasi Anda` |
| `PetugasLapanganPage.jsx` | 82 | `📍 Wilayah: {p.wilayah}` |
| `PetugasLapanganPage.jsx` | 91 | `📞 Hubungi Petugas` |
| `KelolaAdminPage.jsx` | 145 | `👤 {admin.name}` |
| `DataMasterPage.jsx` | 433 | `📍 {rp.nama}` |

**Panah dekoratif `→`:**

| Lokasi | Baris | Isi |
| --- | --- | --- |
| `PetaSebaranLokasi.jsx` | 314 | `Lihat Detail Ruang →` |
| `LoginPemerintahPage.jsx` | 75 | `Masuk ke Dashboard →` |

**Label kapital dengan bullet `•` (pola eyebrow template):**

| Lokasi | Baris |
| --- | --- |
| `DetailRuangPublikPage.jsx` | 547 |
| `AntrianModerasiPage.jsx` | 74 |
| `LaporanTerflagPage.jsx` | 41 |
| `KelolaAdminPage.jsx` | 106 |
| `DataMasterPage.jsx` | 165 |
| `KelolaFasilitasPage.jsx` | 71 |

**Ikon di dalam heading (22 lokasi):**

`DetailRuangPublikPage.jsx:461, 508, 601`; `DetailFasilitasWargaPage.jsx:135, 156`;
`DetailModerasiPage.jsx:308, 331, 356, 437`; `DashboardPage.jsx:243`;
`RiwayatLaporanPage.jsx:251, 265, 274`; `DetailStatusLaporanPage.jsx:109, 194`;
`FormLaporPage.jsx:735`; `StatusHasilSubmit.jsx:139, 145`; `HomePage.jsx:384, 451`;
`DaftarRuangPublikPage.jsx:614`; `KelolaFasilitasPage.jsx:130`.

**Bullet `•` sebagai pemisah data (bukan hiasan):**

`DaftarRuangPublikPage.jsx:586`; `DetailFasilitasWargaPage.jsx:109`;
`RiwayatLaporanPage.jsx:259`; `DetailStatusLaporanPage.jsx:122`;
`DetailRuangPublikPage.jsx:364, 738, 798`; `PublicLayout.jsx:143`; `HomePage.jsx:177`.

**File utama:** `apps/web/src/features/ruang-publik/components/PetaSebaranLokasi.jsx`

**File terkait:** `PetugasLapanganPage.jsx`, `KelolaAdminPage.jsx`, `DataMasterPage.jsx`,
`LoginPemerintahPage.jsx`, `DetailRuangPublikPage.jsx`, `AntrianModerasiPage.jsx`,
`LaporanTerflagPage.jsx`, `KelolaFasilitasPage.jsx`, serta 22 lokasi ikon heading pada
daftar di atas.

**Pekerjaan:**

1. Hapus kelima emoji. Kalau penanda visual masih dibutuhkan, ganti dengan ikon lucide
   yang sudah dipakai di proyek (mis. `MapPin` untuk lokasi, `Phone` untuk kontak, `User` untuk nama).
2. Hapus kedua panah `→` pada teks tombol.
3. Tangani keenam label kapital: buang bullet, dan sederhanakan teksnya menjadi satu frasa
   tanpa dua bagian yang dipisah. Contoh: `TRANSPARANSI PRASARANA • DIPERBARUI WARGA & DINAS`
   menjadi `Transparansi prasarana`. Periksa setiap label agar tidak ada informasi yang hilang.
4. Tinjau 22 ikon di heading. Sisakan hanya pada heading yang menandai blok isi berbeda
   (mis. `Peta Akses & Batas Kawasan`, `Jam & Aksesibilitas Warga`), dan hapus pada heading
   yang sudah jelas dari teksnya (mis. `ALASAN PENOLAKAN`, `PEMBARUAN TERAKHIR`,
   `Informasi Fasilitas`).
5. Bullet sebagai pemisah data jangan dihapus. Ganti dengan pemisah yang lebih tenang
   (mis. `·`) atau ubah menjadi elemen terpisah bila barisnya terlalu panjang.
6. Setelah menghapus ikon, periksa impor yang jadi tidak terpakai agar tidak memicu
   peringatan lint, dan pastikan jarak antar elemen tetap rapi.

**Acceptance criteria:**

- Tidak ada emoji di seluruh antarmuka.
- Tidak ada panah `→` sebagai hiasan pada teks tombol.
- Tidak ada label kapital yang memakai bullet sebagai pemisah.
- Ikon di heading tersisa hanya pada heading yang benar-benar butuh penanda blok.
- Informasi substantif tidak ada yang hilang (jenis masalah, tanggal, wilayah, nama fasilitas tetap tampil).
- Tidak ada impor ikon yang menganggur dan tidak ada peringatan baru.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Jalankan pencarian sisa simbol di seluruh `apps/web/src`:

```bash
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" apps/web/src --include=*.jsx
grep -rn "→" apps/web/src --include=*.jsx
```

   Keduanya harus kosong, kecuali di dalam komentar kode.

2. Buka dan periksa tampilannya pada `/ruang-publik`, `/ruang-publik/:id`,
   `/laporan-saya`, `/laporan-saya/:id`, `/dashboard`, `/dashboard/moderasi`,
   `/dashboard/moderasi/:laporanId`, `/dashboard/laporan-terflag`,
   `/dashboard/data-master`, `/dashboard/fasilitas`, `/dashboard/petugas`,
   `/dashboard/kelola-admin`, dan `/login-pemerintah`.
3. Pastikan jenis masalah, tanggal, wilayah, dan nama fasilitas masih terbaca di
   kartu riwayat laporan dan di peta.

**Bukti verifikasi (browser, dev server `localhost:5199`):**

1. Kedua pencarian simbol bersih: tidak ada emoji sama sekali; `→` hanya tersisa di
   komentar kode (`FormLaporPage.jsx`).
2. 17 rute discan dengan sesi admin: 16 halaman tanpa emoji, `→`, bullet `•`, dan tanpa
   exception konsol; `npm run build` lulus (`✓ built in 3.31s`).
3. Ikon heading diverifikasi lewat DOM: `Peta Akses & Batas Kawasan`,
   `Jam & Aksesibilitas Warga`, dan `Posisi Fasilitas` tetap berikon; `Monitoring Laporan
   Terkini`, `Tindakan Petugas`, `Catatan Pembaruan Timeline`, `Informasi Fasilitas`,
   `Bukti Dokumentasi Warga`, dan `Panduan Laporan Cepat` tanpa ikon.
4. Label baru tampil sesuai: `Transparansi prasarana`, `Pusat penanganan fasilitas warga`,
   `Moderasi konten`, `Data master`, `Manajemen pengguna`.
5. Info substantif tetap tampil di detail laporan: jenis masalah, tanggal
   (`20 Okt 2026`), dan wilayah (`Jakarta Pusat`); popup peta menampilkan
   `Lihat Detail Ruang` tanpa panah.
6. Fixture data sementara untuk halaman moderasi/riwayat sudah dihapus; database kembali
   tanpa laporan uji dan tanpa fasilitas uji.

---

### FE-51. Filter kondisi fasilitas publik jadi dropdown

**Status:** ✅

**Lokasi:** `/ruang-publik/:id`, bagian `Kondisi Fasilitas Publik`.

**Kondisi sekarang:** empat tombol filter berjajar di dalam `.facility-filter-group`
(`DetailRuangPublikPage.jsx:565-582`), memakai state `facilityFilter` (baris 106) dan
penyaringan di baris 244-246. `index.css:603-609` sudah memuat media query yang menumpuk
toolbar ini menjadi kolom di layar kecil, tanda bahwa empat tombol plus teks pengantar
sudah berebut ruang bahkan di layar lebar.

Pola filter yang sama dipakai lagi untuk filter status laporan di baris 693-705
(`OPSI_FILTER_LAPORAN`) dengan kelas CSS yang sama.

**Solusi yang sudah tersedia:** `apps/web/src/components/SelectDropdown.jsx` sudah lengkap,
yaitu `aria-haspopup`, `aria-expanded`, navigasi `ArrowUp`/`ArrowDown`/`Home`/`End`, tutup
dengan `Escape`, deteksi klik di luar, dan prop `placement` untuk membuka ke atas. Komponen
ini sudah dipakai di `/ruang-publik` untuk `Urutkan` dan `Tampilkan per halaman`. Jadi tidak
perlu membuat komponen baru.

**Jangan tertukar:** `getFacilityOptions` dan `MultiSelectDropdown` di `/ruang-publik`
adalah filter **jenis** fasilitas (mis. toilet, jalur lari). Task ini menyangkut filter
**kondisi** fasilitas (Baik, Perlu Perhatian, Rusak). Dua hal berbeda.

**File utama:** `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`

**File terkait:** `apps/web/src/index.css` (kelas `.facility-filter-*`)

**Pekerjaan:**

1. Ganti tombol filter kondisi fasilitas dengan `SelectDropdown`, dengan opsi
   `Semua`, `Baik`, `Perlu Perhatian`, `Rusak`.
2. Sediakan pemetaan label ke nilai status agar `facilityFilter` tetap berisi nilai yang
   dipakai penyaringan (`semua`, `baik`, `perlu_perhatian`, `rusak`).
3. Pindahkan tombol penyaring status laporan (baris 693-705) ke pola yang sama agar
   konsisten, dan pastikan tetap menulis ke query string seperti sekarang.
4. Lengkapi hitungan pada opsi bila memungkinkan, misalnya `Baik (12)`, memakai angka yang
   sudah tersedia di `detail.stats`.
5. Bersihkan CSS `.facility-filter-button` dan `.facility-filter-group` yang menjadi tidak
   terpakai, termasuk media query di baris 603-609. Jangan hapus kelas yang masih dipakai
   elemen lain; periksa dulu dengan pencarian.
6. Pastikan tombol `Tampilkan semua fasilitas` pada keadaan kosong (`facility-reset-filter`)
   tetap berfungsi.
7. Pertahankan perilaku dropdown filter yang sudah ada, khususnya penulisan ke query string.

**Acceptance criteria:**

- Filter kondisi fasilitas tampil sebagai dropdown, bukan deretan tombol.
- Memilih opsi menyaring daftar fasilitas dengan benar, sama seperti perilaku sebelumnya.
- Opsi `Semua` mengembalikan seluruh daftar.
- Dropdown bisa dioperasikan dengan papan tombol dan bisa ditutup dengan `Escape`.
- Keadaan kosong tetap menampilkan pesan dan tombol pengembalian filter.
- Tidak ada kelas CSS yang tersisa tanpa pemakai.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka detail ruang publik yang punya fasilitas kondisi beragam.
2. Coba setiap opsi dropdown, pastikan daftar ikut berubah dan angka bertambah tetap benar.
3. Uji papan tombol: `Tab` ke dropdown, `Enter`, `ArrowDown`, `Enter`, lalu `Escape`.
4. Uji di lebar 390px dan 1280px.

**Bukti verifikasi (browser, dev server `localhost:5199`):**

1. Fixture sementara: 4 fasilitas (3 `baik`, 1 `perlu_perhatian`, 0 `rusak`) dan
   3 laporan tayang; setelah verifikasi dihapus dan basisdata kembali kosong.
2. Dropdown kondisi menampilkan `Semua (4)`, `Baik (3)`, `Perlu Perhatian (1)`,
   `Rusak (0)`; memilih `Baik` menyisakan 3 baris, memilih `Rusak (0)` memunculkan keadaan
   kosong, dan tombol reset mengembalikan 4 baris.
3. Menu tidak terpotong: panel memakai `overflow: visible` dan opsi tetap menerima klik.
4. Keyboard: `Enter` membuka, `ArrowDown` memindah fokus ke `Baik (3)`, `Enter` memilih,
   `Escape` menutup dan mengembalikan fokus ke trigger.
5. Dropdown status laporan: `Semua (3)`; memilih `Diverifikasi (1)` menulis
   `?status=diverifikasi` dan menyisakan 1 kartu; `Semua` menghapus param.
6. Lebar 390px: tanpa overflow horizontal dan dropdown selebar toolbar; 1280px normal.
7. `npm run build` lulus (`✓ built in 2.81s`), tanpa exception konsol.

---

### FE-52. Perbaikan tampilan foto bukti di halaman review laporan

**Status:** ✅

**Catatan penting tentang maksud permintaan:** permintaan aslinya berbunyi
`gambar yang di review` dan kalimatnya terputus. Task ini disusun dari cacat nyata yang
ditemukan pada halaman review laporan. Sebelum dikerjakan, konfirmasi dulu apakah maksudnya
halaman `Verifikasi & Pembaruan Laporan Fasilitas` (`/dashboard/moderasi/:laporanId`) atau
halaman lain. Di `route-config.js` tidak ada rute bernama `review`. Kandidat terdekat:
`/dashboard/moderasi/:laporanId` (verifikasi laporan) dan `/dashboard/laporan-terflag`
(moderasi konten).

**Cacat yang ditemukan:**

1. Foto bukti dipotong paksa. `DetailModerasiPage.jsx:327-329` memakai kontainer
   `height: '160px'` dengan `objectFit: 'cover'`. Pada halaman verifikasi, pemotongan ini
   merusak tujuan halamannya sendiri: petugas tidak melihat seluruh bukti.
2. Foto dirender tanpa penjagaan nilai kosong. `DetailModerasiPage.jsx:328` merender
   `<img src={laporan.foto}>` tanpa pemeriksaan, sehingga laporan tanpa foto menampilkan
   ikon gambar rusak. Bandingkan dengan `DetailStatusLaporanPage.jsx:193` yang sudah benar
   karena memakai pemeriksaan `laporan.foto ? ... : ...`.
3. Pola pemotongan yang sama ada di tiga tempat lain:
   `RiwayatLaporanPage.jsx:240-242` (tinggi 240px), `DetailStatusLaporanPage.jsx:200-202`
   (tinggi 200px), dan thumbnail galeri `DetailRuangPublikPage.jsx:651-657` (tinggi 110px).

**File utama:** `apps/web/src/features/moderasi/pages/DetailModerasiPage.jsx`

**File terkait:**

- `apps/web/src/features/laporan/pages/RiwayatLaporanPage.jsx`
- `apps/web/src/features/laporan/pages/DetailStatusLaporanPage.jsx`

**Pekerjaan:**

1. Pada halaman verifikasi, ganti `objectFit: 'cover'` menjadi `objectFit: 'contain'` dengan
   latar netral, supaya seluruh foto bukti terlihat tanpa dipotong. Untuk halaman verifikasi,
   kelengkapan bukti lebih penting daripada kerapian komposisi.
2. Tambahkan tombol untuk membuka foto ukuran penuh (mis. modal atau tautan ke berkas
   aslinya) agar petugas tetap bisa memeriksa detail.
3. Tambahkan penjagaan nilai kosong pada `DetailModerasiPage.jsx`, mengikuti pola
   `DetailStatusLaporanPage.jsx:193`.
4. Untuk kartu riwayat dan galeri, tetapkan `objectFit: 'cover'` sebagai pilihan sadar
   karena itu area ringkas, tetapi pastikan fotonya tetap bisa dibuka ukuran penuh saat diklik.
5. Tinjau tinggi tetap yang ada dan ganti dengan `aspectRatio` bila tata letaknya lebih stabil.

**Acceptance criteria:**

- Foto bukti pada halaman verifikasi terlihat utuh, tidak terpotong.
- Laporan tanpa foto menampilkan keadaan kosong yang rapi, tidak ada ikon gambar rusak.
- Foto bisa dibuka ukuran penuh dari halaman verifikasi.
- Kartu riwayat dan galeri tetap rapi, dan fotonya bisa diperbesar.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka `/dashboard/moderasi/:laporanId` dengan akun admin untuk laporan yang punya foto.
2. Uji juga laporan tanpa foto, pastikan tidak ada ikon gambar rusak.
3. Buka `/laporan-saya`, `/laporan-saya/:id`, dan galeri detail ruang publik.

**Bukti verifikasi (browser, dev server `localhost:5199`):**

1. Fixture sementara: 2 laporan milik admin (A berfoto portrait 600x900, B tanpa foto)
   dan 2 foto galeri; setelah verifikasi dihapus dan basisdata kembali kosong.
2. Halaman verifikasi A: foto `objectFit: contain` dalam kotak 4:3 sehingga seluruh foto
   terlihat; klik foto membuka modal ukuran penuh (`maxHeight 70vh`) dengan tautan
   `Buka berkas asli`; `Escape` dan `Enter` pada thumbnail berfungsi.
3. Halaman verifikasi B: teks "Tidak ada foto bukti." menggantikan gambar, tanpa ikon rusak.
4. Riwayat laporan: thumbnail tetap `cover` dan bisa diklik ke modal; kartu tanpa foto
   menampilkan "Tidak ada foto bukti.".
5. Detail status laporan: foto tetap `cover` dengan tombol perbesar; laporan tanpa foto
   memakai keadaan kosong lama.
6. Galeri detail ruang publik: lightbox dan navigasi Sebelumnya/Berikutnya tetap berjalan.
7. Mobile 390px: kotak foto tetap 4:3 dan modal muat di viewport. Overflow horizontal
   halaman admin berasal dari `AdminLayout` (sidebar 260px tanpa breakpoint, sudah ada
   sebelum FE-52; halaman daftar moderasi juga 508px), di luar lingkup task ini.
8. `npm run build` lulus, tanpa exception konsol.

---

### FE-53. Hapus atau ganti simbol di halaman Tentang

**Status:** ✅

**Temuan awal:** `TentangPage.jsx` bersih dari emoji. Jadi yang dimaksud simbol di sini
adalah ikon.

**Kandidat hapus atau ganti:**

| Lokasi | Baris | Alasan |
| --- | --- | --- |
| `TentangPage.jsx` | 216 | `ChevronDown` pada tombol `Cara Kerja Platform` |

Baris 216 adalah kandidat terkuat. Ikon panah bawah dipasang pada tombol yang bukan
dropdown, dan halaman ini memang punya bagian FAQ yang benar-benar dropdown dengan ikon
yang sama (baris 108-112). Satu ikon dipakai untuk dua arti berbeda.

**Kandidat peninjauan (ikon yang tidak menambah informasi):**

| Lokasi | Baris | Isi |
| --- | --- | --- |
| `TentangPage.jsx` | 226, 235, 244, 253 | empat ikon pada baris statistik (`Trees`, `CheckCircle2`, `ClipboardList`, `ShieldCheck`) |
| `TentangPage.jsx` | 313 | ikon `Trees` pada label kapital |
| `TentangPage.jsx` | 291, 342 | ikon pada setiap kartu alur dan kartu fasilitas |
| `TentangPage.jsx` | 371, 401, 411 | ikon pada tiga kartu fitur |
| `TentangPage.jsx` | 381-384 | empat ikon `Check` sebagai pengganti bullet |

Baris 226 sampai 253 menumpuk ikon, angka, dan label sekaligus, sehingga ada empat ikon
yang tidak menambah informasi apa pun. Ini kandidat pembersihan pertama.

**Jangan dihapus (ikon fungsional):**

| Lokasi | Baris | Alasan |
| --- | --- | --- |
| `TentangPage.jsx` | 108-112 | `ChevronDown` akordeon FAQ, menandakan keadaan buka/tutup |
| `TentangPage.jsx` | 270 | `RotateCcw` pada tombol `Coba lagi` |
| `TentangPage.jsx` | 437, 448, 458 | `Mail` dan `Phone`, karena ada tautan `mailto:` dan `tel:` |

**File utama:** `apps/web/src/features/tentang/pages/TentangPage.jsx`

**Pekerjaan:**

1. Baris 216: hapus `ChevronDown`, atau ganti dengan ikon yang menandakan gulir ke bawah
   (mis. `ArrowDown`) supaya tidak sama dengan ikon dropdown.
2. Baris 226 sampai 253: kurangi menjadi paling banyak satu penanda, atau hapus seluruhnya.
   Angka dan labelnya sudah menjelaskan isinya. Empat lingkaran ikon berwarna pada satu baris
   juga membuat warna jadi tidak terarah, lihat FE-54.
3. Baris 313: hapus ikon `Trees`; label kapitalnya sudah cukup.
4. Baris 371, 401, 411: tinjau ketiganya bersamaan. Kartu unggulan boleh menyimpan ikonnya,
   dua kartu pendukung sebaiknya tidak, agar hierarkinya terbaca.
5. Baris 381-384: ganti keempat ikon `Check` dengan daftar biasa atau satu penanda yang
   konsisten; empat ikon centang berbaris terasa seperti hiasan.
6. Setelah perubahan, periksa impor yang tidak terpakai dan pastikan tata letaknya tidak
   bergeser aneh akibat hilangnya ikon.

**Acceptance criteria:**

- Ikon panah yang membingungkan pada tombol non-dropdown sudah dihilangkan atau diganti.
- Ikon pada baris statistik sudah dikurangi atau dihapus, dan barisnya tetap rapi.
- Ikon yang benar-benar berfungsi (FAQ, `Coba lagi`, mailto, tel) tetap ada.
- Tidak ada impor ikon yang menganggur.
- Halaman tetap terbaca di desktop dan mobile.
- `npm run build` dari `apps/web` lulus.

**Bukti verifikasi (browser, dev server `localhost:5199` + build produksi `localhost:5201`):**

1. Tombol `Cara Kerja Platform` memakai ikon `ArrowDown`; tidak ada lagi `ChevronDown`
   di tombol itu. Klik tombol tetap menggulir ke bagian alur (posisi bagian 0px dari atas).
2. Empat ikon pada baris statistik dihapus; keempat sel berisi angka dan label saja, tanpa
   `svg`. Desktop tetap 4 kolom, mobile 390px menjadi 2 kolom tanpa overflow.
3. Ikon `Trees` pada label banner RTH dihapus; label kapital berdiri sendiri.
4. Kartu unggulan `Direktori Ruang Publik Jakarta` tetap memakai `MapPin`; dua kartu
   pendukung (`Status Kondisi Terbuka`, `Moderasi oleh Petugas Resmi`) kini tanpa ikon.
5. Empat ikon `Check` diganti daftar biasa: `listStyleType: disc`, `padding-left: 20px`,
   empat butir tanpa `svg`, satu kolom di mobile.
6. Ikon fungsional utuh: `ChevronDown` akordeon FAQ (buka/tutup berjalan, `aria-expanded`
   berubah), `RotateCcw` pada `Coba lagi`, serta `Mail`/`Phone` pada tautan
   `mailto:pengaduan@jakarta.go.id` dan `tel:1500164`.
7. State error `Coba lagi` diuji pada build produksi (`vite preview`, `IS_DEV=false`) dengan
   intercept CDP: saat kedua permintaan statistik gagal, banner "Sebagian statistik gagal
   dimuat." muncul bersama ikon `RotateCcw`; setelah klik `Coba lagi`, banner hilang dan
   nilai statistik terisi kembali. Tanpa exception JS.
8. Impor `Trees`, `Check`, dan `CheckCircle2` dihapus; `ArrowDown` ditambahkan. Aturan CSS
   `.tentang-feature-points li` dan kedua varian `.tentang-feature-icon-accent` yang menjadi
   yatim ikut dihapus. `npm run build` lulus (2,83 s).
9. Catatan di luar lingkup: pada build produksi logo tampil rusak karena `LogoRuka.png`
   berada di `apps/web/` (root), bukan `public/`, sehingga tidak ikut tersalin oleh Vite.
   Perilaku ini sudah ada sebelum FE-53 dan tidak diubah di task ini.

---

### FE-54. Perbaikan sistem warna: badge, mode gelap, dan palet

**Status:** ❌

**Gejala:** pewarnaan keseluruhan terasa seragam dan tidak bermakna. Ini temuan terukur,
bukan soal selera.

**Temuan 1. Badge status hampir semuanya putih, sehingga tidak menyampaikan status.**
Pada `index.css`, `.badge-success`, `.badge-danger`, `.badge-info`, dan `.badge-neutral`
semuanya memakai `background-color: #FFFFFF` dengan `border-color: #E2E8F0`. Hanya
`.badge-warning` yang bertinta (`#FFFBEB`). Artinya badge `Baik`, `Rusak`, `Info`, dan
`Netral` tampil sebagai pil putih yang sama, hanya dibedakan titik 6px.

Bukti live: `.badge-success` terhitung `{ bg: rgb(255,255,255), color: rgb(4,120,87),
border: rgb(226,232,240) }`.

**Temuan 2. Mode gelap rusak karena warna literal.**
Halaman tema tersedia di `/profil/tema` dan `ProfilContext.jsx:90` memasang
`data-theme="dark"`. Bukti live setelah tema gelap aktif: badan halaman menjadi
`rgb(11,17,32)`, tetapi `.badge-success` tetap `rgb(255,255,255)`. Jadi ada pil putih
menyala di atas kartu gelap.

Penyebabnya, warna yang tidak ikut token dan ditulis langsung di JSX: 23 nilai hex berbeda,
antara lain `#991B1B` (10 kali), `#64748B` (8), `#475569` (5), `#F8FAFC` (5), `#065F46` (4),
`#92400E` (4), `#FEE2E2` (4), `#F1F5F9` (3), `#B91C1C` (3), `#D1FAE5` (2), `#334155` (2),
plus 20 varian `rgba()` literal. Semuanya mengunci tema terang.

**Temuan 3. Palet terlalu banyak dan semuanya dipakai sebagai aksen.**
Token resmi sudah 12 warna (primary, accent, info, success, warning, danger, masing-masing
dengan varian light), lalu di JSX dipakai lagi 23 hex di luar token. `DESIGN.md` §1.1
memang mendefinisikan 9 kategori, jadi persoalannya bukan jumlah token, melainkan
pemakaiannya tanpa hierarki: teal primary, amber accent, success, warning, dan info
semuanya muncul sebagai aksen dalam satu halaman.

**Temuan 4. Judul hero memakai teks bergradien.**
`index.css:1232-1240`, `.hero-title-gradient` memakai
`linear-gradient(105deg, #5EEAD4 0%, #2DD4BF 48%, #FCD34D 100%)` plus `filter: drop-shadow`.
Catatan teknis: kelas ini memasang `color: #2DD4BF` sekaligus
`-webkit-text-fill-color: transparent`. Bila mesin render tidak mendukung `background-clip: text`,
nilai `color` tidak menolong karena `text-fill-color` sudah transparan, sehingga judulnya
berisiko hilang. Varian browser ini belum diuji.

**Temuan 5. Peta diredam dan bertabrakan dengan warna merek.**
`PetaSebaranLokasi.jsx:212` dan `DetailRuangPublikPage.jsx:416` memakai
`filter: 'grayscale(70%) contrast(1.2) brightness(1.05)'`. Peta OSM diredam menjadi abu-abu,
sementara marker dan cluster tetap `#0F766E` di atasnya.

**Temuan 6. Dokumen arah desain tidak tersambung ke pekerjaan.**
`apps/web/Public/RukaFinalFigma/DESIGN.md` sudah berisi token warna, tipografi, jarak,
radius, dan komponen. Letaknya di dalam folder aset dan tidak dirujuk dari `AGENTS.md`,
sehingga aturannya tidak dipaksakan dan kode menyimpang.

**Temuan 7. Instalasi antislop belum lengkap.**
`.agents/skills/` memuat `antislop`, `antislop-code`, `antislop-copywriting`, dan
`antislop-human`. Yang **tidak ada**: `antislop-ui` dan `antislop-layoutmobile`. Blok
penunjuk di `AGENTS.md` justru menunjuk ke dua skill yang tidak ada itu. Karena task ini
adalah pekerjaan UI, dua skill itulah yang paling dibutuhkan.

**Prasyarat sebelum mengerjakan:** tentukan mode antislop. `AGENTS.md` mewajibkan
pertanyaan ini diajukan sebelum pekerjaan UI dimulai. Pilihannya: memakai aturan antislop
selama pengerjaan, atau mengaudit setelah selesai. Selain itu, lengkapi dulu
`antislop-ui` dan `antislop-layoutmobile` supaya ada acuan arah warna. Tanpa arah,
antislop hanya menyaring dan hasilnya cenderung monoton.

**File utama:** `apps/web/src/index.css`

**File terkait:** seluruh file JSX yang memuat nilai warna literal, serta `AGENTS.md`

**Pekerjaan:**

1. Beri warna pada badge status. Setiap keadaan harus bisa dibedakan tanpa membaca teksnya:
   latar bertinta, teks gelap, dan titik penanda. Gunakan token yang sudah ada, bukan hex baru.
2. Pastikan seluruh warna status memakai token yang ikut berubah saat `data-theme="dark"`
   aktif. Ganti seluruh hex literal di JSX dengan `var(--color-*)`.
3. Tambahan token bila memang dibutuhkan (mis. `--color-danger-text` sudah ada, pakai itu
   alih-alih `#991B1B`).
4. Tetapkan hierarki aksen: satu warna untuk aksi utama, satu untuk penekanan, sisanya hanya
   untuk status. Tuliskan alasannya di satu baris, sesuai acuan `DESIGN.md`.
5. Tangani judul hero: ganti teks bergradien dengan warna solid, atau pertahankan gradien
   dengan nilai cadangan `color` yang aman bila `background-clip: text` tidak didukung.
6. Tinjau `filter` pada peta. Kurangi peredamannya atau hapus, lalu sesuaikan warna marker
   agar tidak bertabrakan.
7. Sambungkan `DESIGN.md` ke `AGENTS.md` agar arah desain benar-benar terpakai. Ini dilakukan
   dengan persetujuan, karena mengubah berkas masuk.
8. Uji seluruh perubahan pada tema terang dan tema gelap.

**Acceptance criteria:**

- Badge `Baik`, `Perlu Perhatian`, `Rusak`, `Info`, dan `Netral` bisa dibedakan dari warna
  latarnya, bukan hanya dari teks atau titik.
- Mode gelap tidak lagi menampilkan blok putih menyala; seluruh warna status ikut token.
- Tidak ada lagi nilai warna hex literal di JSX untuk warna yang punya token.
- Rasio kontras teks pada badge memenuhi WCAG AA 4,5:1 di kedua tema.
- Judul hero tetap terbaca di semua browser yang didukung, tanpa risiko hilang.
- Peta tidak lagi terlihat kotor akibat peredaman.
- Arah desain tertulis jelas dan bisa dirujuk pekerjaan berikutnya.
- `npm run build` dari `apps/web` lulus.

**Verifikasi:**

1. Buka `/ruang-publik`, `/ruang-publik/:id`, dan `/dashboard` pada tema terang.
2. Aktifkan mode gelap di `/profil/tema`, lalu periksa semua halaman yang sama.
3. Periksa kontras badge memakai `.agents/skills/antislop-human/contrast-check.py`.
4. Periksa judul hero di `/home` pada tema terang dan gelap.

---

## Prioritas Rekomendasi (Diperbarui)


### Sudah Selesai

- **FE-04** — Setup HTTP client Axios dengan interceptor
- **FE-05** — Setup environment variable
- **FE-07** — Fallback lokasi manual (klik/drag pin di peta)
- **FE-08** — Clustering marker peta publik & dashboard admin
- **FE-12** — Filter fasilitas multi-select
- **FE-19** — Tampilkan status hasil submit laporan
- **FE-34** — Kolom alamat di kelola fasilitas
- **FE-35** — Kartu peta sebaran dashboard jadi kotak
- **FE-36** — Detail ruang publik wajib login
- **FE-37** — Guest tidak boleh menyimpan ruang
- **FE-38** — Hapus "Paling Relevan"
- **FE-39** — Hapus gambar dummy "Area Pelaporan"
- **FE-40** — Label "Kondisi Baik" konsisten
- **FE-41** — Pengaturan page size 10/20/50/100
- **FE-42** — Status fasilitas HomePage jadi Baik
- **FE-43** — Tampilan session admin di navbar publik
- **FE-14** — Galeri foto detail ruang publik (data foto scraping sudah masuk via BE-57)

### Prioritas Berikutnya

1. **FE-28** — Trigger manual ETL dari UI (admin operasional)
2. **FE-25** — Fix hardcode presisi di moderasi (data accuracy)
3. **FE-25A** — Tombol Setujui integrasi BE-29 (endpoint sudah siap, lihat sub-bagian A3)
4. **FE-15** — Integrasi OSRM routing (advanced feature)
5. **FE-21** dan **FE-26** — Fitur flag laporan
6. **FE-44** — Tombol like foto galeri (menunggu BE-58)
7. **FE-45** — Zoom pinch trackpad di peta (selesai, terverifikasi di tiga peta)
8. **FE-46** — Foto ruang publik jadi kotak, hapus teks di atas foto (selesai)
9. **FE-47** — Tombol panah kiri-kanan pada galeri foto (selesai)
10. **FE-48** — Seragamkan rounded corner tombol dan kontrol (selesai)
11. **FE-49** — Halaman dimulai dari tengah saat berpindah rute (bug navigasi)
12. **FE-50** — Hapus simbol yang tidak membawa informasi
13. **FE-51** — Filter kondisi fasilitas publik jadi dropdown
14. **FE-52** — Perbaikan tampilan foto bukti di halaman review laporan
15. **FE-53** — Hapus atau ganti simbol di halaman Tentang
16. **FE-54** — Perbaikan sistem warna: badge, mode gelap, dan palet

---

## Verifikasi Setiap Implementasi

1. Jalankan build frontend dengan `npm run build` dari `apps/web`.
2. Uji loading, empty state, error state, dan success state pada fitur yang diubah.
3. Uji desktop dan layar mobile tanpa overflow horizontal.
4. Uji navigasi keyboard dan fokus tombol/link.
5. Uji akses guest serta user login untuk perubahan yang berhubungan dengan autentikasi.
6. Periksa Network browser untuk memastikan payload dan respons API sesuai kontrak backend.
7. Pastikan tidak ada console error setelah perubahan.
