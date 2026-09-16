// src/routes/route-config.js
// Daftar rute lengkap sesuai spesifikasi CONVENTIONS.md dan DESIGN.md

export const routes = [
  // ---- PUBLIK ----
  { path: "/", redirectTo: "/home" },
  { path: "/home", component: "features/ruang-publik/pages/HomePage", layout: "public" },
  { path: "/ruang-publik", component: "features/ruang-publik/pages/DaftarRuangPublikPage", layout: "public" },
  { path: "/ruang-publik/:id", component: "features/ruang-publik/pages/DetailRuangPublikPage", layout: "public" },
  { path: "/ruang-publik/:id/lapor", component: "features/laporan/pages/FormLaporPage", layout: "public" },
  { path: "/laporan-saya", component: "features/laporan/pages/RiwayatLaporanPage", layout: "public", protected: true },
  { path: "/laporan-saya/:id", component: "features/laporan/pages/DetailStatusLaporanPage", layout: "public", protected: true },
  { path: "/login", component: "features/auth/pages/LoginPage", layout: "public" },
  { path: "/login-pemerintah", component: "features/auth/pages/LoginPemerintahPage", layout: "public" },

  // ---- ADMIN (path prefix /dashboard) ----
  { path: "/dashboard", component: "features/moderasi/pages/DashboardPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/moderasi", component: "features/moderasi/pages/AntrianModerasiPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/moderasi/:laporanId", component: "features/moderasi/pages/DetailModerasiPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/data-master", component: "features/data-master/pages/DataMasterPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/data-master/:ruangPublikId", component: "features/data-master/pages/EditRuangPublikPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/fasilitas", component: "features/data-master/pages/KelolaFasilitasPage", layout: "admin", protected: true, role: "admin" },
  { path: "/dashboard/petugas", component: "features/moderasi/pages/PetugasLapanganPage", layout: "admin", protected: true, role: "admin" },

  // ---- FALLBACK ----
  { path: "*", component: "features/shared/pages/NotFoundPage", layout: "public" }
];
