import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ClipboardList,
  ShieldCheck,
  Search,
  ChevronDown,
  Mail,
  Phone,
  CheckCircle2,
  Gamepad2,
  Lightbulb,
  Droplets,
  Armchair,
  ArrowRight,
  Trees,
  Check,
  RotateCcw
} from 'lucide-react';
import { getHomeStatistics } from '../../../services/statsService';
import { getPublicSpacesStats } from '../../../services/ruangPublikService';

const STEPS = [
  {
    title: 'Eksplorasi Lokasi',
    body: 'Cari taman kota, RPTRA, RTH, atau lapangan olahraga di seluruh wilayah DKI Jakarta melalui direktori lengkap dengan foto dan alamat.',
    icon: MapPin,
    tint: 'primary'
  },
  {
    title: 'Pantau Fasilitas',
    body: 'Lihat status terkini setiap fasilitas: toilet, penerangan, playground, dan bangku taman sebelum berkunjung.',
    icon: Search,
    tint: 'accent'
  },
  {
    title: 'Laporkan Kerusakan',
    body: 'Temukan fasilitas yang rusak? Kirim laporan dengan foto dan deskripsi singkat. Laporan dapat dikirim anonim.',
    icon: ClipboardList,
    tint: 'info'
  },
  {
    title: 'Tindak Lanjut Petugas',
    body: 'Petugas Dinas Pertamanan atau RPTRA memverifikasi dan menindaklanjuti perbaikan secara akuntabel.',
    icon: ShieldCheck,
    tint: 'success'
  }
];

const FACILITIES = [
  {
    title: 'Arena Bermain',
    description: 'Ayunan, perosotan, dan lantai peredam benturan anak.',
    icon: Gamepad2,
    tint: 'primary'
  },
  {
    title: 'Penerangan Jalur',
    description: 'Lampu pedestrian solar cell dan tiang penerangan utama.',
    icon: Lightbulb,
    tint: 'accent'
  },
  {
    title: 'Sanitasi & Toilet',
    description: 'Kebersihan toilet umum, kran air, dan wastafel cuci tangan.',
    icon: Droplets,
    tint: 'info'
  },
  {
    title: 'Bangku Taman',
    description: 'Kenyamanan bangku taman kayu dan gazebo kanopi warga.',
    icon: Armchair,
    tint: 'success'
  }
];

const FAQ_ITEMS = [
  {
    q: 'Apakah saya harus daftar akun untuk melaporkan kerusakan fasilitas?',
    a: 'Tidak wajib. Laporan bisa dikirim sebagai anonim tanpa membuat akun. Namun jika Anda mendaftar, Anda dapat memantau status tindak lanjut laporan Anda secara langsung.'
  },
  {
    q: 'Berapa lama biasanya laporan saya ditindaklanjuti?',
    a: 'Setiap laporan akan diverifikasi oleh admin pengelola dalam 1 x 24 jam kerja. Penanganan fisik di lapangan bergantung pada jenis kerusakan dan unit pelaksana terkait.'
  },
  {
    q: 'Bagaimana saya tahu laporan saya sudah diproses?',
    a: 'Jika Anda memiliki akun, status laporan akan diperbarui secara otomatis di halaman "Laporan Saya". Anda bisa melihat apakah laporan sedang diverifikasi, dalam penanganan, atau sudah selesai.'
  },
  {
    q: 'Apakah platform ini resmi milik Pemprov DKI Jakarta?',
    a: 'RuangTerbuka adalah platform kolaboratif yang dibangun untuk mendukung keterbukaan informasi pengelolaan fasilitas publik DKI Jakarta dengan rujukan data resmi Dinas Pertamanan dan RPTRA.'
  }
];

const FaqItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="tentang-faq-item">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="tentang-faq-toggle"
      >
        <span className={`tentang-faq-question ${open ? 'is-open' : ''}`}>{item.q}</span>
        <ChevronDown
          size={18}
          color="var(--color-primary)"
          className={`tentang-faq-chevron ${open ? 'is-open' : ''}`}
        />
      </button>
      {open && (
        <p className="tentang-faq-answer">{item.a}</p>
      )}
    </div>
  );
};

export const TentangPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      setStatsError(false);

      // allSettled agar kegagalan satu endpoint tidak menggagalkan yang lain;
      // bagian yang sukses tetap ditampilkan, yang gagal jadi '-'.
      const [homeResult, metricsResult] = await Promise.allSettled([
        getHomeStatistics(),
        getPublicSpacesStats()
      ]);

      if (!isMounted) return;

      if (homeResult.status === 'fulfilled') setStats(homeResult.value);
      if (metricsResult.status === 'fulfilled') setMetrics(metricsResult.value);
      if (homeResult.status === 'rejected' || metricsResult.status === 'rejected') {
        setStatsError(true);
      }
      setIsLoadingStats(false);
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  // '...' saat memuat, '-' bila nilai tidak tersedia setelah selesai.
  const fmt = (value) => (isLoadingStats ? '...' : (value == null ? '-' : value));

  return (
    <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
      {/* 1. HERO SECTION */}
      <section className="tentang-hero">
        {/* Content Wrapper */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '760px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)',
            fontWeight: 800,
            color: 'var(--color-text-main)',
            lineHeight: 1.22,
            margin: '0 0 20px',
            letterSpacing: '-0.025em'
          }}>
            Platform <span style={{ color: 'var(--color-primary)' }}>Keterbukaan</span> Fasilitas Publik Jakarta
          </h1>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '52px' }}>
            <button
              type="button"
              onClick={() => navigate('/ruang-publik')}
              className="btn btn-primary"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '13px 26px',
                fontSize: '15px',
                fontWeight: 700
              }}
            >
              <MapPin size={17} />
              Jelajahi Ruang Publik
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('cara-kerja');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-outline"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '13px 26px',
                fontSize: '15px',
                fontWeight: 600
              }}
            >
              <ChevronDown size={17} />
              Cara Kerja Platform
            </button>
          </div>

          {/* Stat Row: pakai class shared stat-bar */}
          <div className="stat-panel" style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'left', padding: 'var(--space-lg) var(--space-xl)' }}>
            <div className="stat-bar" style={{ borderTop: 'none', paddingTop: 0 }}>
              {/* Stat 1 */}
              <div className="stat-cell">
                <Trees size={22} color="var(--color-primary)" style={{ marginBottom: 'var(--space-xs)' }} />
                <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                  {fmt(stats?.totalRuangPublik)}
                </div>
                <div className="stat-label">Ruang Publik</div>
              </div>

              {/* Stat 2 */}
              <div className="stat-cell">
                <CheckCircle2 size={22} color="var(--color-success)" style={{ marginBottom: 'var(--space-xs)' }} />
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>
                  {fmt(metrics?.statusPrima)}
                </div>
                <div className="stat-label">Kondisi Baik</div>
              </div>

              {/* Stat 3 */}
              <div className="stat-cell">
                <ClipboardList size={22} color="var(--color-accent)" style={{ marginBottom: 'var(--space-xs)' }} />
                <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
                  {fmt(stats?.laporanBulanIni)}
                </div>
                <div className="stat-label">Laporan Bulan Ini</div>
              </div>

              {/* Stat 4 */}
              <div className="stat-cell">
                <ShieldCheck size={22} color="var(--color-info)" style={{ marginBottom: 'var(--space-xs)' }} />
                <div className="stat-value" style={{ color: 'var(--color-info)' }}>
                  {isLoadingStats ? '...' : (stats?.tingkatPenyelesaianPersen != null ? `${stats.tingkatPenyelesaianPersen}%` : '-')}
                </div>
                <div className="stat-label">Penyelesaian</div>
              </div>
            </div>
          </div>

          {/* Banner: sebagian/total statistik gagal dimuat */}
          {statsError && (
            <div className="tentang-stat-error">
              <span>Sebagian statistik gagal dimuat.</span>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
              >
                <RotateCcw size={13} />
                Coba lagi
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. SEKSI: ALUR PARTISIPASI WARGA */}
      <section id="cara-kerja" className="tentang-steps-section">
        <div className="tentang-section-container">
          <div className="tentang-section-heading">
            <h2>Alur Partisipasi Warga</h2>
            <p>Dari menemukan fasilitas hingga melihat tindak lanjut laporan.</p>
          </div>

          <div className="tentang-steps-grid">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className={`tentang-step-card tentang-step-${step.tint}`}>
                  <Icon size={24} color={`var(--color-${step.tint})`} aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SEKSI: FASILITAS YANG DIPANTAU (SPLIT LAYOUT 2 KOLOM) */}
      <section className="tentang-facility-section">
        <div className="tentang-section-container">
          <div className="split-facility-grid">
            {/* Kolom Kiri: Header & Banner Visual Keterbukaan RTH */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="tentang-h2">
                Fasilitas yang Dipantau Secara Berkala
              </h2>
              {/* Banner Card RTH */}
              <div className="tentang-rth-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  <Trees size={18} color="var(--color-primary)" />
                  <span>Ruang Terbuka Hijau DKI Jakarta</span>
                </div>
                <div style={{ color: 'var(--color-text-main)', fontWeight: 800, fontSize: '18px', lineHeight: 1.4, marginBottom: '8px' }}>
                  Pengawasan Terpadu Bersama Dinas Pertamanan &amp; RPTRA
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
                  Setiap fasilitas di taman dan RPTRA tercatat secara digital demi percepatan respon perbaikan teknis lapangan.
                </p>
                <div className="tentang-facility-metrics">
                  <div>
                    <span className="tentang-facility-metric-value">{fmt(metrics?.statusPrima)}</span>
                    <span className="tentang-facility-metric-label">Fasilitas kondisi baik</span>
                  </div>
                  <div>
                    <span className="tentang-facility-metric-value">{fmt(metrics?.perluPerhatian)}</span>
                    <span className="tentang-facility-metric-label">Perlu perhatian</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Compact 2x2 Grid Fasilitas */}
            <div className="tentang-facility-grid">
              {FACILITIES.map((facility) => {
                const Icon = facility.icon;
                return (
                  <div key={facility.title} className="tentang-facility-card">
                    <div className={`tentang-facility-icon tentang-tint-${facility.tint}`}>
                      <Icon size={22} color={`var(--color-${facility.tint})`} aria-hidden="true" />
                    </div>

                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                      {facility.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {facility.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEKSI: FITUR UTAMA PLATFORM */}
      <section className="tentang-feature-section">
        <div className="tentang-section-container">
          <div className="tentang-section-heading">
            <h2>Fitur Utama Platform</h2>
            <p>Pilar utama dalam mewujudkan ekosistem pengelolaan ruang terbuka yang responsif dan transparan.</p>
          </div>

          <div className="tentang-feature-grid">
            {/* Kartu Unggulan: Direktori Ruang Publik */}
            <article className="tentang-feature-card tentang-feature-card-main">
              <div className="tentang-feature-icon">
                <MapPin size={26} color="var(--color-primary)" aria-hidden="true" />
              </div>

              <h3>Direktori Ruang Publik Jakarta</h3>

              <p>
                Jelajahi ratusan taman kota, RPTRA, hutan kota, dan lapangan olahraga di 5 wilayah kota administratif DKI Jakarta lengkap dengan titik presisi, foto kondisi, jam buka, dan fasilitas.
              </p>

              <ul className="tentang-feature-points">
                <li><Check size={14} color="var(--color-success)" aria-hidden="true" /> Data Koordinat Presisi</li>
                <li><Check size={14} color="var(--color-success)" aria-hidden="true" /> Galeri Foto Kondisi</li>
                <li><Check size={14} color="var(--color-success)" aria-hidden="true" /> Filter per Wilayah</li>
                <li><Check size={14} color="var(--color-success)" aria-hidden="true" /> Akses Cepat Laporan</li>
              </ul>

              <button
                type="button"
                onClick={() => navigate('/ruang-publik')}
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-lg)', width: 'fit-content' }}
              >
                <span>Buka Direktori Ruang Publik</span>
                <ArrowRight size={16} />
              </button>
            </article>

            {/* Kartu Pendukung: Status & Moderasi */}
            <article className="tentang-feature-card">
              <div className="tentang-feature-icon">
                <CheckCircle2 size={24} color="var(--color-primary)" aria-hidden="true" />
              </div>
              <h3>Status Kondisi Terbuka</h3>
              <p>
                Setiap fasilitas memiliki indikator kondisi terkini yang diperbarui secara transparan setelah penanganan oleh petugas lapangan.
              </p>
            </article>

            <article className="tentang-feature-card">
              <div className="tentang-feature-icon tentang-feature-icon-accent">
                <ShieldCheck size={24} color="var(--color-accent)" aria-hidden="true" />
              </div>
              <h3>Moderasi oleh Petugas Resmi</h3>
              <p>
                Setiap laporan diverifikasi oleh petugas Dinas Pertamanan atau RPTRA untuk memastikan keabsahan dan penanganan yang tepat sasaran.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 5. SEKSI: FAQ & HUBUNGI KAMI */}
      <section className="tentang-contact-section">
        <div className="tentang-section-container">
          <div className="faq-contact-grid">
            <div>
              <h2 className="tentang-h2 tentang-faq-heading">Yang Sering Ditanyakan Warga</h2>
              <div>
                {FAQ_ITEMS.map((item, i) => (
                  <FaqItem key={i} item={item} />
                ))}
              </div>
            </div>

            <div className="tentang-contact-card">
              <div className="tentang-contact-icon">
                <Mail size={22} color="var(--color-primary)" aria-hidden="true" />
              </div>

              <h3>Hubungi Kami</h3>
              <p>
                Untuk kendala teknis, pertanyaan pelaporan, atau informasi lebih lanjut mengenai pengelolaan fasilitas publik DKI Jakarta.
              </p>

              <div className="tentang-contact-list">
                <a href="mailto:pengaduan@jakarta.go.id" className="tentang-contact-link">
                  <span className="tentang-contact-link-icon">
                    <Mail size={20} color="var(--color-primary)" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="tentang-contact-label">Surel Pengaduan</span>
                    <span className="tentang-contact-value">pengaduan@jakarta.go.id</span>
                  </span>
                </a>

                <a href="tel:1500164" className="tentang-contact-link">
                  <span className="tentang-contact-link-icon tentang-contact-link-icon-accent">
                    <Phone size={20} color="var(--color-accent)" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="tentang-contact-label">Hotline Jakarta</span>
                    <span className="tentang-contact-value tentang-contact-value-main">1500-164</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TentangPage;
