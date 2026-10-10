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
| FE-13 | ✅ | Detail ruang publik | Menampilkan nama, kategori, alamat, jam, deskripsi, dan fasilitas. |
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
| FE-29 | ❌ | Unit test komponen kritikal memakai React Testing Library. |
| FE-30 | ⚠️ | Uji manual browser desktop dan mobile untuk halaman publik serta admin. |
| FE-31 | ⚠️ | Uji alur end-to-end: cari ruang publik, lihat detail, kirim laporan, cek status, dan moderasi admin. |

## A5. Build dan Deploy

| ID | Status | Task |
| --- | --- | --- |
| FE-32 | ⚠️ | Build production frontend publik dan admin, serta konfigurasi environment production. |
| FE-33 | ❌ | Deploy frontend publik dan admin ke domain atau subdomain terpisah. |

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

### Prioritas Berikutnya

1. **FE-28** — Trigger manual ETL dari UI (admin operasional)
2. **FE-25** — Fix hardcode presisi di moderasi (data accuracy)
3. **FE-25A** — Tombol Setujui integrasi BE-29 (endpoint sudah siap, lihat sub-bagian A3)
4. **FE-15** — Integrasi OSRM routing (advanced feature)
5. **FE-21** dan **FE-26** — Fitur flag laporan

---

## Verifikasi Setiap Implementasi

1. Jalankan build frontend dengan `npm run build` dari `apps/web`.
2. Uji loading, empty state, error state, dan success state pada fitur yang diubah.
3. Uji desktop dan layar mobile tanpa overflow horizontal.
4. Uji navigasi keyboard dan fokus tombol/link.
5. Uji akses guest serta user login untuk perubahan yang berhubungan dengan autentikasi.
6. Periksa Network browser untuk memastikan payload dan respons API sesuai kontrak backend.
7. Pastikan tidak ada console error setelah perubahan.
