# WORKFLOW_FRONTEND_PHASES — Rencana & Status Fase A–I (Frontend RuangTerbuka)

> Dokumen ini adalah **status nyata** rencana kerja frontend per-fase, diverifikasi
> langsung terhadap kode & git per **2026-10-09**. Ditulis sebagai **dokumen
> serah-terima (handoff)** ketika berpindah komputer/OS.
>
> - Panduan aturan kerja: [`docs/WORKFLOW_FRONTEND.md`](../../docs/WORKFLOW_FRONTEND.md)
> - Daftar task per-ID: [`backend/docs/TASK_GUIDE_FRONTEND.md`](TASK_GUIDE_FRONTEND.md)
> - Konvensi kode: [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md)
>
> **Selalu verifikasi ulang terhadap kode sebelum bertindak** — dokumen ini bisa
> menjadi stale. Cek dengan `git log`, `git status`, dan grep.

---

## 0. Cara Pakai Dokumen Ini (khusus saat pindah OS)

### 0.1 Status keamanan data — SUDAH AMAN

```
Branch : dev  (bukan main — jangan push langsung ke main)
Remote : https://github.com/RefaelTobing/E-governance-Gacor.git
Sync   : local dev == origin/dev  (0 ahead, 0 behind)  ✅
Working tree: bersih (tidak ada perubahan tertinggal)
```

**Kesimpulan:** seluruh kerja Fase A–D sudah **ke-push ke GitHub**.
Pindah OS cukup dengan `git clone` — tidak ada yang perlu dipindah manual.

### 0.2 Langkah setup di OS baru

```bash
git clone https://github.com/RefaelTobing/E-governance-Gacor.git
cd E-governance-Gacor
git switch dev

# Frontend
cd apps/web
npm install          # Node 18+ / Vite 5
npm run dev          # http://localhost:5173

# Backend (untuk uji E2E — wajib untuk verifikasi runtime, bukan cuma build)
cd ../../backend
# ikuti docs/WORKFLOW_BACKEND.md / RUNNING.md untuk venv + .env + DB
uvicorn app.main:app --reload   # http://localhost:8000
```

Catatan penting soal lingkungan:
- **Verifikasi minimal** = `npm run build` harus hijau.
- **Verifikasi penuh** = dev server + backend hidup + login admin, lalu klik alurnya.
  Selama sesi ini backend **tidak pernah** dijalankan penuh (tidak ada `.env`/`.venv`
  di mesin lama), jadi FE diuji runtime dengan **mock backend sementara di port 8000**
  (Vite proxy sudah mengarah ke `127.0.0.1:8000` — lihat `apps/web/vite.config.js`).
- `package.json` memakai nama `"raku-jakarta-web"` → **ini sampah brand lama** (Audit Fase G).

### 0.3 Konvensi commit (sudah terpakai di 4 commit di bawah)

```
<type>(<scope>): <subject singkat, bahasa Indonesia, huruf kecil, tanpa titik>
```
Type: `feat` | `fix` | `refactor` | `docs` | `chore` | `test`.

---

## 1. Ringkasan Progres

| Fase | Tema | Status | Commit |
|---|---|---|---|
| **A** | Routing & Fondasi | ✅ Selesai & push | `2695b8d` |
| **B** | Moderasi Admin | ✅ Selesai & push | `09928ee` |
| **C** | Flag Laporan | ✅ Selesai & push | `21cf225` |
| **D** | Data Master & ETL | ✅ Selesai & push | `bb6c752` |
| **E** | Laporan & Ruang Publik | ✅ Selesai & push | `7f81e9e` |
| **F** | OSRM Routing (FE-15) | ✅ Selesai — belum di-commit | — |
| **G (audit)** | Audit fitur terlarang + brand + backlog | ✅ Selesai & push | `420b7a9` + `72976f1` |
| **G (visual)** | Verifikasi visual + responsif + a11y | ✅ Selesai — belum di-commit | (lihat §8) |
| **H** | Testing (FE-29/30/31) | ⏳ Belum dikerjakan | — |
| **I** | Build & Deploy (FE-32/33) | ⏳ Belum dikerjakan | — |

**6 dari 9 fase selesai + G-audit (pre-pass).** Sisa: G-visual, H, I — untuk urutan & alasannya, lihat **§11**.

---

## 2. FASE A — Routing & Fondasi  ✅ (`2695b8d`)

### Masalah
- `App.jsx` menulis `<Routes>` secara manual → `route-config.js` jadi **sumber kedua**,
  melanggar `CONVENTIONS.md` §1.1.
- `route-config.js` menunjuk file **yang tidak ada** (`features/data-master/pages/EditRuangPublikPage.jsx`).
- Route `*` cuma **redirect diam-diam ke `/home`** — pengguna tak pernah tahu URL-nya salah.
- `/ruang-publik/:id` belum ditandai `protected` di config (padahal kode membungkus `RequireAuth`).

### Yang dikerjakan
1. **`App.jsx` ditulis ulang** — me-render **seluruh** route dari `route-config.js`
   memakai `import.meta.glob('./features/**/pages/*.jsx')` + `React.lazy` + `<Suspense>`.
   - Bonus tak terencana: **code-splitting otomatis**. Bundle utama turun
     **799 kB → 213 kB** (gzip 228 → 67 kB); tiap halaman jadi chunk sendiri.
   - Guard dipertahankan: `RequireAuth`/`RequireAdmin` tetap di level **layout**.
2. **`features/shared/pages/NotFoundPage.jsx` (BARU)** — halaman 404 asli + tombol "Kembali ke Beranda".
3. **`route-config.js` disinkronkan**:
   - tambah `protected: true` untuk `/ruang-publik/:id`
   - **hapus** entri mati `EditRuangPublikPage`
   - **tambah** `/dashboard/fasilitas/:ruangPublikId` → `DetailFasilitasRuangPublikPage` (yang
     selama ini ada di `App.jsx` tapi hilang di config)

### File
| File | Aksi |
|---|---|
| `apps/web/src/App.jsx` | Ditulis ulang (render dari config) |
| `apps/web/src/routes/route-config.js` | Disinkronkan |
| `apps/web/src/features/shared/pages/NotFoundPage.jsx` | **BARU** |

### ⚠️ Keputusan konflik yang harus diketahui
1. **`CONVENTIONS.md` §1.1 contohnya `createBrowserRouter`, repo pakai `<BrowserRouter>` + nested `<Routes>`.**
   → Diputuskan: **pertahankan arsitektur existing** (nested `<Routes>`), hanya sumber
   data route yang dipindah ke config. Alasan: `App.jsx` di dalam `AuthProvider`, dan
   aturan repo **dilarang membuat arsitektur routing kedua**.
2. **`CONVENTIONS.md` §1.3** minta redirect `?redirect=<path>`, tapi `RequireAuth`
   existing memakai `state: { from: location }`.
   → Diputuskan: **pertahankan `state.from`** agar tidak merusak `DetailRuangPublikPage`
   yang sudah memakainya. **Ini selisih dengan dokumen — belum disamakan.**

### Verifikasi yang sudah dijalankan
- `npm run build` hijau; **26 route resolve, 0 file hilang** (dicek script).
- Browser: `/url-ngawur` → tampil 404, URL **tetap** (tidak redirect).
- Guard: `/dashboard` → `/login-pemerintah`; `/laporan-saya` & `/profil` → `/login`.
- Setelah disuntik auth admin: `/dashboard`, `/dashboard/moderasi`,
  `/dashboard/laporan-terflag`, `/dashboard/fasilitas`, `/profil` → render OK.
- Tidak ada Vite error overlay / error konsol.

---

## 3. FASE B — Moderasi Admin  ✅ (`09928ee`)

### Masalah
- Antrian admin membaca `GET /reports` (hanya laporan **tayang**) → laporan
  `menunggu_verifikasi` **tak pernah terlihat** admin. (Endpoint `GET /admin/reports` sudah siap.)
- Tombol **Setujui/Tolak** (endpoint BE-29/BE-30) sudah ada, **UI belum ada**.
- Aksi Tolak memakai `PATCH` tanpa alasan; `alasan_penolakan` tak pernah ditampilkan.
- `DetailModerasiPage` penuh teks dummy + timeline hardcoded.

### Yang dikerjakan
1. **FE-24** — `DashboardPage` & `AntrianModerasiPage` ganti ke `GET /api/v1/admin/reports`.
2. **FE-25A** — tombol **Setujui** → `POST /admin/reports/{id}/approve`
   (body `{description}` opsional; `409` = tak bisa di-approve).
3. **FE-25B** — tombol **Tolak** → `POST /admin/reports/{id}/reject` + **dialog alasan wajib**;
   tangani `409` (sudah ditolak) & `422` (alasan kosong); tampilkan `alasanPenolakan`.
4. **FE-25 hardcode dibersihkan**:
   - ❌ `ID SPESIFIKASI: F-PK-0882` (asset code — fitur terlarang)
   - ❌ `Sisi Selatan Teuku Umar` → sekarang koordinat asli `laporan.lokasiPilihan`
   - ❌ `Prioritas Penataan Fasum` (dispatch — fitur terlarang) → jadi `WILAYAH`
   - ❌ `Menteng, Jakarta Pusat` → `laporan.wilayah`
   - ❌ Timeline 3 entri dummy → render dari `laporan.timeline`
   - Bonus: stepper status dihitung dinamis dari `currentStatus` (tadinya "TAHAP 3 DARI 4" selalu).

### File
| File | Aksi |
|---|---|
| `src/services/laporanService.js` | + `getAdminReports`, `approveReport`, `rejectReport`, transform (`tanggal`, `alasanPenolakan`, `ruangPublikId`), `updateReportStatus` kini di-normalisasi |
| `src/features/moderasi/pages/DetailModerasiPage.jsx` | Berat — tombol Setujui/Tolak, dialog alasan, stepper dinamis, timeline dari data |
| `src/features/moderasi/pages/AntrianModerasiPage.jsx` | Endpoint admin |
| `src/features/moderasi/pages/DashboardPage.jsx` | Endpoint admin |
| `src/components/Modal.jsx` | **BARU** — modal generik (Esc, klik luar, auto-fokus, `role="dialog"`) |
| `src/components/index.js` | + export `Modal` |

### Aturan anti "sukses palsu"
- `alert()` sukses **dihapus** → panel `role="alert"`.
- `409` → tampilkan pesan backend + **muat ulang detail**, bukan sukses.
- State direfresh dari response (`LaporanDetailResponse`: status + timeline).

---

## 4. FASE C — Flag Laporan  ✅ (`21cf225`)

### Yang dikerjakan
1. **FE-26** — halaman admin **"Laporan Ditandai"** (`LaporanTerflagPage.jsx`) →
   `GET /api/v1/admin/reports/flagged` (BE-31), menampilkan `flag_count` urut terbanyak,
   + route `/dashboard/laporan-terflag` + menu sidebar "Laporan Ditandai" (ikon Flag).
2. **FE-21** — aksi **"Tandai Tidak Pantas"** oleh warga → `POST /reports/{id}/flag` (BE-25),
   di section **"Pembaruan Partisipasi Warga"** pada halaman detail ruang publik.

### Service baru di `laporanService.js`
`getFlaggedReports` · `getSpaceReports` · `flagReport` · field transform `flagCount`, `userId`.

### File
| File | Aksi |
|---|---|
| `src/features/moderasi/pages/LaporanTerflagPage.jsx` | **BARU** |
| `src/features/ruang-publik/pages/DetailRuangPublikPage.jsx` | + section partisipasi warga + tombol flag |
| `src/services/laporanService.js` | + 3 fungsi, + `flagCount`/`userId` |
| `src/features/moderasi/index.js`, `src/App.jsx`, `src/routes/route-config.js`, `src/layouts/AdminLayout.jsx` | Route & menu |

### ⚠️ Keputusan desain (penting)
**Sebelum fase ini tidak ada permukaan publik tempat warga melihat laporan orang lain** —
padahal itu syarat mutlak tombol flag. Diputuskan memakai section
**"Pembaruan Partisipasi Warga"** karena:
- `DESIGN.md` §pemetaan `/ruang-publik/:id` memuat *"Pembaruan Partisipasi Warga"*;
- Figma `Screen 04` memperlihatkan kartu laporan terkini ("Lampu mati di jalur selatan");
- PRD **FEAT-011** eksplisit *"dapat ditambah mekanisme flag oleh pengguna lain"*.

Perilaku flag: wajib login (guest → `/login`), tombol **disembunyikan** untuk laporan sendiri,
`409` (sudah pernah menandai) → jadi label "Sudah Ditandai", `flag_count` di-refresh dari response.

---

## 5. FASE D — Data Master & ETL  ✅ (`bb6c752`)

> FE-28 (trigger ETL) **sudah selesai sebelumnya** — tombol "Impor Data Satu Data"
> + riwayat run sudah terhubung `POST/GET /api/v1/admin/sync-data`.
> Fase D fokus ke **FE-27**.

### Masalah
- Tombol **"Edit Master"** hanya memunculkan `alert()` — padahal `PATCH /admin/public-spaces/{id}`
  (BE-33) sudah siap.
- `DataMasterPage` membaca `GET /public-spaces` (endpoint **publik**) yang **tidak**
  memuat `field_source` → indikator edit manual mustahil tampil.

### Yang dikerjakan
1. **Service admin baru** di `ruangPublikService.js`:
   - `getAdminPublicSpaces()` → `GET /api/v1/admin/public-spaces` (BE-32),
     membawa `field_source` + `jumlah_fasilitas`.
   - `updatePublicSpaceManual()` → `PATCH .../{id}` (BE-33).
   - **Tanpa fallback mock** (beda dari endpoint publik): kegagalan admin harus **terlihat
     jujur**, bukan berubah jadi daftar kosong yang menyesatkan.
2. **`DataMasterPage`**:
   - kolom baru **"SUMBER DATA"** → `Sumber Satu Data` (netral) vs
     `N kolom diedit manual` (warning) dengan `title` berisi nama kolom.
   - state sukses + error dengan tombol "Coba lagi".
   - `jumlah_fasilitas` kini diambil langsung dari response (menghapus 1 request `getAllFacilities`).
3. **`EditRuangPublikModal` (BARU)** — form 14 kolom (nama, kategori, wilayah, kecamatan,
   kelurahan, alamat, jam operasional, tiket, akses disabilitas, ramah hewan, deskripsi,
   latitude, longitude, verified), dengan **pratinjau "Kolom yang akan ditandai"**.

### File
| File | Aksi |
|---|---|
| `src/services/ruangPublikService.js` | + `getAdminPublicSpaces`, `updatePublicSpaceManual`, mapper `keBarisMaster` |
| `src/features/data-master/pages/DataMasterPage.jsx` | Endpoint admin, kolom SUMBER DATA, modal |
| `src/features/data-master/components/EditRuangPublikModal.jsx` | **BARU** (308 baris) |

### 🔑 Aturan terpenting: kirim HANYA kolom yang berubah
Ini inti kebenaran FE-27. Kalau semua kolom dikirim, `field_source` (FEAT-012) akan
menandai **seluruh baris** sebagai milik admin → **ETL tak akan pernah menimpanya lagi**
(bug diam-diam yang merusak data Satu Data).

Verifikasi runtime yang sudah dijalankan (dengan mock backend port 8000):
```
✓ Klik "Edit Master" -> modal terbuka
✓ Belum ada perubahan -> tombol "Simpan Perubahan" disabled (pratinjau "Belum ada perubahan")
✓ Ubah deskripsi -> tombol aktif, pratinjau "Deskripsi"
✓ Simpan -> modal tertutup, pesan sukses, badge jadi "1 kolom diedit manual"
✓ Bukti kunci: PATCH terima {deskripsi} saja;
  field_source = {'deskripsi': '2026-10-09T00:00:00'}  <- HANYA kolom yang diubah
```

### Keputusan: modal, bukan halaman
`route-config` dulu punya pointer `EditRuangPublikPage` yang tak pernah dibuat
(dibuang di Fase A). FE-27 diimplementasikan sebagai **modal** — mengikuti pola
komponen `DetailFasilitasRuangPublik.jsx` yang sudah ada, dan tidak menambah route.

---

## 6. FASE E — Laporan & Ruang Publik  ✅ SELESAI (E1/E2/E3)

Backend **sudah siap semua** untuk tiga task ini. Semua dikerjakan & diverifikasi runtime.

### E1. Laporan Saya per-pengguna  (`GET /reports/mine`, BE-50)  ✅
- **Masalah (diperbaiki):** `getUserReports()` dulu cuma alias ke `getReports(params)`
  (endpoint **publik**, semua laporan tayang) → **kebocoran privasi**: user melihat laporan
  orang lain di halaman "Laporan Saya".
- **Aksi:** `getUserReports` sekarang memanggil `GET /api/v1/reports/mine` (semua status,
  wajib auth) **tanpa fallback mock** (endpoint auth/privasi — kegagalan harus terlihat).
- **401:** panel error + tombol "Masuk Kembali" (`/login?redirect=`) di `RiwayatLaporanPage`
  & `ProfilDashboardPage` (bukan redirect otomatis).
- **Bonus perbaikan:** kotak "PEMBARUAN TERAKHIR" di `RiwayatLaporanPage` dulu membaca field
  mock (`pembaruanTerakhir`/`tanggalPembaruan`) yang **tak ada di kontrak list** → kosong.
  Diganti data asli: `Terakhir diperbarui {updated_at}` + menampilkan `alasanPenolakan` saat
  `ditolak`. Tab **"Ditolak"** ditambahkan (dulu status ini tak pernah tampil).
- **File:** `services/laporanService.js`, `features/laporan/pages/RiwayatLaporanPage.jsx`,
  `features/profil/pages/ProfilDashboardPage.jsx`, `data/mockData.js` (hapus field mock).
- **Gerbang:** akun A hanya melihat laporannya sendiri (diuji 2 akun → A=1, B=0).

### E2. FE-20 — Riwayat laporan per ruang publik  ✅
- **Endpoint:** `GET /api/v1/public-spaces/{id}/reports` (laporan **tayang saja**, tanpa
  param `status` → filter **klien-side**).
- **Aksi:** section "Pembaruan Partisipasi Warga" (`DetailRuangPublikPage`) diperkaya:
  tab status **Semua / Diverifikasi / Dalam Penanganan / Selesai** tersinkron ke
  `?status=` (CONVENTIONS §1.2, bertahan saat refresh) + tombol **"Muat Lebih Banyak"**.
  Satu request `limit=500` (maks backend) dipakai ganda: sumber daftar + set foto galeri.
- **File:** `features/ruang-publik/pages/DetailRuangPublikPage.jsx`.
- **Keputusan scope:** hanya di halaman detail (bukan `DetailStatusLaporanPage` — halaman itu
  konteks "laporan saya", menampilkan laporan orang lain di situ membingungkan).

### E3. FE-14 — Galeri foto detail  ✅
- **Temuan kontrak:** backend **sudah menggabung** foto resmi + foto laporan tayang di
  `GET /api/v1/public-spaces/{id}` → `foto: List[str]` (`services/ruang_publik.py:gabung_foto`),
  **tanpa label sumber**.
- **Aksi:** section "Galeri Foto" di `DetailRuangPublikPage` (grid proporsi konsisten, tinggi
  110px; disembunyikan bila ≤1 foto) + **lightbox** (komponen `Modal` generik, prev/next,
  Esc/klik luar). Label **"Dokumentasi Warga"** diberikan lewat **cross-ref** `fotoUrl` laporan
  tayang (data asli, tanpa mengubah backend). Foto dinormalisasi ke URL absolut di
  `ruangPublikService`.
- **File:** `features/ruang-publik/pages/DetailRuangPublikPage.jsx`,
  `services/ruangPublikService.js`.
- **Catatan:** FE-16D (koordinat individual fasilitas) **masih terblokir data** — master fasilitas
  belum punya koordinat sendiri. Jangan dikerjakan sebelum backend menambahkan kolomnya.

### Gerbang Fase E  ✅
Alur klik utuh: beranda → daftar → detail → form lapor → status → **laporan saya**
(hanya milik sendiri) → riwayat per ruang → galeri. Diverifikasi runtime dengan backend hidup.

---

## 7. FASE F — OSRM Routing (FE-15)  ✅ SELESAI

- **Aksi yang dikerjakan:**
  1. **Fix kritis:** default `OSRM_BASE_URL` di `config/constants.js` diganti
     `https://router.project-osrm.net` → **`https://router.project-osrm.org`**
     (domain `.net` **tidak resolve** di jaringan pengujian; `.org` terverifikasi `code=Ok`).
  2. Hook baru `hooks/useRuteOsrm.js` → `GET {OSRM_BASE_URL}/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`.
     Menangani konversi `[lng,lat]`/`[lat,lng]` (anti-swap), `AbortController`,
     state `isLoading`/`galat`/`tidakDitemukan`, **tanpa fallback mock**.
  3. `Polyline` (Leaflet, tanpa library peta baru) + **marker lokasi user** (biru)
     + `fitBounds` agar peta membungkus seluruh rute.
  4. Tombol **"Petunjuk Arah (Google Maps)"** tetap jadi fallback navigasi.
  5. Degradasi aman: lokasi belum ada → tombol "Gunakan Lokasi Saya untuk Rute";
     OSRM down → pesan jujur, peta & tombol Google Maps tetap jalan.
- **File:** `config/constants.js`, `hooks/useRuteOsrm.js` (baru),
  `features/ruang-publik/pages/DetailRuangPublikPage.jsx`.
- **Gerbang:** ✅ rute muncul (diverifikasi runtime: Jakarta → Buperta Cibubur,
  `code=Ok`, 22.965m, 495 titik, titik ujung tepat di marker); OSRM down → tombol
  Google Maps tetap jalan.

---

## 8. FASE G — Verifikasi Visual, Responsif, A11y, Audit

> **Status:** **Fase G SELESAI** — audit (G4/G5/G6), G1 (visual 12 layar subset,
> audit lengkap di [`AUDIT_VISUAL_G1-2026-10-10.md`](AUDIT_VISUAL_G1-2026-10-10.md)),
> G2 (responsif), G3 (a11y) semuanya dikerjakan. Belum di-commit (menunggu satu commit
> rangkaian Fase G).

### G1. Verifikasi visual 12 layar (Fase 4 workflow) — ✅ subset terpilih dikerjakan
Sumber gambar: `apps/web/Public/RukaFinalFigma/Screen*.png` + `DESIGN.md`.

**Hasil audit:** 50 temuan; user memilih **15 diperbaiki**, 5 di-skip, sisanya (LOW/deviasi
disengaja) dibiarkan. Detail per-temuan + label keyakinan: `AUDIT_VISUAL_G1-2026-10-10.md`.

**Dikerjakan (15):** G1-02 (judul login), G1-04 (form register: konfirmasi sandi, hint, S&K,
footer), G1-14 (banner CTA terang + section "Temukan Ruang Publik di Sekitarmu"), G1-37
(**halaman baru** Detail Fasilitas publik `/ruang-publik/:id/fasilitas/:fasilitasId`),
G1-39 (kartu Lokasi Terpilih form lapor), G1-40 (counter deskripsi 200), G1-51/52/54
(stepper timeline + pill status + kartu bukti foto), G1-60 (tombol "Lihat Riwayat"),
G1-64 (footer bantuan login pemda), G1-71 (hapus label "Distrik Terpadu"), G1-72 (ekspor
CSV dashboard), G1-84/87 (stepper + panel aksi detail moderasi).

**Komponen baru:** `components/StepperAlur.jsx` (timeline node+garis, dipakai 2 halaman).

Checklist per layar (`docs/WORKFLOW_FRONTEND.md` §8 Fase 4):
- [x] Layout: lebar kontainer, posisi section, kolom, proporsi kartu/peta/gambar
- [x] Tipografi: Plus Jakarta Sans, ukuran heading/body, weight, line-height
- [x] Spasi: kelipatan **4px** (4/8/12/16/24/32/48/64)
- [x] Warna: primary `#0F766E`, badge status, teks, border
- [x] Komponen: tombol, badge (**ikon + teks**, bukan warna saja), input, tabel, timeline
- [x] Konten: **jangan mengubah konten** demi tampilan "lebih enak"
- Layar: 01a/02 beranda, 03 daftar, 04 detail, 05 detail fasilitas, 06 form lapor,
  06B kamera, 07 detail status, 08 laporan saya, 09 login pemda, 10 dashboard,
  11 daftar laporan, 12 detail laporan.

### G2. Responsif ✅ SELESAI (desktop-first, BUKAN mobile-first)
- Utilitas baru `.grid-split` → grid dua-kolom ber-lebar px tetap (`minmax(0,1fr) 340px` dll)
  ditumpuk jadi 1 kolom di ≤768px. Diterapkan di: DetailRuangPublik, DetailStatusLaporan,
  DetailFasilitasWarga, DetailModerasi, FormLapor, RiwayatLaporan.
- Navbar publik: menu **tidak lagi dihilangkan** di mobile — jadi scroll horizontal,
  navbar `flex-wrap` (navigasi tetap bisa dipakai).
- `StepperAlur`: `minWidth` + `overflow-x:auto` agar tidak pecah di layar sempit.
- Tabel admin (Dashboard, AntrianModerasi, DataMaster) **sudah** dibungkus `overflow-x:auto`.

### G3. Aksesibilitas ✅ SELESAI
- **Alt text**: semua `<img>` sudah punya `alt` (diverifikasi grep).
- **Label form**: komponen `Input` + semua `select`/`textarea` sudah pakai `label htmlFor`.
- **Fokus keyboard**: tambah `:focus-visible` pada `.profile-dropdown-item` &
  `.profile-dropdown-logout` (sebelumnya `outline:none` tanpa pengganti).
- **Kontras**: token sudah WCAG-aware (`--color-success-text`, `--color-danger-text`
  varian gelap; `--color-text-muted` #64748B = 4.76:1 di putih, lolos AA).
- **Status bukan warna saja**: `StatusBadge` selalu teks label (bukan dot/warna saja).

### G4. Audit fitur terlarang ✅ SELESAI (`chore(frontend): audit G4-G6`)
Temuan awal dokumen (grep 2026-10-09) **semua sudah dibereskan**, plus temuan baru
dari grep menyeluruh yang belum tercatat di draft awal:

| Temuan | Lokasi awal | Aksi |
|---|---|---|
| `Akurasi GPS ±4m (Presisi)` | `DetailStatusLaporanPage.jsx:234` | **Dihapus** (blok GPS accuracy) |
| `Tim teknis dan regu...` / `Kontak regu` / `Tambah Regu Petugas` / `Hubungi Regu` | `PetugasLapanganPage.jsx:45,48,90,101` | Diganti netral (`petugas`, `Daftar petugas…`) |
| SLA `1x24 jam` | `HomePage.jsx:548`, `TentangPage.jsx:85`, `BantuanPage.jsx:15`, `StatusHasilSubmit.jsx:73` | Klaim waktu dihapus → "ditinjau pengelola sebelum ditayangkan" |
| `tim patroli teknis` / `petugas teknis ... suku cadang` | `FormLaporPage.jsx:709,726` | Ditulis ulang netral |
| `presisi` di copy user-facing | `HomePage`, `Tentang`, `Bantuan`, `FormLapor` (error + komentar) | → "titik lokasi" |
| `audit log` | `BantuanPage.jsx:19` | → "integritas laporan" |
| `favorit` | `RuangTersimpanPage.jsx:77` | → "untuk mengaksesnya dengan cepat" |
| `rating` (pipeline mati) | `TESTIMONIALS` + `statsService.getTestimonials` + CSS marquee orphan | **Dihapus seluruhnya** (tak ada konsumen) |
| Kata terlarang di mock dev | `mockData.js` (tim teknis, petugas teknis, `Regu 0X`, "Estimasi 1-2 Hari") | Dibersihkan |
| Badge "Terverifikasi" palsu/hardcode | `DaftarRuangPublikPage:582,506`, `DashboardPage:156`, `ProfilDashboardPage:66` | Dihapus / → "Warga Terdaftar" (field `verified` asli/data-driven **tetap**) |
| Komentar "Akurasi" | `useGeolocation.js:102` | → "GPS high-accuracy" |

Catatan: endpoint backend `/statistics/testimonials` **masih** mengembalikan `rating`
— di luar scope FE, tidak disentuh.

Daftar penuh yang dilarang: SLA/countdown, penugasan teknisi/regu, kode aset, lencana
terverifikasi, presisi koordinat/GPS accuracy, bukti perbaikan, dispatch/queue, rating,
review, favorit, notifikasi, chat, gamifikasi, statistik pengunjung, AI assistant.

### G5. Audit brand ✅ SELESAI — **hanya "RuangTerbuka" yang tampil**
| Temuan | Lokasi | Aksi |
|---|---|---|
| `"name": "raku-jakarta-web"` | `apps/web/package.json` (+ `package-lock.json`) | → `"ruangterbuka-web"`, lockfile di-regenerate |
| `ruka_saved_spaces_`, `ruka_theme`, `ruka_local_profile`, `ruka_page_size` | `ProfilContext.jsx`, `DaftarRuangPublikPage.jsx` | **Rename `rt_*`**, tanpa migrasi (keputusan user — data lokal tahap MVP boleh hilang) |

Grep brand (`Raku|Raku Jakarta|RuangWarga|RUKA|raku|ruka`) di `src/` + `package.json` = **0 hit**.

### G6. Backlog teknis lintas-fase ✅ SELESAI
- [x] `config/constants.js` `CONSTANTS = {}` → **enum kanonik** `STATUS_LAPORAN` +
      `URUTAN_STATUS_LAPORAN`; dikonsumsi `StatusBadge`, `DetailModerasiPage` (stepper),
      `StatusHasilSubmit`. Filter literal di page lain sengaja dibiarkan (key sudah konsisten).
- [x] `config/categories.js` + shim `config/mockData.js` (mock mati, tak ada importer) —
      **dihapus**; `services/categoryService.js` tetap jalur resmi.
- [x] `LoginPage.jsx` register → `authService.registerWarga()` (CONVENTIONS §7); field
      "No HP" yang tak diproses backend **dihapus**.
- [x] `RequireAuth` `state.from` → **`?redirect=`** (CONVENTIONS §1.3); konsumen di
      `LoginPage`/`LoginPemerintahPage`/`DetailRuangPublikPage` + util validasi
      `utils/redirectAman.js` (anti open-redirect).
- [x] Route `*` tidak lagi redirect — sudah ✅ (Fase A).

### G-audit — Keputusan yang dikunci (Konflik → Keputusan → Alasan)
1. **localStorage `ruka_*`** → **rename `rt_*` tanpa migrasi**. Alasan: tahap MVP/dev,
   data lokal (tema, ruang tersimpan, profil lokal) boleh hilang; key internal.
2. **Field "No HP" di form register** → **dihapus**. Alasan: backend (`UserCreate`) tak
   punya kolom phone — field wajib yang datanya dibuang = "sukses palsu" bentuk lain.
3. **Halaman Ruang Tersimpan (bookmark)** → **dipertahankan**, hanya kata "favorit"
   dibersihkan. Alasan: fitur sudah jalan & ter-route; keputusan hapus/tidak ditunda ke
   akhir project (setelah G-visual/H) agar konteksnya jelas. **Catat: §45 WORKFLOWFE
   melarang "favorites/bookmarks" — ini utang keputusan yang belum ditutup.**
4. **Badge "Terverifikasi"** → hardcode/palsu **dihapus** (`DaftarRuangPublikPage`,
   `DashboardPage`, `ProfilDashboardPage` → "Warga Terdaftar"); tampilan yang
   **data-driven dari kolom BE `verified`** (`DetailRuangPublikPage`, `PetaDashboardAdmin`,
   `EditRuangPublikModal`) **tetap**. Alasan: field `verified` nyata (FE-27/BE-33).
5. **`?redirect=`** → disamakan dengan CONVENTIONS §1.3 + validasi `utils/redirectAman.js`
   (anti open-redirect). Alasan: `state.from` lama ditulis tapi **tak pernah dibaca**
   (`LoginPage` hardcode `/home`), jadi redirect pasca-login memang belum jalan.
6. **Enum status** → definisi kanonik di `constants.js`; konsumen awal `StatusBadge`,
   `DetailModerasiPage`, `StatusHasilSubmit`. Filter literal page lain dibiarkan
   (key konsisten) — refactor penuh diserahkan ke G-visual/H bila perlu.

---

## 9. FASE H — Testing  ⏳ BELUM

| ID | Task | Status |
|---|---|---|
| FE-29 | Unit test komponen kritikal (React Testing Library) | ❌ |
| FE-30 | Uji manual browser desktop & mobile (publik + admin) | ⚠️ |
| FE-31 | Uji E2E: cari → detail → kirim laporan → cek status → moderasi | ⚠️ |

**Temuan:** `apps/web/package.json` **tidak punya** test runner sama sekali — hanya
`scripts: dev/build/preview` dan devDeps `@vitejs/plugin-react` + `vite`.
Tidak ada `vitest`/`jest`/`@testing-library/*`.

**Langkah disarankan:** `npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
→ tambah `scripts.test` → konfigurasi di `vite.config.js` → uji komponen kritikal
`StatusBadge`, `Button`, `MultiSelectDropdown`, `Modal`, `FormLapor`.

---

## 10. FASE I — Build & Deploy  ⏳ BELUM

| ID | Task | Status | Catatan |
|---|---|---|---|
| FE-32 | Build production + konfigurasi env production | ⚠️ | `npm run build` lokal hijau, tapi `.env.production` belum ada |
| FE-33 | Deploy frontend publik & admin ke domain/subdomain terpisah | ❌ | |

**Pertimbangan env:** `config/constants.js` adalah satu-satunya pembaca `import.meta.env`
(`VITE_API_BASE_URL` **tanpa** suffix `/api/v1` — dulu pernah double-prefix),
`VITE_OSRM_BASE_URL`, `VITE_DEFAULT_RADIUS_KM`, `VITE_FAKE_GPS_THRESHOLD_M`.
Wajib punya `.env.example` sinkron.

Catatan build: bundle utama ~213 kB (setelah code-splitting Fase A) tapi masih ada
peringatan chunk > 500 kB (Leaflet + Home page) — bisa ditangani
`rollupOptions.output.manualChunks`.

---

## 11. Urutan Tahapan Pengerjaan (Fase E–I)

Urutan di bawah bukan sekadar A→Z. Tiap posisi punya **alasan keselamatan** —
dipilih agar kerja tidak sia-sia (tidak harus diulang) dan tidak ada risiko
**"menggugurkan nilai"** yang tertunda sampai belakang lalu lupa.

### 11.1 Urutan rekomendasi

```
0. Commit + push dokumen        ← SEKARANG, wajib sebelum pindah OS (bukan fase)
    ↓
1. Fase G — bagian AUDIT (G4/G5/G6)   ← ✅ SELESAI (pre-pass kilat: fitur terlarang + brand + backlog)
    ↓
2. Fase E  (E1 → E2 → E3)             ← ✅ SELESAI (backend siap; E1 isu privasi diperbaiki)
    ↓
3. Fase F  (FE-15 OSRM)               ← ✅ SELESAI (mandiri, buffer)
    ↓
4. Fase G — bagian VISUAL (G1/G2/G3)  ← ✅ SELESAI; berikutnya Fase H
    ↓
5. Fase H  (FE-29 → FE-30 → FE-31)   ← test terhadap kode yang sudah stabil
    ↓
6. Fase I  (FE-32 → FE-33)            ← build & deploy; gerbang terakhir selalu
```

> **Kenapa Fase G dipecah dua?** Karena dua bagiannya punya syarat waktu yang
> berbeda: audit butuh *cepat & bebas dependensi*, verifikasi visual butuh
> *UI sudah final*. Detail di §11.2.

### 11.2 Alasan tiap posisi

| # | Tahap | Kenapa di posisi ini |
|---|---|---|
| 0 | *Commit + push* | **Penyelamatan data.** File ini (dan kerja lain) harus di-push sebelum pindah OS, kalau tidak hilang. |
| 1 | **G — audit** (G4/G5/G6) | **Termurah & paling mematikan.** Cuma grep + edit kecil, tanpa backend, tanpa dependensi, selesai satu sesi — tapi isinya hal yang bisa **menggugurkan nilai** (fitur dilarang, nama brand salah). Asuransi murah dibeli di awal, jadi sisa kerja jadi bebas tekanan "ada yang bisa bikin gagal". |
| 2 | **E** (E1→E2→E3) | **Nilai tertinggi + backend wajib hidup.** E1 benerin **kebocoran privasi** (`getUserReports` masih menampilkan semua laporan, bukan cuma milik sendiri). Endpoint BE-50 & service `getPublicSpaceReports` **sudah siap** → tak perlu menunggu backend; tapi uji 2 akun butuh backend jalan, jadi kerjakan pas lingkungan disiapkan. |
| 3 | **F** (FE-15) | **Mandiri tapi bergantung layanan eksternal.** OSRM public (`router.project-osrm.net`) bisa *rate limit/down* — makanya ada fallback Google Maps. Tak butuh backend, jadi bisa dikerjakan sebagai **buffer** kalau E kehabisan scope atau backend bermasalah. |
| 4 | **G — visual** (G1/G2/G3) | **Wajib SETELAH E & F**, ini poin krusial: E2 (riwayat) + E3 (galeri) + F (rute OSRM) **mengubah tampilan `Screen 04` dan `Screen 08`**. Kalau 12 layar diverifikasi sebelum itu, hasilnya **basi** dan harus diulang. UI harus final dulu → baru dibandingkan Figma. |
| 5 | **H** (FE-29→30→31) | **Test setelah kode stabil.** FE-29 menambah tooling test **dari nol** (repo belum punya test runner) — buang-buang kalau komponen masih berubah. FE-30/31 (uji manual + E2E) secara alami jadi **QA final** sebelum deploy. G = *tampilan sesuai desain*; H = *fungsinya benar* → G dulu baru H. |
| 6 | **I** (FE-32→33) | **Prinsip universal:** build → env → deploy selalu gerbang paling akhir. Tak mungkin deploy kalau fase sebelumnya belum kelar. |

### 11.3 Gerbang wajib tiap akhir fase (kunci "aman & sukses")

Supaya beneran aman — apalagi ketika berpindah OS — **setiap fase ditutup** dengan
rutinitas yang sama, tanpa kecuali:

```
npm run build hijau
   → uji runtime (backend hidup + browser, bukan cuma build)
   → git commit
   → git push origin dev
```

**Push tiap akhir fase, jangan ditumpuk.** Begitu pindah OS, `git clone` langsung
mendapat seluruh progres tanpa risiko kehilangan.

### 11.4 Alternatif (kalau nggak mau memecah G)

Urutan sederhana 5 fase tanpa pecahan: **`E → F → G → H → I`**.

Syaratnya sama saja: **checklist audit (G4 + G5 + G6) tetap dikerjakan sebagai
pass kilat duluan**, jangan pernah menunggu sampai akhir. Intinya tidak berubah —
**audit tidak boleh tertunda ke belakang**, hanya tampilannya yang dipisah.

---

## 12. Checklist Akhir Sebelum Nyatakan Selesai

- [ ] Route satu sumber (`route-config.js`), guards jalan, 404 ada ✅ *(Fase A)*
- [ ] Tidak ada `fetch`/URL hardcode di luar `config/` + `services/` — **sebagian**
      (lihat backlog G6: `LoginPage` register)
- [ ] Kategori & data real dari API; mock hanya fallback dev — **sebagian**
      (categories.js masih mock & menyendiri)
- [x] Alur laporan terhubung backend (upload foto, koordinat, FormLaporPage)
- [ ] Semua 12 layar + `/tentang` terbuka, `npm run build` sukses ✅ build
- [x] Semua layar dibandingkan dengan screenshot Figma & diperbaiki ✅ **(G1)** — audit 50 temuan, 15 terpilih dikerjakan
- [x] Responsif + aksesibilitas dasar lolos ✅ **(G2/G3)**
- [x] Audit fitur terlarang lolos ✅ **(G4)** — grep audit bersih
- [x] Nama produk hanya `RuangTerbuka` ✅ **(G5)** — grep brand 0 hit
- [x] Laporan Saya hanya menampilkan laporan sendiri ✅ **(E1)** — uji 2 akun (A=1, B=0)
- [x] Rute OSRM dari lokasi user ke tujuan tampil di peta detail ✅ **(F/FE-15)**
- [ ] Tidak ada file `backend/` yang berubah oleh pekerjaan frontend ✅
      (kecuali dokumen docs)

---

## 13. Riwayat Commit (bagian ini sudah ter-push ✅)

```
(pending) feat(ruang-publik): FE-15 rute OSRM dari lokasi user ke tujuan di peta detail
c3e9f3f   feat: add frontend task guides and workflow phases documentation
7f81e9e   feat(laporan): E1-E3 laporan & ruang publik
77abc5d   update gitigonore
72976f1   style(frontend): ganti em dash di komentar enum status (audit antislop R-02)
420b7a9   chore(frontend): audit fitur terlarang, brand lama, dan backlog teknis (G4-G6)
3f4ebea   feat(docs): add workflow frontend phases documentation
bb6c752   feat(data-master): edit manual ruang publik dan penanda field_source (FE-27)
2695b8d   refactor(routing): App.jsx render dari route-config + halaman 404 (Fase A)
```

Sebelum `09928ee` ada `bfdb902` ke atas = kerja **backend** (BE-28…BE-55) — di luar
scope dokumen ini.

---

## 14. Prinsip Kerja yang Dipakai Selama Fase A–D (pertahankan di E–I)

1. **Baca kontrak dulu, baru nulis.** Semua endpoint divalidasi ke
   `docs/API.md` + skema `backend/app/schemas/*.py` sebelum coding.
2. **Backend dilarang disentuh** (atau kalau cuma untuk docs, catat eksplisit).
3. **Verifikasi runtime, bukan cuma `npm run build`.** Build hijau ≠ tidak rusak.
   Diuji dengan mock backend + browser sungguhan.
4. **Jangan menyembunyikan kegagalan** — endpoint admin sengaja tanpa fallback mock,
   dan `alert()` sukses palsu dihapus.
5. **Catat setiap konflik keputusan** (format: Konflik → Keputusan → Alasan),
   jangan memilih diam-diam.
6. **Satu commit = satu topik**, Conventional Commits, verifikasi dulu sebelum push.

---

*Dokumen disusun 2026-10-09. Perbarui §1, §11, §12, §13 setiap kali satu fase selesai.*
