/**
 * Centralized Mock Data & Constants for RuangTerbuka DKI Jakarta
 * Dipisahkan dari komponen UI untuk memudahkan transisi ke FastAPI Backend.
 */

// Import Hero Images
import heroImg1 from '../slidderHero/1.jpg';
import heroImg2 from '../slidderHero/2.png';
import heroImg3 from '../slidderHero/3.jpg';
import heroImg4 from '../slidderHero/4.jpg';

export const HERO_SLIDES = [
  {
    image: heroImg1,
    title: 'Taman Suropati',
    location: 'Menteng, Jakarta Pusat'
  },
  {
    image: heroImg2,
    title: 'Tebet Eco Park',
    location: 'Tebet, Jakarta Selatan'
  },
  {
    image: heroImg3,
    title: 'Hutan Kota GBK',
    location: 'Senayan, Jakarta Pusat'
  },
  {
    image: heroImg4,
    title: 'Taman Lapangan Banteng',
    location: 'Sawah Besar, Jakarta Pusat'
  }
];

export const MOCK_STATISTICS = {
  totalRuangPublik: null,
  totalLaporanSelesai: null,
  totalKecamatan: null,
  pemantauanLayanan: null
};

export const MOCK_RUANG_PUBLIK_METRICS = {
  totalTerdata: null,
  statusPrima: null,
  perluPerhatian: null
};

export const MOCK_DASHBOARD_STATS = {
  totalLaporan: 148,
  menungguVerifikasi: 12,
  dalamPenanganan: 24,
  selesai: 112
};

export const MOCK_MODERASI_STATS = {
  perluTindakan: 3,
  selesaiPekanIni: 14
};

export const MOCK_CATEGORIES = [
  { id: 'semua', label: 'Semua Kategori', iconName: 'LayoutGrid' },
  { id: 'taman-lingkungan', label: 'Taman Lingkungan', iconName: 'Trees' },
  { id: 'rptra', label: 'RPTRA', iconName: 'Footprints' },
  { id: 'taman-interaktif', label: 'Taman Interaktif', iconName: 'Dumbbell' },
  { id: 'taman-kota', label: 'Taman Kota', iconName: 'Leaf' }
];

export const MOCK_WILAYAH = [
  'Semua Wilayah',
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara'
];

export const MOCK_RUANG_PUBLIK = [];

export const MOCK_LAPORAN = [
  {
    id: 'LAP-2026-001',
    ruangPublikId: 'taman-suropati',
    ruangPublikNama: 'Taman Suropati',
    fasilitasId: 'penerangan-suropati',
    fasilitasNama: 'Lampu Taman Jalur Selatan',
    wilayah: 'Jakarta Pusat',
    jenisMasalah: 'Lampu Mati / Penerangan',
    deskripsi: 'Dua lampu tiang di jalur pedestrian sisi selatan mati sejak kemarin malam, membuat area pejalan kaki gelap saat berolahraga malam.',
    modeIdentitas: 'anonim',
    namaPelapor: 'Warga Anonim',
    tanggal: '8 Sep 2026',
    status: 'dalam_penanganan',
    statusLabel: 'Dalam Penanganan',
    foto: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    timeline: [
      { status: 'DILAPORKAN', title: 'Laporan Diterima', date: '8 Sep 2026 • 08:30 WIB', desc: 'Laporan dikirimkan oleh warga mengenai lampu tiang mati di area publik.' },
      { status: 'DIVERIFIKASI', title: 'Diverifikasi Pengelola', date: '8 Sep 2026 • 11:15 WIB', desc: 'Laporan telah diperiksa dan dikonfirmasi oleh pengelola ruang publik.' },
      { status: 'DALAM_PENANGANAN', title: 'Dalam Penanganan Lapangan', date: '9 Sep 2026 • 09:00 WIB', desc: 'Petugas pemeliharaan taman sedang melakukan pergantian bohlam & kabel.' },
      { status: 'SELESAI', title: 'Selesai (Tahap Akhir)', date: '11 Sep 2026', desc: 'Fasilitas akan diperbaiki & berfungsi kembali normal.' }
    ]
  },
  {
    id: 'LAP-2026-002',
    ruangPublikId: 'rth-kalijodo',
    ruangPublikNama: 'RTH Kalijodo',
    fasilitasId: 'musholla-kalijodo',
    fasilitasNama: 'Papan Informasi Taman Edukasi',
    wilayah: 'Jakarta Barat',
    jenisMasalah: 'Kerusakan Fasilitas Umum',
    deskripsi: 'Papan petunjuk peta kawasan terkena coretan vandalisme cat semprot.',
    modeIdentitas: 'tampilkan_nama',
    namaPelapor: 'Budi Santoso',
    tanggal: '28 Agu 2026',
    status: 'selesai',
    statusLabel: 'Selesai',
    foto: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    timeline: [
      { status: 'DILAPORKAN', title: 'Laporan Diterima', date: '28 Agu 2026', desc: 'Laporan vandalisme dikirimkan warga.' },
      { status: 'DIVERIFIKASI', title: 'Terverifikasi', date: '29 Agu 2026', desc: 'Pengelola mengonfirmasi laporan.' },
      { status: 'SELESAI', title: 'Selesai Ditangani', date: '31 Agu 2026', desc: 'Coretan telah dicat ulang dan bersih kembali.' }
    ]
  },
  {
    id: 'LAP-2026-003',
    ruangPublikId: 'tebet-eco-park',
    ruangPublikNama: 'Tebet Eco Park',
    fasilitasId: 'toilet-tebet',
    fasilitasNama: 'Kran Wastafel Area Gazebo',
    wilayah: 'Jakarta Selatan',
    jenisMasalah: 'Sanitasi / Kebersihan',
    deskripsi: 'Kran air pada wastafel samping gazebo bocor halus sehingga air terus menetes.',
    modeIdentitas: 'anonim',
    namaPelapor: 'Warga Anonim',
    tanggal: '9 Sep 2026',
    status: 'menunggu_verifikasi',
    statusLabel: 'Menunggu Verifikasi',
    foto: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
    timeline: [
      { status: 'DILAPORKAN', title: 'Menunggu Verifikasi', date: '9 Sep 2026 • 10:15 WIB', desc: 'Laporan baru dikirimkan dan masuk ke antrian peninjauan pengelola.' }
    ]
  }
];

export const MOCK_PETUGAS = [
  { id: 1, nama: 'Petugas 01 - Taman Suropati', anggota: 4, wilayah: 'Jakarta Pusat', status: 'Aktif di Lapangan', tugas: 'Perbaikan Lampu Jalur Selatan' },
  { id: 2, nama: 'Petugas 02 - Tebet Eco Park', anggota: 3, wilayah: 'Jakarta Selatan', status: 'Standby Pos', tugas: 'Pemeliharaan Wastafel' },
  { id: 3, nama: 'Petugas 03 - Kalijodo', anggota: 5, wilayah: 'Jakarta Barat', status: 'Inspeksi Rutin', tugas: 'Pembersihan Vandalisme' }
];

export default {
  HERO_SLIDES,
  MOCK_STATISTICS,
  MOCK_RUANG_PUBLIK_METRICS,
  MOCK_DASHBOARD_STATS,
  MOCK_MODERASI_STATS,
  MOCK_CATEGORIES,
  MOCK_WILAYAH,
  MOCK_RUANG_PUBLIK,
  MOCK_LAPORAN,
  MOCK_PETUGAS
};
