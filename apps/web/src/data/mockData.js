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

export const TESTIMONIALS = [
  {
    id: 1,
    quote: "Aplikasi ini sangat membantu! Saya bisa laporkan kerusakan lampu taman dengan mudah dan transparan. Dalam 3 hari sudah diperbaiki!",
    name: "Budi Santoso",
    role: "Warga Jakarta Pusat",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 2,
    quote: "Fitur peta presisi sangat akurat untuk lokasi fasilitas rusak. Petugas langsung tahu lokasi persis tanpa perlu mencari-cari.",
    name: "Siti Nurhaliza",
    role: "Pengguna Aktif",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 3,
    quote: "Saya suka bisa lapor secara anonim. Tidak perlu ribet daftar akun, langsung bisa kirim laporan fasilitas rusak di taman dekat rumah.",
    name: "Ahmad Wijaya",
    role: "Relawan Lingkungan",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 4,
    quote: "Transparansi pengelolaan ruang publik meningkat drastis. Kita bisa pantau kondisi fasilitas real-time sebelum pergi ke taman.",
    name: "Dewi Lestari",
    role: "Ibu Rumah Tangga",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 5,
    quote: "Platform ini memudahkan warga untuk berpartisipasi menjaga fasilitas umum. Pelaporan cepat dan prosesnya jelas!",
    name: "Eko Prasetyo",
    role: "Pegawai Swasta",
    rating: 4,
    emoji: "🇮🇩"
  },
  {
    id: 6,
    quote: "Sebagai petugas lapangan, aplikasi ini sangat membantu koordinasi perbaikan. Laporan warga langsung masuk ke sistem kami.",
    name: "Joko Susilo",
    role: "Petugas Dinas Pertamanan",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 7,
    quote: "Fitur foto bukti sangat berguna. Teknisi bisa persiapkan alat yang tepat sebelum ke lokasi berdasarkan foto kerusakan.",
    name: "Rina Kusuma",
    role: "Warga Jakarta Selatan",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 8,
    quote: "Saya apresiasi bisa tracking status laporan. Tidak seperti dulu yang lapor tapi tidak tahu ditindaklanjuti atau tidak.",
    name: "Agus Setiawan",
    role: "Komunitas Taman",
    rating: 4,
    emoji: "🇮🇩"
  },
  {
    id: 9,
    quote: "Interface-nya simpel dan mudah dipahami. Bahkan orang tua saya yang gaptek bisa pakai untuk lapor bangku rusak di RPTRA.",
    name: "Maya Sari",
    role: "Mahasiswa",
    rating: 5,
    emoji: "🇮🇩"
  },
  {
    id: 10,
    quote: "Response time dari petugas sangat cepat. Laporan saya diverifikasi dalam 1x24 jam dan perbaikan selesai dalam seminggu!",
    name: "Fahmi Rahman",
    role: "Warga Jakarta Timur",
    rating: 5,
    emoji: "🇮🇩"
  }
];

export const MOCK_CATEGORIES = [
  { id: 'semua', label: 'Semua Kategori', iconName: 'LayoutGrid' },
  { id: 'taman', label: 'Taman', iconName: 'Trees' },
  { id: 'jalur-hijau', label: 'Jalur Hijau', iconName: 'Route' },
  { id: 'hutan', label: 'Hutan', iconName: 'TreePine' },
  { id: 'kebun-bibit', label: 'Kebun Bibit', iconName: 'Sprout' },
  { id: 'taman-margasatwa', label: 'Taman Margasatwa', iconName: 'PawPrint' }
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
    pembaruanTerakhir: 'Pengecekan unit lampu dan perbaikan perkabelan bawah tanah oleh tim teknis.',
    tanggalPembaruan: '9 Sep 2026, 09:00 WIB',
    foto: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    timeline: [
      { status: 'DILAPORKAN', title: 'Laporan Diterima', date: '8 Sep 2026 • 08:30 WIB', desc: 'Laporan dikirimkan oleh warga mengenai lampu tiang mati di area publik.' },
      { status: 'DIVERIFIKASI', title: 'Diverifikasi Pengelola', date: '8 Sep 2026 • 11:15 WIB', desc: 'Laporan telah diperiksa dan dikonfirmasi oleh pengelola ruang publik.' },
      { status: 'DALAM_PENANGANAN', title: 'Dalam Penanganan Lapangan', date: '9 Sep 2026 • 09:00 WIB', desc: 'Petugas teknis pemeliharaan taman sedang melakukan pergantian bohlam & kabel.' },
      { status: 'SELESAI', title: 'Selesai (Tahap Akhir)', date: 'Estimasi 1-2 Hari', desc: 'Fasilitas akan diperbaiki & berfungsi kembali normal.' }
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
    pembaruanTerakhir: 'Papan informasi telah dibersihkan & diperbaiki secara tuntas oleh tim kebersihan.',
    tanggalPembaruan: '31 Agu 2026',
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
    pembaruanTerakhir: 'Menunggu peninjauan pengelola taman setempat.',
    tanggalPembaruan: 'Hari ini, 10:15 WIB',
    foto: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
    timeline: [
      { status: 'DILAPORKAN', title: 'Menunggu Verifikasi', date: '9 Sep 2026 • 10:15 WIB', desc: 'Laporan baru dikirimkan dan masuk ke antrian peninjauan pengelola.' }
    ]
  }
];

export const MOCK_PETUGAS = [
  { id: 1, nama: 'Regu 01 - Taman Suropati', anggota: 4, wilayah: 'Jakarta Pusat', status: 'Aktif di Lapangan', tugas: 'Perbaikan Lampu Jalur Selatan' },
  { id: 2, nama: 'Regu 02 - Tebet Eco Park', anggota: 3, wilayah: 'Jakarta Selatan', status: 'Standby Pos', tugas: 'Pemeliharaan Wastafel' },
  { id: 3, nama: 'Regu 03 - Kalijodo', anggota: 5, wilayah: 'Jakarta Barat', status: 'Inspeksi Rutin', tugas: 'Pembersihan Vandalisme' }
];

export default {
  HERO_SLIDES,
  MOCK_STATISTICS,
  MOCK_RUANG_PUBLIK_METRICS,
  MOCK_DASHBOARD_STATS,
  MOCK_MODERASI_STATS,
  TESTIMONIALS,
  MOCK_CATEGORIES,
  MOCK_WILAYAH,
  MOCK_RUANG_PUBLIK,
  MOCK_LAPORAN,
  MOCK_PETUGAS
};
