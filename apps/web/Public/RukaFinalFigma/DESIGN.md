# DESIGN.md — Spesifikasi Sistem Desain & Pemetaan Komponen UI

Dokumen ini merupakan panduan komprehensif sistem desain (*Design System*), pemetaan komponen UI (*Component Mapping*), serta evaluasi kesesuaian antara spesifikasi struktur aplikasi (`docs/Structure.md`, `docs/PRD.md`, `docs/CONVENTIONS.md`) dengan rancangan visual antarmuka di `Public/web/RukaFinalFigma`.

---

## 1. Overview Design System

Sistem desain ini dirancang untuk memberikan pengalaman pengguna (*User Experience*) yang bersih, modern, terstruktur, serta mengutamakan keterbacaan data spasial dan laporan masyarakat DKI Jakarta.

### 1.1 Sistem Warna (Color Tokens)

Palet warna telah distandarisasi untuk mendukung aksesibilitas dan konsistensi visual identitas publik DKI Jakarta:

| Kategori Token | Nama Warna | Hex Code | Penggunaan Utama |
|---|---|---|---|
| **Primary** | Teal | `#0F766E` | Aksi utama, navigasi aktif, header, tombol utama |
| **Accent** | Amber | `#F59E0B` | Sorotan penting, penekanan visual, status proses |
| **Tertiary / Info** | Sky | `#0284C7` | Elemen informasi, edukasi, badge navigasi |
| **Success** | Green | `#10B981` | Fasilitas kondisi baik, laporan selesai |
| **Warning** | Yellow | `#EAB308` | Perlu perhatian, menunggu verifikasi |
| **Danger** | Red | `#EF4444` | Fasilitas rusak, laporan ditolak, tombol batal |
| **Text / Neutral** | Slate | `#0F172A` | Teks utama, judul section, border gelap |
| **Background** | Light Slate | `#F8FAFC` | Latar belakang halaman publik & admin |
| **Surface** | White | `#FFFFFF` | Latar belakang kartu, modal, & container |

### 1.2 Tipografi (Typography Tokens)

Seluruh antarmuka menggunakan font **Plus Jakarta Sans** untuk memberikan kejelasan informasi publik.

* **Display & Heading 1**: `32px` / Bold (`700`) — Judul utama halaman & hero section.
* **Heading 2**: `24px` / Bold (`700`) — Judul section & nama ruang publik.
* **Heading 3**: `20px` / Semibold (`600`) — Sub-judul section & nama fasilitas.
* **Body Regular**: `16px` / Regular (`400`) — Teks deskripsi utama, paragraf.
* **Body Small**: `14px` / Regular (`400`) — Teks bantuan, subtitle kartu, label form.
* **Caption**: `12px` / Regular (`400`) — Format file, timestamp, info sekunder.

### 1.3 Sistem Jarak (Spacing Tokens)

Sistem jarak berbasis kelipatan **4px** untuk konsistensi layout mikro dan makro:

* `xs` (`4px`): Gap internal antarikon/badge.
* `sm` (`8px`): Padding internal input form, margin elemen kecil.
* `md` (`12px`): Gap antar tag status, padding kartu kecil.
* `lg` (`16px`): Padding kartu standar, gap antar baris form.
* `xl` (`24px`): Margin antar section kecil, padding container.
* `xxl` (`32px`): Padding modal, margin antar section utama.
* `3xl` (`48px`): Gap hero section.
* `4xl` (`64px`): Padding vertikal utama halaman.

### 1.4 Sudut Kelengkungan (Border Radius Tokens)

* **Small (`4px`)**: Dipakai pada Badge status kecil, Checkbox, Tooltip.
* **Medium (`8px`)**: Dipakai pada Tombol, Input Form, Dropdown Popover.
* **Large (`12px`)**: Dipakai pada Kartu Fasilitas, Dialog Kecil.
* **Extra Large (`16px`)**: Dipakai pada Kartu Ruang Publik, Banner CTA, Container Modal.
* **Full / Pill (`9999px`)**: Dipakai pada Tag Status, Tombol Oval Navigasi.

### 1.5 Komponen Tokens (Component Tokens)

#### 1. Tombol (Buttons)
* **Primary**: Background `#0F766E`, Teks Putih, Radius `8px`.
* **Secondary**: Background `#F59E0B`, Teks Putih, Radius `8px`.
* **Outline**: Border `#0F172A`, Background Transparan, Teks Slate `#0F172A`.
* **Ghost**: Background Transparan, Teks Teal `#0F766E`.
* **Danger**: Background `#EF4444`, Teks Putih, Radius `8px`.

#### 2. Elemen Formulir (Form Elements)
* **Search Input**: Input pencarian dengan ikon kaca pembesar, background `#F8FAFC`, border `#E2E8F0`, radius `8px`.
* **Text Input & Textarea**: Padding `12px 16px`, border halus, focus state dengan outline Teal.
* **File Upload Dropzone**: Area unggah foto dengan garis putus-putus (*dashed border*), ikon kamera/upload, petunjuk batas `5MB`.

#### 3. Badges Status
* **Status Kondisi Fasilitas**:
  * **Baik**: Background hijau muda, Teks & Titik `#10B981`.
  * **Perlu Perhatian**: Background kuning muda, Teks & Titik `#EAB308`.
  * **Rusak**: Background merah muda, Teks & Titik `#EF4444`.
* **Status Penanganan Laporan**:
  * **Dilaporkan / Menunggu Verifikasi**: Badge Biru (`#0284C7`).
  * **Diverifikasi**: Badge Ungu/Biru Laut.
  * **Dalam Penanganan**: Badge Oranye (`#F59E0B`).
  * **Selesai**: Badge Hijau (`#10B981`).
  * **Ditolak**: Badge Merah (`#EF4444`).

---

## 2. Pemetaan Komponen (Component Mapping)

Tabel berikut memetakan hirarki file/komponen React pada spesifikasi `docs/Structure.md` dan `docs/CONVENTIONS.md` dengan rancangan layar visual Figma di `Public/web/RukaFinalFigma`:

| Modul / Route (`CONVENTIONS.md`) | Komponen React (`src/features/...`) | Desain UI Figma (`Public/web/RukaFinalFigma`) | Elemen UI Kunci pada Desain Figma |
|---|---|---|---|
| **Public Shell Layout** | `src/layouts/PublicLayout.jsx` | All Public Screens (Header & Footer) | Header (Logo RuangTerbuka, Menu Nav: Beranda, Ruang Publik, Laporan Saya, Tentang, Auth Button), Footer (Instansi, Layanan Publik, Copyright) |
| **Admin Shell Layout** | `src/layouts/AdminLayout.jsx` | Screens 10, 11, 12 | Sidebar Admin (Dashboard, Daftar Laporan, Kelola Fasilitas, Petugas Lapangan), Topbar Profile Badge |
| `/home` | `features/ruang-publik/pages/HomePage.jsx` | `Screen 01a — Beranda Awal.png`<br>`Screen 02 — Beranda Awal.png` | Hero Banner + Search Bar, Filter Tag Kategori, Grid "Ruang Publik Pilihan", Widget "Cek Kondisi Fasilitas", Category Explorer |
| `/ruang-publik` (List/Peta) | `features/ruang-publik/pages/HomePage.jsx` (atau List View) | `Screen 03 - Daftar Ruang Publik.png` | Summary Metric Bar (Total Terdata, Status Prima, Perhatian), Peta Sebaran Interaktif (Leaflet/Mapbox), Panel Filter Kategori & Wilayah, Card List Ruang Publik |
| `/ruang-publik/:id` | `features/ruang-publik/pages/DetailPage.jsx` | `Screen 04 — Detail Ruang Publik.png`<br>`Screen 05 — Detail Fasilitas.png` | Breadcrumb, Box Peta Akses & Rute (Button Petunjuk Arah), Box Jam & Aksesibilitas, Grid Kondisi Fasilitas Publik (Filter Baik/Rusak), Pembaruan Partisipasi Warga, CTA Lapor |
| `/ruang-publik/:id/lapor` | `features/laporan/pages/FormLaporPage.jsx` | `Screen 06 — Form Pelaporan.png`<br>`Screen 06B — Ambil Foto Fasilitas (Kamera Mobile).png` | Header Lokasi/Fasilitas Terpilih, Dropdown Jenis Masalah, Textarea Deskripsi, Box Upload Foto/Kamera, Widget Peta Presisi Koordinat, Button Submit |
| `/laporan-saya` | `features/laporan/pages/RiwayatLaporanPage.jsx` | `Screen 08 — Laporan Saya.png` | Badge Counter Laporan Aktif, Tab Status (Semua, Dalam Penanganan, Selesai, Menunggu Verifikasi), Card Riwayat Laporan + Timestamp Update |
| `/laporan-saya/:id` | `features/laporan/pages/DetailStatusLaporanPage.jsx` (opsional) | `Screen 07 — Detail Status Laporan.png` | Stepper Progress Status Laporan, Detail Ringkasan Fasilitas & Kendala, Box Bukti Foto & Titik Akurasi GPS, Button Navigasi |
| `/login` | `features/auth/pages/LoginPage.jsx` | `Screen 09 — Login Pemerintah.png`<br>`Register.png` | Container Card Auth, Header Logo Instansi, Form Email & Password, Button Submit "Masuk ke Dashboard" |
| `/dashboard` | `features/moderasi/pages/DashboardPage.jsx` | `Screen 10 — Dashboard Pemerintah.png` | Summary Metric Cards (Total Laporan, Menunggu Verifikasi, Dalam Penanganan, Selesai), Peta Sebaran Laporan Aktif, Chart Ringkasan Kategori, Tabel Monitoring Laporan Terkini |
| `/dashboard/moderasi` | `features/moderasi/pages/AntrianModerasiPage.jsx` | `Screen 11 — Daftar Laporan.png` | Filter Status & Wilayah, Metric Counter (Perlu Tindakan, Selesai Pekan Ini), Data Table Laporan Fasilitas + Button Aksi (Verifikasi / Periksa / Riwayat) |
| `/dashboard/moderasi/:laporanId` | `features/moderasi/pages/DetailModerasiPage.jsx` | `Screen 12 — Detail Laporan Pemerintah.png` | Stepper Alur Status Penanganan, Panel Rincian Laporan Warga & Foto Bukti, Form Action Petugas (Update Status & Catatan), Timeline Audit Log Pembaruan |

---

## 3. Catatan Evaluasi & Rekomendasi Perbaikan UI

Berdasarkan hasil pembandingan intensif antara dokumen arsitektur data/layout (`docs/Structure.md`, `docs/PRD.md`, `docs/CONVENTIONS.md`) dengan rancangan antarmuka visual Figma (`Public/web/RukaFinalFigma`), ditemukan beberapa poin ketidaksesuaian (*mismatch*) beserta rekomendasi perbaikannya:

### 3.1 Identifikasi Ketidaksesuaian (Mismatch)

1. **Konsistensi Branding & Naming Platform**:
   * **Dokumen Teknis**: Menggunakan nama **"Raku Jakarta (Ruang Terbuka Jakarta)"** dengan nama repositori `raku-jakarta`.
   * **Visual Figma**: Konsisten menampilkan nama **"RuangTerbuka"** atau **"RuangTerbuka DKI Jakarta"**.
   * **Dampak**: Berpotensi menimbulkan kebingungan bagi tim pengembang maupun pengguna publik.

2. **Form Pelaporan — Mode Identitas (PRD FEAT-009)**:
   * **Dokumen Teknis**: PRD FEAT-009 menetapkan bahwa formulir pelaporan wajib menyediakan pilihan **Mode Identitas (Anonim vs. Tampilkan Nama)**.
   * **Visual Figma (`Screen 06`)**: Pilihan *Mode Identitas* ini **belum tersedia/tidak tampak** di formulir pelaporan visual. Layar hanya menampilkan jenis masalah, deskripsi, upload foto, dan titik peta.

3. **Cakupan Menu Navigasi Admin Sidebar**:
   * **Dokumen Teknis (`CONVENTIONS.md`)**: Menentukan path admin terbatas pada `/dashboard`, `/dashboard/moderasi`, dan `/dashboard/data-master`.
   * **Visual Figma (`Screen 10`, `11`, `12`)**: Sidebar Admin memuat menu tambahan: **"Kelola Fasilitas"** dan **"Petugas Lapangan"**.

4. **Kesesuaian Nomenklatur Status Laporan**:
   * **Design System Token (`DesignSistem.jpeg`)**: Menguraikan status penanganan laporan menjadi 5: *Dilaporkan*, *Diverifikasi*, *Dalam Penanganan*, *Selesai*, *Ditolak*.
   * **Visual Layar Warga (`Screen 08`)**: Menggunakan tab filter: *Semua*, *Dalam Penanganan*, *Selesai*, *Menunggu Verifikasi* (istilah berbeda dengan status "Dilaporkan").

---

### 3.2 Rekomendasi Perbaikan UI & Arsitektur Kode

1. **Penyelarasan Branding Platform**:
   * Direkomendasikan menyelaraskan *branding* di dokumen PRD dan UI menjadi **"RuangTerbuka Jakarta"** (dengan subtitle *"Platform Pengelolaan Fasilitas Publik Jakarta"*).

2. **Penambahan Komponen Mode Identitas pada Form Lapor**:
   * Pada komponen `FormLapor.jsx` (`features/laporan/components/FormLapor.jsx`), wajib ditambahkan kontrol *Radio Button* / *Toggle Switch*:
     * `(•) Kirim sebagai Anonim (Direkomendasikan)`
     * `( ) Tampilkan Nama Akun Saya`

3. **Pembaruan Konfigurasi Route Admin (`route-config.js`)**:
   * Agar sesuai dengan desain visual Sidebar Admin pada Figma Screen 10-12, daftar route di `src/routes/route-config.js` perlu dilengkapi entri:
     ```javascript
     { path: "/dashboard/fasilitas", component: "features/data-master/pages/KelolaFasilitasPage", layout: "admin", protected: true, role: "admin" },
     { path: "/dashboard/petugas", component: "features/moderasi/pages/PetugasLapanganPage", layout: "admin", protected: true, role: "admin" }
     ```

4. **Standarisasi Constants Enum Status**:
   * Daftarkan enum status secara terpusat di `src/config/constants.js`:
     ```javascript
     export const REPORT_STATUS = {
       DILAPORKAN: { key: "MENUNGGU_VERIFIKASI", label: "Menunggu Verifikasi", color: "sky" },
       DIVERIFIKASI: { key: "DIVERIFIKASI", label: "Diverifikasi", color: "indigo" },
       DALAM_PENANGANAN: { key: "DALAM_PENANGANAN", label: "Dalam Penanganan", color: "amber" },
       SELESAI: { key: "SELESAI", label: "Selesai", color: "green" },
       DITOLAK: { key: "DITOLAK", label: "Ditolak", color: "red" }
     };
     ```

5. **Responsivitas & Mobile Adaptability**:
   * Komponen Peta Interaktif (`PetaInteraktif.jsx`) dan Data Table Admin harus mengimplementasikan layout fleksibel (CSS Grid/Flexbox) agar tetap responsif pada resolusi layar perangkat seluler (< `768px`).
