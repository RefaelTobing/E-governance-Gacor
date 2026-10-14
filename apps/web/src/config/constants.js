// Konstan umum + gerbang tunggal environment variable (FE-05).
//
// Sesuai docs/CONVENTIONS.md §7: HANYA file ini (dan config/api.js) yang boleh
// membaca `import.meta.env` langsung. Komponen/service/hook lain wajib import
// dari sini agar nilai default & validasi seragam.

const bacaString = (nilai, fallback) => {
  const bersih = typeof nilai === 'string' ? nilai.trim() : '';
  return bersih || fallback;
};

const bacaAngka = (nilai, fallback, namaVar) => {
  const angka = Number(nilai);
  if (nilai === undefined || nilai === '' || !Number.isFinite(angka)) {
    if (import.meta.env.DEV && nilai !== undefined && nilai !== '') {
      console.warn(`[config] ${namaVar}="${nilai}" tidak valid, memakai default ${fallback}.`);
    }
    return fallback;
  }
  return angka;
};

// Base URL backend FastAPI (tanpa suffix /api/v1; path endpoint sudah memuatnya).
export const API_BASE_URL = bacaString(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8000');

// Endpoint instance publik OSRM untuk rute perjalanan (FE-15).
// Domain `.org` adalah instance demo resmi; `.net` tidak resolve di sebagian
// jaringan (terverifikasi 2026-10-09). Bisa dioverride via VITE_OSRM_BASE_URL.
export const OSRM_BASE_URL = bacaString(
  import.meta.env.VITE_OSRM_BASE_URL,
  'https://router.project-osrm.org'
);

// Radius pencarian default slider (km) pada halaman daftar ruang publik.
export const DEFAULT_RADIUS_KM = bacaAngka(
  import.meta.env.VITE_DEFAULT_RADIUS_KM,
  700,
  'VITE_DEFAULT_RADIUS_KM'
);

// Ambang validasi lokasi anti fake-GPS (meter) untuk teks bantuan UI.
// Perhitungan sebenarnya ada di backend (FAKE_GPS_THRESHOLD_M).
export const FAKE_GPS_THRESHOLD_M = bacaAngka(
  import.meta.env.VITE_FAKE_GPS_THRESHOLD_M,
  100,
  'VITE_FAKE_GPS_THRESHOLD_M'
);

// Mode development Vite (dipakai fallback mockData service).
export const IS_DEV = import.meta.env.DEV;

// Titik acuan penghitungan jarak ketika pengguna belum mengizinkan lokasi.
// Dipakai halaman daftar dan peta sebaran supaya keduanya memakai titik (dan
// angka jarak) yang sama.
export const JAKARTA_CENTER = { lat: -6.2088, lng: 106.8456 };

// Enum status laporan, satu sumber kanonik (DESIGN.md §4.4).
// `key` harus persis sama dengan nilai status dari backend (snake_case).
export const STATUS_LAPORAN = {
  MENUNGGU_VERIFIKASI: { key: 'menunggu_verifikasi', label: 'Menunggu Verifikasi', badgeType: 'info' },
  DIVERIFIKASI: { key: 'diverifikasi', label: 'Diverifikasi', badgeType: 'info' },
  DALAM_PENANGANAN: { key: 'dalam_penanganan', label: 'Dalam Penanganan', badgeType: 'warning' },
  SELESAI: { key: 'selesai', label: 'Selesai', badgeType: 'success' },
  DITOLAK: { key: 'ditolak', label: 'Ditolak', badgeType: 'danger' },
};

// Urutan tahap laporan untuk stepper/timeline progres.
export const URUTAN_STATUS_LAPORAN = [
  STATUS_LAPORAN.MENUNGGU_VERIFIKASI,
  STATUS_LAPORAN.DIVERIFIKASI,
  STATUS_LAPORAN.DALAM_PENANGANAN,
  STATUS_LAPORAN.SELESAI,
];
