// src/routes/route-config.js
// SATU-SATUNYA sumber kebenaran daftar rute (CONVENTIONS.md §1.1).
// App.jsx hanya me-render array ini — jangan menulis <Route> manual di luar file ini.
//
// Field:
// - path        : path URL (lowercase, kebab-case)
// - component   : path modul halaman relatif terhadap src/, TANPA ekstensi .jsx
// - layout      : "public" | "akun" | "admin"
// - protected   : true -> dibungkus RequireAuth (wajib login)
// - role        : "admin" -> dibungkus RequireAdmin (khusus admin/dinas)
// - redirectTo  : route tanpa komponen, hanya mengalihkan ke path lain

export const routes = [
  // ---- REDIRECT ----
  { path: "/", redirectTo: "/home" },

  // ---- PUBLIK ----
  { path: "/home", component: "features/ruang-publik/pages/HomePage", layout: "public" },
  { path: "/ruang-publik", component: "features/ruang-publik/pages/DaftarRuangPublikPage", layout: "public" },
  { path: "/ruang-publik/:id", component: "features/ruang-publik/pages/DetailRuangPublikPage", layout: "public", protected: true },
  { path: "/ruang-publik/:id/lapor", component: "features/laporan/pages/FormLaporPage", layout: "public" },
  { path: "/laporan-saya", component: "features/laporan/pages/RiwayatLaporanPage", layout: "public", protected: true },
  { path: "/laporan-saya/:id", component: "features/laporan/pages/DetailStatusLaporanPage", layout: "public", protected: true },
  { path: "/tentang", component: "features/tentang/pages/TentangPage", layout: "public" },
  { path: "/login", component: "features/auth/pages/LoginPage", layout: "public" },
  { path: "/login-pemerintah", component: "features/auth/pages/LoginPemerintahPage", layout: "public" },

  // ---- AKUN WARGA (path prefix /profil) ----
  { path: "/profil", component: "features/profil/pages/ProfilDashboardPage", layout: "akun", protected: true },
  { path: "/profil/laporan", component: "features/laporan/pages/RiwayatLaporanPage", layout: "akun", protected: true },
  { path: "/profil/tersimpan", component: "features/profil/pages/RuangTersimpanPage", layout: "akun", protected: true },
  { path: "/profil/edit", component: "features/profil/pages/EditProfilPage", layout: "akun", protected: true },
  { path: "/profil/tema", component: "features/profil/pages/PengaturanTemaPage", layout: "akun", protected: true },
  { path: "/profil/keamanan", component: "features/profil/pages/KeamananPage", layout: "akun", protected: true },
  { path: "/profil/bantuan", component: "features/profil/pages/BantuanPage", layout: "akun", protected: true },

  // ---- ADMIN (path prefix /dashboard) ----
  { path: "/dashboard", component: "features/moderasi/pages/DashboardPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/moderasi", component: "features/moderasi/pages/AntrianModerasiPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/moderasi/:laporanId", component: "features/moderasi/pages/DetailModerasiPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/laporan-terflag", component: "features/moderasi/pages/LaporanTerflagPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/data-master", component: "features/data-master/pages/DataMasterPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/fasilitas", component: "features/data-master/pages/KelolaFasilitasPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/fasilitas/:ruangPublikId", component: "features/data-master/pages/DetailFasilitasRuangPublikPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/petugas", component: "features/moderasi/pages/PetugasLapanganPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/kelola-admin", component: "features/moderasi/pages/KelolaAdminPage", layout: "admin", protected: true, role: "admin" },

  // ---- FALLBACK 404 ----
  { path: "*", component: "features/shared/pages/NotFoundPage", layout: "public" }
];
