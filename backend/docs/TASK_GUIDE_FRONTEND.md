# Task Guide Frontend

Dokumen ini mencatat status implementasi frontend dan pekerjaan yang masih perlu diselesaikan.

Status:

- ✅ Selesai
- ⚠️ Sebagian selesai atau perlu verifikasi
- ❌ Belum dikerjakan

## A0. Setup dan Fondasi Frontend Publik

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-01 | ✅ | Inisialisasi React dan struktur folder | Struktur komponen, halaman, service, hook, dan utilitas tersedia. |
| FE-02 | ✅ | Routing React Router | Route publik, warga, dan admin tersedia. |
| FE-03 | ✅ | Styling dasar dan design system | Token desain serta komponen button, card, dan badge tersedia. |
| FE-04 | ❌ | Setup HTTP client Axios dengan interceptor | Aplikasi masih menggunakan wrapper `fetch` di `apps/web/src/config/api.js`. |
| FE-05 | ⚠️ | Setup environment variable | `VITE_API_BASE_URL` tersedia. Konfigurasi routing/peta perlu dilengkapi bila dibutuhkan. |

## A1. Peta dan Direktori Ruang Publik

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-06 | ✅ | Leaflet dan OpenStreetMap | Sudah dipakai pada peta sebaran, detail ruang publik, dan form laporan. |
| FE-07 | ⚠️ | Geolocation pengguna dengan fallback manual | Hook geolocation tersedia. Fallback input lokasi manual belum eksplisit. |
| FE-08 | ⚠️ | Marker ruang publik dengan clustering | Marker sudah tampil, clustering untuk data padat belum ada. |
| FE-09 | ✅ | Kontrol radius pencarian | Radius pencarian sudah tersedia di halaman daftar ruang publik. |
| FE-10 | ✅ | List view sinkron dengan peta dan urutan jarak | Daftar dan sorting jarak sudah tersedia. |
| FE-11 | ✅ | Filter kategori | Filter kategori ruang publik tersedia. |
| FE-12 | ❌ | Filter fasilitas multi-select | Belum ada filter fasilitas dari API pada halaman daftar. |
| FE-13 | ✅ | Detail ruang publik | Menampilkan nama, kategori, alamat, jam, deskripsi, dan fasilitas. |
| FE-14 | ⚠️ | Galeri foto detail | Foto resmi ada, foto laporan terverifikasi belum digabungkan. |
| FE-15 | ❌ | Routing OSRM | Tombol Google Maps tersedia, rute OSRM pada peta belum diimplementasikan. |

## A2. Lapor Fasilitas

| ID | Status | Task | Catatan |
| --- | --- | --- | --- |
| FE-16 | ✅ | Form laporan, kategori masalah, deskripsi, dan unggah foto | Validasi tipe serta ukuran gambar tersedia. |
| FE-17 | ✅ | Ambil lokasi HP saat submit | Browser Geolocation API mengirim `lat_user` dan `long_user`. |
| FE-18 | ✅ | Pilihan identitas anonim atau tampilkan nama | Pilihan tersedia dengan default anonim. |
| FE-19 | ❌ | Status hasil submit | Masih memakai alert umum, belum membedakan laporan tayang dan menunggu tinjauan. |
| FE-20 | ⚠️ | Riwayat laporan per ruang publik | Riwayat warga tersedia, filter atau section per ruang publik belum lengkap. |
| FE-21 | ❌ | Flag laporan tayang | Belum ada mekanisme laporan tidak pantas oleh pengguna. |

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
| FE-24 | ✅ | Dashboard moderasi laporan | Daftar laporan menunggu verifikasi tersedia. |
| FE-25 | ⚠️ | Detail laporan moderasi | Foto, deskripsi, dan aksi status tersedia. Titik presisi masih perlu memakai data laporan, bukan teks hardcode. |
| FE-26 | ❌ | Daftar laporan yang di-flag | Belum tersedia. |
| FE-27 | ⚠️ | Manajemen data master ruang publik | Halaman tersedia, indikator edit manual perlu diverifikasi/dilengkapi. |
| FE-28 | ❌ | Trigger sinkronisasi ETL dari admin | Endpoint backend tersedia, kontrol UI belum tersedia. |

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

1. **FE-19** — Tampilkan status hasil submit laporan (UX laporan)
2. **FE-28** — Trigger manual ETL dari UI (admin operasional)
3. **FE-25** — Fix hardcode presisi di moderasi (data accuracy)
4. **FE-08** — Clustering marker (performance)
5. **FE-15** — Integrasi OSRM routing (advanced feature)
6. **FE-12** — Filter fasilitas multi-select
7. **FE-21** dan **FE-26** — Fitur flag laporan

---

## Verifikasi Setiap Implementasi

1. Jalankan build frontend dengan `npm run build` dari `apps/web`.
2. Uji loading, empty state, error state, dan success state pada fitur yang diubah.
3. Uji desktop dan layar mobile tanpa overflow horizontal.
4. Uji navigasi keyboard dan fokus tombol/link.
5. Uji akses guest serta user login untuk perubahan yang berhubungan dengan autentikasi.
6. Periksa Network browser untuk memastikan payload dan respons API sesuai kontrak backend.
7. Pastikan tidak ada console error setelah perubahan.
