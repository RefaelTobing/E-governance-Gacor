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

### FE-34. Tambah kolom alamat pada halaman Kelola Fasilitas (Admin)

**Status:** ❌

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

### FE-35. Ubah marker peta sebaran menjadi kotak (Admin/Public)

**Status:** ❌

**File utama:** `apps/web/src/features/ruang-publik/components/PetaSebaranLokasi.jsx`

**File terkait:** `apps/web/src/features/moderasi/components/PetaDashboardAdmin.jsx`

**Pekerjaan:**

1. Identifikasi peta dashboard yang dimaksud dan samakan bentuk marker bila diperlukan.
2. Ubah fungsi `createCustomIcon` pada line 27-44:
   - Ganti `border-radius: 50% 50% 50% 0` menjadi `border-radius: 4px` (kotak).
   - Hapus `transform: rotate(-45deg)`.
   - Sesuaikan `iconAnchor` agar marker tetap tepat pada koordinat (misalnya `[12, 12]` untuk kotak 24x24px).
3. Pastikan marker tetap jelas pada berbagai zoom level.
4. Uji popup dan navigasi ke detail setelah perubahan.

**Acceptance criteria:**

- Marker berbentuk kotak/persegi, bukan pin tetesan.
- Marker berada tepat pada koordinat ruang publik.
- Popup dan klik marker tetap berfungsi normal.

---

### FE-36. Detail ruang publik wajib login

**Status:** ❌

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

**Status:** ❌

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

**Status:** ❌

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

### FE-39. Perbaiki gambar Area Pelaporan di Detail Ruang Publik

**Status:** ❌

**File utama:** `apps/web/src/features/ruang-publik/pages/DetailRuangPublikPage.jsx`

**Pekerjaan:**

1. Identifikasi section "Peta Akses & Batas Kawasan" yang saat ini menampilkan foto ruang publik dengan overlay "Spot Utama" (line ~298-309).
2. Ganti gambar foto dengan:
   - **Preview peta Leaflet kecil** menunjukkan lokasi ruang publik (static map atau mini MapContainer), ATAU
   - **Gambar placeholder peta** jika foto khusus area pelaporan belum tersedia, ATAU
   - **Peta interaktif mini** yang bisa diklik untuk membuka peta besar.
3. Hindari menggunakan gambar dekoratif ruang publik sebagai representasi area pelaporan.
4. Pastikan overlay atau label sesuai dengan isi gambar (misalnya "Lokasi Ruang Publik" bukan "Spot Utama").

**Acceptance criteria:**

- Section gambar menampilkan representasi visual lokasi yang relevan, bukan foto ruang publik generik.
- Jika memakai peta mini, marker harus tepat pada koordinat ruang publik.
- Layout tidak rusak pada layar mobile.

---

### FE-40. Samakan label status fasilitas menjadi "Kondisi Baik"

**Status:** ❌

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

### FE-41. Tambahkan pengaturan jumlah data per halaman (Page Size)

**Status:** ❌

**File utama:** `apps/web/src/features/ruang-publik/pages/DaftarRuangPublikPage.jsx`

**Pekerjaan:**

1. Tambahkan state `pageSize` dengan default 12:

```jsx
const [pageSize, setPageSize] = useState(12);
```

2. Ganti konstanta `PER_HALAMAN` dengan state `pageSize` pada perhitungan pagination (line 160-164).

3. Tambahkan dropdown pengaturan jumlah data per halaman di atas atau di samping sorting:

```jsx
<SelectDropdown
  options={['12', '24', '48']}
  value={String(pageSize)}
  onChange={(val) => setPageSize(Number(val))}
  ariaLabel="Jumlah per halaman"
/>
```

4. Reset halaman ke 1 saat `pageSize` berubah:

```jsx
useEffect(() => {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.delete('halaman');
    return next;
  });
}, [pageSize, setSearchParams]);
```

5. (Opsional) Simpan pilihan page size ke `localStorage` agar tetap konsisten antar session.

**Acceptance criteria:**

- User dapat memilih jumlah data per halaman: 12, 24, atau 48.
- Halaman otomatis reset ke halaman 1 saat jumlah per halaman berubah.
- Daftar dan pagination tetap sinkron.
- Tidak ada overflow atau layout rusak pada mobile.

---

### FE-42. Section "Cek Kondisi Fasilitas" di HomePage: semua status jadi Baik

**Status:** ❌

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

### Prioritas Tinggi (Security & UX Kritikal)

1. **FE-36** — Detail ruang publik wajib login (security + konsistensi)
2. **FE-37** — Guest tidak boleh menyimpan ruang (bug keamanan)
3. **FE-19** — Tampilkan status hasil submit laporan (UX laporan)
4. **FE-38** — Hapus "Paling Relevan" (consistency)
5. **FE-40** — Samakan label "Kondisi Baik" (consistency)

### Prioritas Menengah (Admin Workflow & Polish)

6. **FE-34** — Kolom alamat di kelola fasilitas (admin UX)
7. **FE-39** — Perbaiki gambar area pelaporan (visual accuracy)
8. **FE-41** — Pengaturan page size (user flexibility)
9. **FE-42** — Status baik semua di HomePage (consistency)
10. **FE-28** — Trigger manual ETL dari UI (admin operasional)
11. **FE-25** — Fix hardcode presisi di moderasi (data accuracy)

### Prioritas Rendah (Nice-to-Have)

12. **FE-35** — Marker kotak di peta (visual preference)
13. **FE-08** — Clustering marker (performance)
14. **FE-15** — Integrasi OSRM routing (advanced feature)
15. **FE-12** — Filter fasilitas multi-select
16. **FE-21** dan **FE-26** — Fitur flag laporan

---

## Verifikasi Setiap Implementasi

1. Jalankan build frontend dengan `npm run build` dari `apps/web`.
2. Uji loading, empty state, error state, dan success state pada fitur yang diubah.
3. Uji desktop dan layar mobile tanpa overflow horizontal.
4. Uji navigasi keyboard dan fokus tombol/link.
5. Uji akses guest serta user login untuk perubahan yang berhubungan dengan autentikasi.
6. Periksa Network browser untuk memastikan payload dan respons API sesuai kontrak backend.
7. Pastikan tidak ada console error setelah perubahan.
