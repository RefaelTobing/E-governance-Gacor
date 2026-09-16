# CONVENTIONS.md — Raku Jakarta (Frontend)

> Dokumen ini adalah "aturan main" teknis untuk siapa pun (manusia atau AI agent) yang menulis kode di repo ini.
> Untuk **apa** yang harus dibangun, baca PRD (`docs/PRD.md`). Dokumen ini soal **bagaimana** menulis kodenya supaya konsisten.
>
> Baca file ini dulu sebelum menambah halaman, komponen, atau route baru.

---

## 0. Prinsip Utama: Setiap Fitur Punya URL Sendiri

Ini aturan paling penting di project ini: **setiap layar/halaman harus punya path URL nyata**, bukan disimulasikan lewat state React (`useState` untuk "halaman aktif") atau modal yang cuma bisa dibuka dari satu tempat.

Kenapa: pengguna harus bisa **maju/mundur (browser back-forward)**, **refresh**, dan **share/bookmark link** tanpa balik ke `/home` atau kehilangan konteks.

**Konsekuensi praktisnya:**
- Detail ruang publik → `/ruang-publik/:id`, BUKAN modal yang muncul dari state `selectedId` di halaman list.
- Form lapor → `/ruang-publik/:id/lapor`, BUKAN step di dalam modal yang sama dengan detail.
- Tab di dalam admin (moderasi, data master) → masing-masing punya path sendiri (`/dashboard/moderasi`, `/dashboard/data-master`), BUKAN `activeTab` state di satu komponen `Dashboard.jsx`.
- Filter kategori/fasilitas di peta → tercermin di **query string** (`/home?kategori=taman-kota&fasilitas=toilet`), supaya refresh tidak mereset filter dan hasil filter bisa di-share.
- Detail laporan yang sedang ditinjau admin → `/dashboard/moderasi/:laporanId`, BUKAN panel samping yang cuma render dari state lokal.

**Yang TETAP boleh pakai state lokal (bukan URL):** hal yang murni UI sementara dan tidak perlu di-bookmark — misalnya dropdown terbuka/tertutup, tooltip, atau form yang belum di-submit. Aturannya sederhana: *kalau pengguna akan kesal ketika refresh menghilangkan ini, itu harus jadi URL.*

Semua ini diimplementasikan dengan React Router (nested routes), bukan conditional rendering di satu komponen besar.

---

## 1. Routing

### 1.1 Satu sumber kebenaran: `route-config.js`

Semua path didefinisikan di `src/routes/route-config.js`, bukan ditulis manual di `App.jsx`. Menambah halaman = menambah entri di array ini.

```js
// src/routes/route-config.js
export const routes = [
  // ---- PUBLIK ----
  { path: "/", redirectTo: "/home" },
  { path: "/home", component: "features/ruang-publik/pages/HomePage", layout: "public" },
  { path: "/ruang-publik/:id", component: "features/ruang-publik/pages/DetailPage", layout: "public" },
  { path: "/ruang-publik/:id/lapor", component: "features/laporan/pages/FormLaporPage", layout: "public" },
  { path: "/laporan-saya", component: "features/laporan/pages/RiwayatLaporanPage", layout: "public", protected: true },
  { path: "/login", component: "features/auth/pages/LoginPage", layout: "public" },

  // ---- ADMIN (path prefix /dashboard, role dicek via RequireAdmin) ----
  { path: "/dashboard", component: "features/moderasi/pages/DashboardPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/moderasi", component: "features/moderasi/pages/AntrianModerasiPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/moderasi/:laporanId", component: "features/moderasi/pages/DetailModerasiPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/data-master", component: "features/data-master/pages/DataMasterPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/data-master/:ruangPublikId", component: "features/data-master/pages/EditRuangPublikPage", layout: "admin", protected: true, role: "admin" },

  // ---- FALLBACK ----
  { path: "*", component: "features/shared/pages/NotFoundPage", layout: "public" },
];
```

`App.jsx` hanya bertugas me-render array ini lewat `createBrowserRouter` / `<Routes>` — tidak pernah ada logic kondisional "kalau path ini tampilkan komponen itu" ditulis manual di luar file ini.

### 1.2 Aturan penamaan path

- Semua path **lowercase, kebab-case**: `/ruang-publik/:id`, bukan `/ruangPublik/:id` atau `/RuangPublik/:id`.
- Path admin **selalu** diawali `/dashboard`. Jangan pernah taruh halaman admin di luar prefix ini — ini satu-satunya penanda yang dipakai `RequireAdmin` dan juga dipakai untuk analytics/logging nanti.
- Parameter dinamis pakai nama deskriptif, bukan `:id` generik kalau ada lebih dari satu jenis entitas di path yang sama (`:laporanId` vs `:ruangPublikId`, seperti contoh di atas).
- State filter/pencarian yang perlu bertahan saat refresh → **query string**, bukan path segment baru. Path segment baru hanya untuk entitas (punya ID), bukan untuk kondisi tampilan.

### 1.3 Proteksi route

Semua route dengan `protected: true` dibungkus `<RequireAuth>`; yang punya `role: "admin"` dibungkus lagi `<RequireAdmin>`. Kedua wrapper ini baca dari `AuthContext`, redirect ke `/login` (dengan query `?redirect=<path-asal>`) kalau belum login/role tidak cocok. Jangan cek role manual di dalam body komponen halaman — itu tanggung jawab wrapper, bukan halaman.

---

## 2. Struktur Folder: Feature-First

Kode dikelompokkan **per fitur**, bukan per tipe file. Satu fitur = satu folder mandiri berisi komponen, hook, service, dan halamannya sendiri.

```
src/
├── config/
│   ├── categories.js       # daftar kategori ruang publik & fasilitas — tambah kategori di sini saja
│   ├── api.js               # base URL & endpoint map
│   └── constants.js         # radius default, ambang fake-GPS (ditampilkan, bukan dihitung di sini), dll.
├── routes/
│   ├── route-config.js
│   ├── RequireAuth.jsx
│   └── RequireAdmin.jsx
├── layouts/
│   ├── PublicLayout.jsx     # navbar publik, dipakai semua halaman "public"
│   └── AdminLayout.jsx      # sidebar admin, dipakai semua halaman "admin"
├── features/
│   ├── ruang-publik/
│   │   ├── pages/            # HomePage.jsx, DetailPage.jsx
│   │   ├── components/       # PetaInteraktif.jsx, KartuRuangPublik.jsx, FilterKategori.jsx
│   │   ├── hooks/             # useRuangPublikList.js, useRuangPublikDetail.js
│   │   ├── services.js        # semua panggilan API fitur ini ada di sini
│   │   └── index.js           # barrel export
│   ├── laporan/
│   │   ├── pages/             # FormLaporPage.jsx, RiwayatLaporanPage.jsx
│   │   ├── components/        # FormLapor.jsx, ModeIdentitas.jsx, GaleriFoto.jsx
│   │   ├── hooks/
│   │   ├── services.js
│   │   └── index.js
│   ├── moderasi/               # fitur admin — pola folder identik dengan fitur publik
│   ├── data-master/
│   └── auth/
├── components/                # HANYA komponen generik lintas-fitur: Button, Modal, Spinner, EmptyState
├── hooks/                      # HANYA hook lintas-fitur: useGeolocation, useDebounce
├── context/
│   └── AuthContext.jsx
├── utils/                      # haversine.js, formatters.js
├── App.jsx
└── main.jsx
```

**Aturan penempatan:** kalau ragu suatu komponen/hook masuk `features/x/` atau folder generik di root, defaultnya taruh di dalam fitur dulu. Baru dipindah ke `components/` atau `hooks/` root **setelah** dipakai 2+ fitur berbeda. Ini mencegah folder generik membengkak jadi tempat sampah.

**Barrel export wajib:** tiap `features/*/index.js` meng-ekspor semua yang perlu diakses dari luar fitur (biasanya: halaman + 1-2 komponen publik). Import lintas fitur selalu lewat barrel ini:

```js
// BENAR
import { FormLaporPage } from "@/features/laporan";

// SALAH — menembus struktur internal fitur lain
import FormLaporPage from "@/features/laporan/pages/FormLaporPage";
```

Ini yang membuat struktur *changeable*: selama barrel export-nya tidak berubah, isi dalam folder fitur boleh direstrukturisasi bebas tanpa merusak fitur lain.

---

## 3. Pola Pemanggilan API

- Semua panggilan HTTP lewat `services.js` milik masing-masing fitur. **Tidak ada** `fetch()` atau `axios()` langsung di dalam komponen/halaman.
- Base URL dan path endpoint terpusat di `src/config/api.js`, bukan di-hardcode di tiap `services.js`.
- Pola nama fungsi: kata kerja + entitas → `getRuangPublikById(id)`, `submitLaporan(payload)`, `approveLaporan(id)`, bukan `fetchData()` generik.
- State hasil fetch (loading/error/data) dikelola lewat hook fitur (`useRuangPublikDetail(id)`), komponen halaman tinggal pakai hook-nya, tidak menulis ulang logic fetch.

```js
// features/ruang-publik/services.js
import { api } from "@/config/api";

export const getRuangPublikList = (params) => api.get("/ruang-publik", { params });
export const getRuangPublikById = (id) => api.get(`/ruang-publik/${id}`);
```

---

## 4. Manajemen State — Kapan Pakai Apa

| Jenis data | Simpan di |
|---|---|
| Data dari server (list ruang publik, detail laporan) | Hook fitur + cache lokal sederhana (mis. React Query) — **jangan** di Context global |
| Sesi login & role pengguna | `AuthContext` (satu-satunya global context) |
| Filter pencarian, kategori aktif, halaman list | **Query string URL** (lihat Bagian 0), dibaca lewat `useSearchParams` |
| Status form yang belum disubmit | State lokal komponen (`useState`/`useReducer`) |
| Apapun yang harus bertahan saat refresh dan bisa di-share | URL (path atau query), bukan state React sama sekali |

Jangan membuat Context baru per fitur kecuali benar-benar dipakai oleh banyak komponen tak berelasi dalam fitur yang sama dan prop-drilling sudah jadi masalah nyata.

---

## 5. Penamaan File & Komponen

- Komponen React: `PascalCase.jsx` — `FormLapor.jsx`, `KartuRuangPublik.jsx`.
- Hook: `camelCase.js`, selalu diawali `use` — `useRuangPublikList.js`.
- Service, util, config: `camelCase.js` — `services.js`, `haversine.js`.
- Halaman (dipetakan di `route-config.js`): akhiran `Page` — `HomePage.jsx`, `DetailModerasiPage.jsx`. Ini memudahkan membedakan sekilas mana file yang berdiri sendiri sebagai route vs komponen pendukung.
- Satu file = satu komponen/hook/fungsi utama. Hindari file "kitchen sink" berisi banyak komponen tak terkait.

---

## 6. Styling

- pakai pendekatan dari tim.
- Style spesifik fitur tinggal di folder fitur masing-masing (co-located), style generik (`Button`, `Modal`) di `components/`.
- Tidak ada inline style kecuali untuk nilai dinamis dari data (mis. posisi marker), bukan untuk styling statis.

---

## 7. Environment Variables

Semua env var didaftarkan di `.env.example` (commit ke repo) dan `config/api.js`/`config/constants.js` sebagai satu-satunya tempat yang boleh membaca `import.meta.env` langsung.

| Variable | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | Base URL backend FastAPI |
| `VITE_OSRM_BASE_URL` | Endpoint instance publik OSRM (lihat PRD Bagian 6.4) |
| `VITE_DEFAULT_RADIUS_KM` | Radius pencarian default (FEAT-001) |
| `VITE_FAKE_GPS_THRESHOLD_M` | Nilai tampilan ambang validasi lokasi (perhitungan aktual tetap di backend, ini hanya untuk teks bantuan di UI) |

Komponen/hook lain **tidak boleh** memanggil `import.meta.env` langsung — selalu lewat `config/`.

---

## 8. Checklist Sebelum Menambah Fitur/Halaman Baru

1. Tentukan path URL-nya dulu (ikuti Bagian 0 & 1.2) — kalau ini "layar baru", dia butuh path baru, bukan state baru.
2. Tambahkan entri di `route-config.js`.
3. Buat folder di `src/features/<nama-fitur>/` mengikuti struktur Bagian 2 kalau fitur belum ada.
4. Tulis pemanggilan API di `services.js` fitur tsb., bukan langsung di komponen.
5. Ekspor halaman/komponen yang perlu diakses dari luar lewat `index.js` fitur tsb.
6. Cek: apakah halaman ini butuh `protected`/`role` di route-config? Jangan cek auth manual di dalam komponen.
7. Jalankan: refresh di halaman baru, tekan back lalu forward di browser — pastikan state yang penting tidak hilang.

---

## 9. Referensi Silang

- **Apa yang harus dibangun tiap fitur** (FEAT-001 s.d. FEAT-013, kriteria penerimaan): `docs/PRD_Raku_Jakarta.docx` Bagian 4.
- **Keputusan arsitektur yang sudah final** (local storage, OSRM publik, panel admin via `/dashboard`, ambang fake-GPS, dll.): `docs/PRD_Raku_Jakarta.docx` Lampiran A — Riwayat Keputusan.
- **Struktur folder backend & database**: lihat `README.md` di root repo.
