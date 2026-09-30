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

export const MOCK_RUANG_PUBLIK = [
  {
    id: 'taman-suropati',
    nama: 'Taman Suropati',
    kategori: 'Taman Kota',
    wilayah: 'Jakarta Pusat',
    alamat: 'Jl. Taman Suropati, Menteng, Jakarta Pusat',
    koordinat: { lat: -6.1994, lng: 106.8326 },
    deskripsi: 'Ruang terbuka hijau asri bersejarah di jantung Jakarta Pusat yang difungsikan untuk rekreasi warga, interaksi seni, jogging, dan bersantai di bawah naungan pohon rindang.',
    jamOperasional: 'Buka 24 Jam',
    tiketMasuk: 'Gratis (Publik)',
    aksesDisabilitas: 'Tersedia Rampa & Guiding Block',
    ramahHewan: 'Ramah hewan peliharaan (wajib tali pengikat & melempar sampah)',
    verified: true,
    statusGeneral: 'Baik',
    image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    stats: { baik: 3, perluPerhatian: 1, rusak: 1 },
    fasilitas: [
      {
        id: 'playground-suropati',
        nama: 'Playground Anak',
        kategori: 'Arena Bermain',
        status: 'baik',
        lokasiSpesifik: 'Zona Bermain Utara',
        deskripsi: 'Ayunan, jungkat-jungkit, dan lantai peredam benturan anak dalam kondisi aman & bersih.'
      },
      {
        id: 'penerangan-suropati',
        nama: 'Penerangan Jalur Selatan',
        kategori: 'Penerangan',
        status: 'rusak',
        lokasiSpesifik: 'Sisi Jalur Pejalan Kaki Selatan',
        deskripsi: 'Lampu tiang pedestrian di jalur pejalan kaki sisi selatan mati. Diimbau berhati-hati saat malam.'
      },
      {
        id: 'toilet-suropati',
        nama: 'Toilet & Sanitasi',
        kategori: 'Sanitasi',
        status: 'baik',
        lokasiSpesifik: 'Dekat Pos Penjagaan',
        deskripsi: 'Air bersih mengalir lancar, bilik difabel berfungsi optimal, dan kebersihan lantai terjaga.'
      },
      {
        id: 'bangku-suropati',
        nama: 'Bangku Taman Kayu',
        kategori: 'Fasilitas Umum',
        status: 'perlu_perhatian',
        lokasiSpesifik: 'Keliling Lingkar Luar',
        deskripsi: 'Beberapa bilah kayu perlu perbaikan pernis dan pengencangan baut penyangga.'
      },
      {
        id: 'jogging-suropati',
        nama: 'Jalur Jogging & Refleksi',
        kategori: 'Olahraga',
        status: 'baik',
        lokasiSpesifik: 'Koridor Pepohonan Tengah',
        deskripsi: 'Batu refleksi bersih tanpa lumut licin dan permukaan paving rapi tanpa genangan air.'
      }
    ]
  },
  {
    id: 'tebet-eco-park',
    nama: 'Tebet Eco Park',
    kategori: 'Taman & RTH',
    wilayah: 'Jakarta Selatan',
    alamat: 'Jl. Tebet Barat Raya, Tebet, Jakarta Selatan',
    koordinat: { lat: -6.2372, lng: 106.8529 },
    deskripsi: 'Taman ekologi seluas 7 hektar yang menghubungkan dua taman kota lewat Jembatan Kanopi (Link Bridge) ikonik.',
    jamOperasional: '06.00 - 18.00 WIB',
    tiketMasuk: 'Gratis (Reservasi via JAKI)',
    aksesDisabilitas: 'Aksesibel Penuh',
    ramahHewan: 'Area Hewan Peliharaan Khusus',
    verified: true,
    statusGeneral: 'Sangat Baik',
    image: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=800&q=80',
    stats: { baik: 5, perluPerhatian: 0, rusak: 0 },
    fasilitas: [
      {
        id: 'jembatan-tebet',
        nama: 'Jembatan Kanopi (Link Bridge)',
        kategori: 'Infrastruktur',
        status: 'baik',
        lokasiSpesifik: 'Penghubung Utara-Selatan',
        deskripsi: 'Kondisi jembatan sangat kokoh, lampu hias menyala normal, dan pengaman terpasang baik.'
      },
      {
        id: 'playground-tebet',
        nama: 'Children Playground',
        kategori: 'Arena Bermain',
        status: 'baik',
        lokasiSpesifik: 'Zona Bermain Anak Tebet Barat',
        deskripsi: 'Wahana jaring pemanjat dan perosotan dalam kondisi mulus dan bersih.'
      },
      {
        id: 'toilet-tebet',
        nama: 'Toilet Utama Plaza',
        kategori: 'Sanitasi',
        status: 'baik',
        lokasiSpesifik: 'Plaza Utama Tebet',
        deskripsi: 'Kondisi sanitasi sangat bersih dengan petugas pembersih standby berkala.'
      }
    ]
  },
  {
    id: 'rth-kalijodo',
    nama: 'RTH & Skatepark Kalijodo',
    kategori: 'RTH & Olahraga',
    wilayah: 'Jakarta Barat',
    alamat: 'Jl. Bidara Raya, Pejagalan, Penjaringan, Jakarta Utara/Barat',
    koordinat: { lat: -6.1415, lng: 106.7865 },
    deskripsi: 'Kawasan ruang terbuka hijau seluas 1,4 hektar yang dilengkapi lintasan skatepark bertaraf internasional dan ruang terbuka warga.',
    jamOperasional: 'Buka 24 Jam',
    tiketMasuk: 'Gratis (Publik)',
    aksesDisabilitas: 'Tersedia Rampa',
    ramahHewan: 'Ramah Hewan Peliharaan',
    verified: true,
    statusGeneral: 'Baik',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    stats: { baik: 3, perluPerhatian: 1, rusak: 0 },
    fasilitas: [
      {
        id: 'skatepark-kalijodo',
        nama: 'Skatepark Arena',
        kategori: 'Olahraga',
        status: 'baik',
        lokasiSpesifik: 'Plaza Skatepark',
        deskripsi: 'Permukaan semen arena papan luncur dalam kondisi prima tanpa keretakan.'
      },
      {
        id: 'toilet-kalijodo',
        nama: 'Toilet Umum & Difabel',
        kategori: 'Sanitasi',
        status: 'baik',
        lokasiSpesifik: 'Samping Musholla',
        deskripsi: 'Fasilitas air bersih dan kran berfungsi dengan baik.'
      },
      {
        id: 'musholla-kalijodo',
        nama: 'Musholla Warga',
        kategori: 'Fasilitas Umum',
        status: 'perlu_perhatian',
        lokasiSpesifik: 'Sisi Timur Kalijodo',
        deskripsi: 'Mukena dan karpet perlu pembersihan rutin dari pengelola setempat.'
      }
    ]
  }
];

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
