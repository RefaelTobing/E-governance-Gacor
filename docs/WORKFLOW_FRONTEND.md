# WORKFLOW_FRONTEND.md — Panduan Pengerjaan Frontend (RuangTerbuka)

> Dokumen ini adalah instruksi kerja **langkah demi langkah untuk AI coding agent** yang mengerjakan frontend React di `apps/web/`.
> Diturunkan dari `docs/WORKFLOWFE.md` (spesifikasi aturan produk & desain), `docs/CONVENTIONS.md` (konvensi kode), `apps/web/public/RukaFinalFigma/DESIGN.md` (design system), `docs/Structure.md`, dan `docs/PRD.md` — seluruhnya diverifikasi ke kondisi aktual repo.
> Backend punya workflow sendiri: [`docs/WORKFLOW_BACKEND.md`](WORKFLOW_BACKEND.md). Jangan mengubah file di `backend/`.

---

## 1. Tujuan

Membangun/menyempurnakan UI RuangTerbuka agar **secara visual konsisten dengan design system dan referensi Figma**, sekaligus **terhubung ke API backend yang nyata**, dengan urutan kerja berfase yang bisa diikuti agent tanpa menebak-nebak.

Proses wajib per halaman: **BACA → AUDIT → MAP → IMPLEMENT → RENDER → BANDINGKAN → PERBAIKI**.
Jangan menyatakan halaman selesai hanya karena kompilasi sukses — harus juga **mirip desain referensi** dan **tanpa error konsol**.

---

## 2. Ruang Lingkup

**Boleh dikerjakan:** seluruh isi `apps/web/` (src, public, package.json, vite.config.js).

**TIDAK boleh:**

- Mengubah `backend/**`, membuat endpoint, migrasi, atau model
- Menambah library baru sebelum memeriksa apakah kemampuan itu sudah ada (cek `package.json` dulu)
- Menambah/mengubah route di luar `src/routes/route-config.js` + `App.jsx` tanpa mengikuti konvensi §6
- Mengarang fitur yang tidak ada di PRD/DESIGN.md/Figma

**Jika backend belum siap untuk sebuah fitur:** gunakan fallback mock yang **sudah terpusat** — jangan menyebar objek mock baru ke dalam JSX. Pola yang sudah dipakai repo ini: `src/data/mockData.js` + fallback `if (IS_DEV)` di `src/services/*.js`. Pertahankan pola itu.

---

## 3. Sumber Kebenaran & Prioritas

| Prioritas | Sumber | Menjawab |
|---|---|---|
| 1 | Kebutuhan produk eksplisit (PRD + instruksi terkini) | Apa yang harus ada |
| 2 | `apps/web/public/RukaFinalFigma/DESIGN.md` | Token warna/tipografi/jarak/radius & pemetaan layar |
| 3 | Screenshot Figma di `apps/web/public/RukaFinalFigma/Screen*.png` | Wujud visual akhir tiap layar |
| 4 | `docs/CONVENTIONS.md` | Bagaimana menulis kode (routing, folder, services, state) |
| 5 | `docs/Structure.md` + kode yang sudah ada | Di mana kode hidup; konvensi arsitektur saat ini |
| 6 | Asumsi UI umum | Paling rendah — jangan menimpa 1-5 |

**Aturan konflik:** identifikasi → catat → pilih solusi paling tidak destruktif → pertahankan arsitektur yang ada. Jangan memilih diam-diam. Format catatan:

```
Konflik: DESIGN.md menyebut X, kode route memakai Y.
Keputusan: pertahankan Y (kontrak arsitektur), terapkan X di lapisan UI.
```

---

## 4. Fakta Kondisi Aktual (baca sebelum mulai — jangan audit ulang dari nol)

Repo sudah **jauh melampaui** gambaran di `docs/WORKFLOWFE.md` dan `docs/Structure.md` (keduanya menggambarkan kondisi awal project). Status nyata per dokumen ini dibuat:

**Sudah ada & berfungsi:**

- **Design tokens** sudah terimplementasi sebagai CSS variables di `src/index.css` (`--color-primary: #0F766E`, spacing 4px, radius, shadow, font `Plus Jakarta Sans`) — persis mengikuti DESIGN.md. **Jangan membuat sistem token baru.**
- **Komponen generik** di `src/components/`: `Button`, `Card`, `CategoryChip`, `Input`, `SearchInput`, `StatusBadge`, `EmptyState`, `Skeleton`, `Spinner`, `ErrorBoundary`, `Logo` + barrel `index.js`.
- **Layouts**: `PublicLayout.jsx`, `AdminLayout.jsx` (sudah berisi navbar/sidebar).
- **Guards**: `RequireAuth.jsx`, `RequireAdmin.jsx`; context `AuthContext.jsx` (login/logout + localStorage token).
- **16 halaman** sudah dibuat (lihat tabel inventaris §7).
- **Service layer** terpusat: `src/services/{auth,laporan,ruangPublik,stats}Service.js` dengan fallback mock di mode dev.
- **Peta**: `leaflet` + `react-leaflet` sudah terpasang → komponen `features/ruang-publik/components/PetaSebaranLokasi.jsx`.
- `lucide-react` (ikon) dan `swiper` (hero slider) sudah terpasang.

**Ketidaksesuaian yang sudah teridentifikasi (target perbaikan Fase 1–3):**

1. **`App.jsx` tidak memakai `route-config.js`.** `CONVENTIONS.md` §1.1 mewajibkan `route-config.js` sebagai satu-satunya sumber route, tetapi `App.jsx` mendefinisikan `<Routes>` manual. Dua sumber kebenaran route = bug jangka panjang.
2. **`route-config.js` menunjuk file yang tidak ada**: `features/data-master/pages/EditRuangPublikPage.jsx` dan `features/shared/pages/NotFoundPage.jsx` belum dibuat. Route `/tentang` juga belum ada di config padahal ada di `App.jsx`.
3. **`LoginPage.jsx` mem-hardcode `http://localhost:8000/...`** — melanggar `CONVENTIONS.md` §7 (wajib lewat `config/api.js` / `VITE_API_BASE_URL`). Registrasi & login juga menggabung dua panggilan di tempat, bukan lewat `authService.js`.
4. **`config/categories.js` masih mock** (`MOCK_CATEGORIES`) padahal endpoint `GET /api/v1/categories` sudah ada.
5. **Foto lapor terkirim**: `FormLaporPage` telah terhubung penuh ke `POST /api/v1/uploads` (FE-16, FE-17, BE-20, BE-49). Menggunakan input file asli, validasi tipe file (JPEG/PNG/WebP) dan ukuran berkas (<= 5MB), sequential upload multipart, serta pengambilan koordinat geolokasi browser saat submit. Foto terunggah tampil di Riwayat Laporan dan Detail Moderasi admin.
6. **"Laporan Saya" belum per-pengguna**: `getUserReports()` hanya meneruskan ke `getReports()` tanpa filter pemilik (butuh dukungan endpoint — ada di Fase 1a workflow backend).
7. **`config/constants.js` masih placeholder** (`export const CONSTANTS = {};`) — enum status belum dipusatkan (rekomendasi DESIGN.md §3.2.4).
8. **`EDIT DATA MASTER`**: `KelolaFasilitasPage` sudah terhubung ke `/api/v1/admin/facilities` (daftar, tambah, edit, hapus, impor CSV — BE-53). `DataMasterPage` masih baca-saja karena endpoint tulis ruang publik (`PATCH /public-spaces/{id}`) belum ada; tombol "Edit Master" dan "Impor Data Satu Data" masih `alert()` — pertahankan pesan yang jujur, jangan simulasi sukses palsu.
9. **404**: `App.jsx` me-redirect `*` ke `/home` — belum ada halaman NotFound.

---

## 5. Arah Produk & Aturan Desain (ringkas dari WORKFLOWFE.md — berlaku terus)

- **Nama platform selalu: `RuangTerbuka`.** Dilarang: Raku, Raku Jakarta, RuangWarga, RUKA, nama placeholder. Audit brand: grep frontend untuk nama lama sebelum selesai.
- **Platform adalah INFO RUANG PUBLIK, bukan sistem tiket.** Urutan prioritas: temukan ruang publik → info → kondisi fasilitas → (sekunder) lapor → pantau status. UI laporan **tidak boleh mendominasi** pengalaman warga; di sisi pemerintah, laporan memang lebih penting.
- **Peta = alat bantu temu-ruang, bukan produk utama.** Pada halaman info ruang publik, ikuti hierarki Figma (peta dominan bila desain begitu; gambar adalah konteks pendukung, jangan dibesarkan semaunya).
- **Tampilan:** modern, civic, clean, tepercaya, mudah diakses, orientasi informasi publik. Dilarang: estetika SaaS enterprise, dashboard dispatch, gradient/glassmorphism berlebihan, portal pemerintah generik, klon Google Maps.
- **Fitur terlarang (jangan dibuat):** SLA/countdown, penugasan teknisi/regu, kode aset, lencana identitas terverifikasi, presisi koordinat/GPS accuracy, bukti perbaikan, dispatch/ticket queue, rating, review, favorit, notifikasi, chat, gamification, statistik pengunjung, AI assistant. (Daftar lengkap: `docs/WORKFLOWFE.md` §31 & §45.)
- **12 layar utama jangan digabung** — tiap layar = route/view terpisah, boleh berbagi komponen.
- **Data yang ditampilkan harus ber alasan:** spesifikasi? ada di DESIGN.md? terlihat di Figma? perlu untuk alur pengguna? Kalau "tidak" keempatnya → jangan ditambahkan.

---

## 6. Konvensi Kode (wajib ikut `docs/CONVENTIONS.md`)

- **Setiap layar punya URL sendiri** — filter & state yang harus bertahan refresh → query string (`useSearchParams`), bukan `useState` "halaman aktif".
- **Route:** definisikan di `src/routes/route-config.js` (path lowercase-kebab, admin selalu prefix `/dashboard`, proteksi via flag `protected`/`role` → wrapper `RequireAuth`/`RequireAdmin`, jangan cek role di dalam halaman).
- **Struktur feature-first:** `src/features/<fitur>/{pages,components,hooks,services.js,index.js}`; komponen generik lintas-fitur baru di `src/components/`; barrel export wajib, import lintas-fitur lewat barrel.
- **API:** semua panggilan HTTP lewat `services.js` + `src/config/api.js`. **Tidak ada `fetch()` langsung di komponen/halaman** (pelanggaran saat ini: `LoginPage.jsx` — target dibersihkan di Fase 2).
- **Naming:** halaman akhiran `Page` (`HomePage.jsx`), komponen `PascalCase.jsx`, hook `use*.js`.
- **State:** data server → hook fitur; sesi login → `AuthContext` (satu-satunya global context); filter → URL; form belum submit → state lokal. Jangan tambah state library baru.
- **Env:** hanya `config/api.js`/`config/constants.js` yang boleh baca `import.meta.env` (`VITE_API_BASE_URL`, `VITE_OSRM_BASE_URL`, `VITE_DEFAULT_RADIUS_KM`, `VITE_FAKE_GPS_THRESHOLD_M`).
- **Token visual:** pakai CSS variables yang sudah ada di `index.css`; jangan nilai Tailwind/inline arbitrer bila token mewakili keputusan yang sama. Spasi kelipatan 4px (4/8/12/16/24/32/48/64).

---

## 7. Inventaris Halaman (baseline — perbarui kolom Status saat mengerjakan)

Route diambil dari `App.jsx` (sumber yang benar saat ini; rekonsiliasi dengan `route-config.js` di Fase 1).

| # | Peran | Halaman | Route | File (sudah ada?) | Ref Figma | Status |
|---|---|---|---|---|---|---|
| 1 | Warga | Login/Register | `/login` | `features/auth/pages/LoginPage.jsx` ✓ | `Register*.png`, `Screen 01B*` | Ada — perbaiki hardcode URL (F2) |
| 2 | Warga | Beranda | `/home` | `features/ruang-publik/pages/HomePage.jsx` ✓ | `Screen 01a/02` | Ada — verifikasi visual (F4) |
| 3 | Warga | Daftar Ruang Publik | `/ruang-publik` | `features/ruang-publik/pages/DaftarRuangPublikPage.jsx` ✓ | `Screen 03` | Ada — verifikasi visual (F4) |
| 4 | Warga | Detail Ruang Publik | `/ruang-publik/:id` | `features/ruang-publik/pages/DetailRuangPublikPage.jsx` ✓ | `Screen 04` | Ada — verifikasi visual (F4) |
| 5 | Warga | Detail Fasilitas | bagian dari detail (lihat catatan F4) | — | `Screen 05` | **Belum ada route/view sendiri** — konfirmasi dulu apakah dipisah; jangan digabung diam-diam |
| 6 | Warga | Form Pelaporan | `/ruang-publik/:id/lapor` | `features/laporan/pages/FormLaporPage.jsx` ✓ | `Screen 06`, `06B` | Ada (foto asli, validasi klien, geolokasi jalan, FE-16/17, BE-20/49 selesai) |
| 7 | Warga | Detail Status Laporan | `/laporan-saya/:id` | `features/laporan/pages/DetailStatusLaporanPage.jsx` ✓ | `Screen 07` | Ada — verifikasi visual (F4) |
| 8 | Warga | Laporan Saya | `/laporan-saya` | `features/laporan/pages/RiwayatLaporanPage.jsx` ✓ | `Screen 08` | Ada — filter per-user menyusul (F3) |
| 9 | Pemerintah | Login Pemerintah | `/login-pemerintah` | `features/auth/pages/LoginPemerintahPage.jsx` ✓ | `Screen 09` | Ada — verifikasi visual (F4) |
| 10 | Pemerintah | Dashboard | `/dashboard` | `features/moderasi/pages/DashboardPage.jsx` ✓ | `Screen 10` | Ada — verifikasi visual (F4) |
| 11 | Pemerintah | Daftar Laporan | `/dashboard/moderasi` | `features/moderasi/pages/AntrianModerasiPage.jsx` ✓ | `Screen 11` | Ada — verifikasi visual (F4) |
| 12 | Pemerintah | Detail Laporan | `/dashboard/moderasi/:laporanId` | `features/moderasi/pages/DetailModerasiPage.jsx` ✓ | `Screen 12` | Ada — verifikasi visual (F4) |
| — | Warga | Tentang | `/tentang` | `features/tentang/pages/TentangPage.jsx` ✓ | — | Ada di App.jsx, belum di route-config |
| — | Admin | Data Master | `/dashboard/data-master` | `features/data-master/pages/DataMasterPage.jsx` ✓ | sidebar Screen 10-12 | Read-only (butuh BE Fase 3) |
| — | Admin | Kelola Fasilitas | `/dashboard/fasilitas` | `features/data-master/pages/KelolaFasilitasPage.jsx` ✓ | sidebar | Terhubung API (BE-53): daftar + Tambah/Edit/Hapus + impor CSV |
| — | Admin | Petugas Lapangan | `/dashboard/petugas` | `features/moderasi/pages/PetugasLapanganPage.jsx` ✓ | sidebar | Ada |
| — | Admin | Kelola Admin | `/dashboard/kelola-admin` | `features/moderasi/pages/KelolaAdminPage.jsx` ✓ | sidebar | Ada |
| — | — | 404 | `*` | **belum ada** (`features/shared/pages/NotFoundPage.jsx`) | — | Buat di F1 |

Halaman `Detail Fasilitas` (layar 5): di `DESIGN.md` dipetakan ke `/ruang-publik/:id` bersama Screen 04/05. Sebelum mengimplementasi, putuskan eksplisit apakah jadi sub-view halaman detail atau route terpisah, dan **catat keputusannya** — jangan digabung atau dipisah diam-diam.

---

## 8. Fase Implementasi (urut; setiap fase punya gerbang)

### FASE 0 — Audit Singkat (sekali di awal sesi)
Baca: `package.json`, `index.css` (token), `App.jsx`, `route-config.js`, `layouts/*`, `config/api.js`, tabel §4 di atas.
**Gerbang:** daftar pekerjaan Fase 1–5 dikonfirmasi tidak bertabrakan dengan kode terbaru.

### FASE 1 — Rekonsiliasi Routing & Fondasi
- Jadikan **satu sumber route**: pindahkan deklarasi route `App.jsx` ke `route-config.js` (lengkapi `/tentang`, flag `protected`/`role`), lalu `App.jsx` hanya me-render config (pola yang diminta `CONVENTIONS.md` §1.1). Jangan buat arsitektur routing kedua.
- Buat `features/shared/pages/NotFoundPage.jsx` (route `*` → halaman 404 yang benar, bukan redirect diam-diam) dan `features/data-master/pages/EditRuangPublikPage.jsx` **atau** hapus entri config-nya bila memang tidak jadi dibuat — jangan biarkan pointer ke file tak-ada.
- Pastikan `RequireAuth`/`RequireAdmin` tetap jalan untuk semua route `protected`.
**Gerbang:** seluruh route di §7 terbuka tanpa error; refresh/back/forward aman; guard mengarahkan ke `/login?redirect=...`.

### FASE 2 — Lapisan API Rapi & Data Nyata
- Pindahkan semua `fetch` hardcode `LoginPage.jsx` ke `services/authService.js` + `config/api.js` (registrasi, login, `getMe`).
- Hubungkan `config/categories.js` ke `GET /api/v1/categories` (dengan fallback mock bila backend mati, ikuti pola service yang ada).
- Isi `config/constants.js`: enum status laporan (rekomendasi DESIGN.md §3.2.4) — satu sumber untuk `StatusBadge`, filter, dan timeline.
- Rapikan fallback mock: pastikan setiap service memakai pola `IS_DEV` yang sama; jangan pilih-pilih.
**Gerbang:** tidak ada URL hardcode di `features/**` (grep `localhost:8000` hanya boleh ada di `config/`); kategori datang dari API saat backend hidup; `npm run build` sukses.

### FASE 3 — Alur Laporan End-to-End (butuh backend, koordinasi lintas workflow)
- **Form lapor**: Selesai dihubungkan ke `POST /api/v1/uploads` dan `POST /api/v1/reports` (FE-16, FE-17, BE-20, BE-49), upload berkas asli, validasi ukuran & format foto di klien, pengambilan geolokasi browser, preservasi konteks ruang publik & fasilitas, dan mode identitas.
- **Laporan Saya**: setelah backend Fase 1a — panggil filter per-pengguna agar hanya laporan milik loginan yang tampil.
- **Detail status**: pastikan timeline membaca data backend (bukan mock) bila respons sudah tersedia.
**Gerbang:** alur klik lengkap teruji: beranda → daftar → detail → form lapor → status → laporan saya.

### FASE 4 — Verifikasi Visual Seluruh 12 Layar
Untuk **tiap** layar di §7: buka screenshot Figma → render halaman → bandingkan pakai checklist:
- [ ] Layout: lebar kontainer, posisi section, kolom, proporsi kartu/peta/gambar
- [ ] Tipografi: Plus Jakarta Sans, ukuran heading/body, weight, line-height
- [ ] Spasi: gap section, padding kartu, jarak elemen (kelipatan 4px)
- [ ] Warna: primary `#0F766E`, accent, badge status, teks, border
- [ ] Komponen: tombol, badge (ikon+teks+warna, bukan warna saja), input, tabel, timeline
- [ ] Konten: teks judul/label/CTA sesuai desain — **jangan mengubah konten demi tampilan "lebih enak"**
- Perhatian khusus pada halaman info ruang publik: jangan sampai jadi "berat gambar" padahal hierarki produk = informasi.
**Gerbang:** tidak ada layar yang hanya "kompilasi sukses" — semua sudah dibandingkan & diperbaiki.

### FASE 5 — Responsif, Aksesibilitas, QA Akhir
- **Responsif (desktop-first):** target utama desktop/laptop; di lebar kecil navbar boleh mengecil, peta+list menumpuk, kartu 1 kolom, tabel scroll horizontal, form tetap terpakai. Jangan redesain ke mobile-first.
- **Aksesibilitas:** kontras teks, ukuran font terbaca, fokus keyboard, label form, alt text, target klik; status tidak pernah hanya lewat warna (wajib ikon+teks).
- **QA akhir:**
  - [ ] `npm run build` dan `npm run dev` sukses; tidak ada error konsol/import rusak
  - [ ] Semua route §7 terbuka & navigasi antar-halaman utuh (uji klik-silang)
  - [ ] Grep audit fitur terlarang: `SLA`, `countdown`, `teknisi`, `regu`, `dispatch`, `asset code`, `GPS accuracy` → hapus bila tak wajib
  - [ ] Grep audit brand: `Raku`, `RuangWarga`, `RUKA` → hanya `RuangTerbuka` yang tampil
  - [ ] Token desain konsisten (tidak ada warna/jarak liar baru)
  - [ ] Experience warga tetap didominasi info ruang publik, bukan laporan

---

## 9. Aturan Komponen (Ringkas)

Sebelum membuat komponen baru: **"Apakah komponen existing sudah menyelesaikan ini?"** → ya: pakai; hampir sama: perluas; beda mendasar: buat baru. Golongan: generik (`src/components/`), publik (`PublicNavbar`, `KartuRuangPublik`, `PetaSebaranLokasi`), pemerintah (`AdminSidebar`, `StatisticCard`, `ReportTable`), spesifik fitur (`FormLapor`, timeline). Tujuan: **reusable + simple + maintainable** — MVP mahasiswa, jangan over-abstract.

---

## 10. Dilarang (Banned)

- Mengubah `backend/**` atau menambah endpoint
- Menyebar mock object baru ke JSX (wajib terpusat di `src/data/mockData.js`)
- Context/state library baru tanpa kebutuhan nyata
- Mengganti arsitektur feature-first / routing / auth yang sudah ada karena "dianggap lebih rapi"
- Menambah peta/ikon/library ganda (Leaflet sudah cukup, satu implementasi peta)
- Mengarang fitur (rating, review, favorit, notifikasi, SLA, teknisi — lihat §5)
- Menyatakan halaman selesai tanpa membandingkan ke screenshot Figma

---

## 11. Checklist Penyelesaian Frontend

- [ ] Route jadi satu sumber (`route-config.js`), guards bekerja, 404 ada
- [ ] Tidak ada `fetch`/URL hardcode di luar `config/` + `services/`
- [ ] Kategori & data real dari API (mock hanya fallback dev)
- [x] Alur laporan terhubung backend (foto upload via POST /uploads, koordinat geolokasi, integrasi FormLaporPage)
- [ ] 12 layar + `/tentang` terbuka, tidak ada error konsol, `npm run build` sukses
- [ ] Semua layar sudah dibandingkan dengan screenshot Figma & diperbaiki
- [ ] Responsif + aksesibilitas dasar lolos
- [ ] Audit fitur terlarang & audit brand lolos
- [ ] Nama produk hanya `RuangTerbuka`
- [ ] Tidak ada file `backend/` yang berubah
