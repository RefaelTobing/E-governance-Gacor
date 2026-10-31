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
  10,
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
//
// Aturan warna (minimal exception): warna hanya menandai pengecualian, bukan
// setiap baris. Yang berwarna tinggal `menunggu_verifikasi` (biru, menunggu
// tindakan petugas) dan `ditolak` (merah, gagal). `diverifikasi`,
// `dalam_penanganan`, dan `selesai` dibiarkan netral supaya mata langsung
// tertuju ke yang butuh perhatian.
export const STATUS_LAPORAN = {
  MENUNGGU_VERIFIKASI: { key: 'menunggu_verifikasi', label: 'Menunggu Verifikasi', badgeType: 'info' },
  DIVERIFIKASI: { key: 'diverifikasi', label: 'Diverifikasi', badgeType: 'neutral' },
  DALAM_PENANGANAN: { key: 'dalam_penanganan', label: 'Dalam Penanganan', badgeType: 'neutral' },
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

// Label status per `key`, untuk teks bantu di luar stepper (mis. status `ditolak`).
export const LABEL_STATUS_LAPORAN = Object.fromEntries(
  Object.values(STATUS_LAPORAN).map((s) => [s.key, s.label])
);

// Transisi status yang diizinkan backend (BE-51/BE-29/BE-30) - cermin dari
// TRANSISI_IZIN di backend/app/schemas/laporan.py. Dipakai UI hanya untuk
// mengaktifkan/mematikan tombol tindakan; backend tetap penjaga terakhir
// (422 untuk transisi terlarang, 409 untuk approve/reject yang bentrok).
export const TRANSISI_STATUS_LAPORAN = {
  menunggu_verifikasi: ['menunggu_verifikasi', 'diverifikasi', 'dalam_penanganan', 'selesai', 'ditolak'],
  diverifikasi: ['diverifikasi', 'dalam_penanganan', 'selesai', 'ditolak'],
  dalam_penanganan: ['dalam_penanganan', 'selesai', 'ditolak'],
  selesai: ['selesai', 'ditolak'],
  ditolak: ['ditolak', 'diverifikasi'],
};

// Boleh tidaknya sebuah status tujuan diambil dari status sekarang.
export const bolehTransisiStatus = (statusSekarang, statusTujuan) =>
  (TRANSISI_STATUS_LAPORAN[statusSekarang] ?? []).includes(statusTujuan);

// Penjaga endpoint approve/reject (BE-29/BE-30) BERBEDA dari tabel transisi PATCH:
// approve hanya dari `menunggu_verifikasi`/`ditolak` (tinjau ulang), dan reject
// menolak laporan yang sudah `ditolak` dengan 409. Sifat idempotent "status sama"
// di tabel PATCH tidak berlaku di kedua endpoint ini.
export const bolehSetujuiLaporan = (status) =>
  status === 'menunggu_verifikasi' || status === 'ditolak';

export const bolehTolakLaporan = (status) => status !== 'ditolak';

// Penanda "sesi berakhir" pada query string halaman login (FE-65). Dipakai
// interceptor 401 di config/api.js: setelah sesi dibersihkan, pengguna diarahkan
// ke halaman login dengan `?sesi=berakhir` dan halaman menampilkan pesan ini.
export const PARAM_SESI = 'sesi';
export const NILAI_SESI_BERAKHIR = 'berakhir';
export const PESAN_SESI_BERAKHIR = 'Sesi Anda telah berakhir. Silakan masuk kembali.';
