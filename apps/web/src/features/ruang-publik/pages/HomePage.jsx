import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Gamepad2, Lightbulb, Droplets, Armchair, AlertCircle, ArrowUpRight, Sparkles, Trees, ClipboardCheck, Clock, Star, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Import Hero Images
import heroImg1 from '../../../slidderHero/1.jpg';
import heroImg2 from '../../../slidderHero/2.png';
import heroImg3 from '../../../slidderHero/3.jpg';
import heroImg4 from '../../../slidderHero/4.jpg';

import { MOCK_RUANG_PUBLIK, MOCK_CATEGORIES } from '../../../config/mockData';
import { Button, SearchInput, Card, CardBody, StatusBadge, CategoryChip } from '../../../components';

const HERO_SLIDES = [
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

const TESTIMONIALS = [
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

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const marqueeTrackRef = useRef(null);

  const [hoveredTestimonialId, setHoveredTestimonialId] = useState(null);

  const handleSearch = (query) => {
    if (query) {
      navigate(`/ruang-publik?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/ruang-publik');
    }
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    navigate(`/ruang-publik?kategori=${catId}`);
  };

  const handleMarqueeMouseEnter = () => {
    if (marqueeTrackRef.current) {
      marqueeTrackRef.current.style.animationPlayState = 'paused';
    }
  };

  const handleMarqueeMouseLeave = () => {
    if (marqueeTrackRef.current) {
      marqueeTrackRef.current.style.animationPlayState = 'running';
    }
  };

  const handleCardMouseEnter = (id) => {
    setHoveredTestimonialId(id);
  };

  const handleCardMouseLeave = () => {
    setHoveredTestimonialId(null);
  };

  const getCardTransform = (cardId) => {
    if (hoveredTestimonialId === null) return 'translateY(0) scale(1)';
    return cardId === hoveredTestimonialId ? 'translateY(-4px) scale(1.1)' : 'translateY(0) scale(1)';
  };

  const getCardOpacity = (cardId) => {
    return '1';
  };

  const getCardZIndex = (cardId) => {
    return hoveredTestimonialId === cardId ? '30' : '1';
  };

  const getCardShadow = (cardId) => {
    if (hoveredTestimonialId === cardId) return '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
    return '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  };

  const getCardBorder = (cardId) => {
    if (hoveredTestimonialId === cardId) return '1px solid rgba(20, 184, 166, 0.4)';
    return '1px solid var(--color-border)';
  };

  return (
    <div>
      {/* HERO SLIDER SECTION */}
      <section className="hero-slider-section" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#0F172A', minHeight: '620px' }}>
        {/* Background Swiper Carousel */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            loop={true}
            speed={900}
            grabCursor={true}
            pagination={{
              clickable: true,
              bulletClass: 'hero-dot',
              bulletActiveClass: 'hero-dot-active'
            }}
            style={{ width: '100%', height: '100%' }}
          >
            {HERO_SLIDES.map((slide, index) => (
              <SwiperSlide key={index} style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
                {/* Location indicator badge bottom right */}
                <div
                  className="hero-location-badge"
                  style={{
                    position: 'absolute',
                    bottom: '32px',
                    right: '32px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 2
                  }}
                >
                  <MapPin size={14} color="#2DD4BF" />
                  <span>{slide.title} • {slide.location}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Dark Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.60) 0%, rgba(15, 23, 42, 0.70) 50%, rgba(15, 23, 42, 0.88) 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />

        {/* Floating Content Layer */}
        <div
          className="container hero-content-wrapper"
          style={{
            position: 'relative',
            zIndex: 3,
            textAlign: 'center',
            maxWidth: '900px',
            paddingTop: '96px',
            paddingBottom: '104px',
            minHeight: '620px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <h1
            className="text-display hero-title"
            style={{
              color: '#FFFFFF',
              marginBottom: '20px',
              textShadow: '0 3px 16px rgba(0, 0, 0, 0.7)',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
              lineHeight: 1.2
            }}
          >
            <span style={{ color: '#10B981' }}>Pantau</span>{' '}
            <span style={{ color: '#F59E0B' }}>Kondisi</span>{' '}
            <span>Ruang Publik Jakarta</span>
          </h1>

          <p
            className="text-body hero-subtitle"
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '36px',
              maxWidth: '720px',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              lineHeight: 1.7,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
            }}
          >
            Cari taman atau lapangan olahraga, lihat fasilitasnya, cek kondisinya, dan laporkan masalah jika diperlukan.
          </p>

          {/* Search Bar with enhanced container */}
          <div
            className="hero-search-wrapper"
            style={{
              marginBottom: '36px',
              width: '100%',
              maxWidth: '680px',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              padding: '8px',
              borderRadius: 'var(--radius-xl, 16px)',
              boxShadow: '0 20px 35px -8px rgba(0, 0, 0, 0.35), 0 10px 15px -6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              placeholder="Cari taman, lapangan, atau wilayah di Jakarta..."
              buttonLabel="Temukan Ruang"
            />
          </div>

          {/* Quick Category Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {MOCK_CATEGORIES.slice(1).map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                isActive={activeCategory === cat.id}
                onClick={() => handleCategoryClick(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Custom Styling for Swiper Pagination Dots & Responsive Behavior */}
        <style>{`
          .hero-slider-section {
            min-height: 640px;
            height: 68vh;
            max-height: 760px;
          }
          .hero-content-wrapper {
            min-height: 640px;
            height: 68vh;
            max-height: 760px;
          }
          .hero-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.45);
            margin: 0 5px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hero-dot-active {
            background: #0F766E !important;
            width: 32px !important;
            box-shadow: 0 0 12px rgba(15, 118, 110, 0.9);
          }
          .hero-swiper .swiper-pagination,
          .swiper-pagination {
            bottom: 24px !important;
          }
          @media (max-width: 768px) {
            .hero-slider-section,
            .hero-content-wrapper {
              min-height: 520px;
              height: auto;
              padding-top: 64px !important;
              padding-bottom: 72px !important;
            }
            .hero-location-badge {
              display: none !important;
            }
          }
        `}</style>
      </section>

      {/* SECTION 1: STATISTIK RAKU JAKARTA */}
      <section style={{ padding: 'var(--space-4xl) 0', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-sm)' }}>Raku Jakarta dalam Angka</h2>
            <p className="text-body" style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Komitmen kami dalam membangun transparansi dan kepedulian warga terhadap ruang publik Jakarta.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2xl)' }}>
            {/* Stat 1: Ruang Publik */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }} className="stat-card">
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 118, 110, 0.08)',
                border: '2px solid rgba(15, 118, 110, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)',
                transition: 'all 0.3s ease'
              }}>
                <Trees size={48} color="#0F766E" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>150+</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Ruang Publik</div>
            </div>

            {/* Stat 2: Laporan Selesai */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }} className="stat-card">
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '2px solid rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)',
                transition: 'all 0.3s ease'
              }}>
                <ClipboardCheck size={48} color="#F59E0B" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>5,000+</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Laporan Selesai</div>
            </div>

            {/* Stat 3: Kecamatan */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }} className="stat-card">
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                border: '2px solid rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)',
                transition: 'all 0.3s ease'
              }}>
                <MapPin size={48} color="#22C55E" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>44</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Kecamatan</div>
            </div>

            {/* Stat 4: Pemantauan 24/7 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }} className="stat-card">
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '2px solid rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)',
                transition: 'all 0.3s ease'
              }}>
                <Clock size={48} color="#06B6D4" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>24/7</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Pemantauan</div>
            </div>
          </div>

          <style>{`
            .stat-card {
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .stat-card:hover {
              transform: translateY(-8px);
            }
            .stat-card:hover div:first-child {
              transform: scale(1.08);
              box-shadow: 0 8px 24px rgba(15, 118, 110, 0.15);
            }
          `}</style>
        </div>
      </section>

      {/* SECTION 2: RUANG PUBLIK PILIHAN */}
      <section style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-2xl)' }}>
            <div>
              <h2 className="h2">Ruang Publik Pilihan di Jakarta</h2>
              <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                Jelajahi ruang terbuka terpopuler dengan informasi fasilitas terkini.
              </p>
            </div>
            <Link to="/ruang-publik" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Lihat Semua Lokasi <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)' }}>
            {MOCK_RUANG_PUBLIK.map((item) => (
              <Card key={item.id} hoverable>
                <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                  <img
                    src={item.image}
                    alt={item.nama}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="badge badge-info" style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'var(--color-surface)' }}>
                    {item.kategori}
                  </span>
                  <span className="text-caption" style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', color: 'white', padding: '4px 10px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="#FFFFFF" /> {item.wilayah}
                  </span>
                </div>

                <CardBody style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>{item.nama}</h3>
                      <p className="text-caption" style={{ marginBottom: 'var(--space-md)', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.deskripsi}
                      </p>
                    </div>

                    {/* Facility Condition Summary Box */}
                    <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)' }}>
                      <span className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                        Kondisi Fasilitas
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {item.fasilitas.slice(0, 4).map((fas) => (
                          <div key={fas.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', minWidth: 0, gap: '6px' }}>
                            <span
                              title={fas.nama}
                              style={{
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '110px',
                                flex: 1,
                                minWidth: 0,
                                color: 'var(--color-text-main)'
                              }}
                            >
                              {fas.nama}
                            </span>
                            <StatusBadge status={fas.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <Button variant="secondary" fullWidth onClick={() => navigate(`/ruang-publik/${item.id}`)}>
                      Lihat Detail Ruang
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: TESTIMONI WARGA RUANGTERBUKA - CONTINUOUS MARQUEE */}
      <section style={{ padding: 'var(--space-4xl) 0', backgroundColor: '#FFFFFF', width: '100%', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
          <h2 className="h2" style={{ marginBottom: 'var(--space-sm)' }}>Testimoni Warga</h2>
          <p className="text-body" style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Dengarkan pengalaman mereka dalam menggunakan platform RuangTerbuka Jakarta untuk menjaga fasilitas kota.
          </p>
        </div>

        <div 
          className="testimonial-marquee-container" 
          onMouseEnter={handleMarqueeMouseEnter}
          onMouseLeave={handleMarqueeMouseLeave}
          style={{ overflow: 'hidden', width: '100%', position: 'relative', padding: '40px 16px' }}
        >
          <div 
            ref={marqueeTrackRef}
            className="testimonial-marquee-track" 
            style={{ display: 'flex', gap: '24px', animation: 'marquee 80s linear infinite', padding: '20px 0', width: 'max-content', alignItems: 'center' }}
          >
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
              <div
                key={`${t.id}-${idx}`}
                style={{
                  minWidth: '320px',
                  maxWidth: '320px',
                  position: 'relative',
                  transform: getCardTransform(t.id),
                  opacity: getCardOpacity(t.id),
                  zIndex: getCardZIndex(t.id),
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="testimonial-card-marquee"
                onMouseEnter={() => handleCardMouseEnter(t.id)}
                onMouseLeave={handleCardMouseLeave}
              >
                <Card 
                  className="card"
                  style={{ 
                    height: '100%', 
                    border: getCardBorder(t.id), 
                    boxShadow: getCardShadow(t.id), 
                    borderRadius: '16px', 
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} 
                >
                  <CardBody style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < t.rating ? "#F59E0B" : "none"} 
                          color={i < t.rating ? "#F59E0B" : "#CBD5E1"} 
                        />
                      ))}
                    </div>

                    <div style={{ flex: 1, marginBottom: '20px', position: 'relative' }}>
                      <Quote size={24} color="var(--color-primary)" style={{ opacity: 0.15, position: 'absolute', top: '-8px', left: '-8px' }} />
                      <p className="text-body" style={{ 
                        fontSize: '15px', 
                        fontStyle: 'italic', 
                        color: '#334155', 
                        lineHeight: 1.6,
                        position: 'relative',
                        zIndex: 1
                      }}>
                        "{t.quote}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{t.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.role}</div>
                      </div>
                      <span style={{ fontSize: '20px' }} title="Jakarta, Indonesia">{t.emoji}</span>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          .testimonial-marquee-container {
            cursor: grab;
          }
          
          .testimonial-marquee-container:hover {
            cursor: grabbing;
          }

          .testimonial-marquee-container:hover .testimonial-marquee-track {
            animation-play-state: paused;
          }

          .testimonial-card-marquee {
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </section>

      {/* SECTION 4: BANNER CTA MARI JAGA RUANG BERSAMA */}
      <section style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-3xl)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-xl)'
            }}
          >
            <div>
              <h2 className="h2" style={{ color: 'white', marginBottom: 'var(--space-xs)' }}>Mari Jaga Ruang Bersama</h2>
              <p className="text-body" style={{ opacity: 0.9 }}>
                Menemukan fasilitas yang rusak saat berkunjung? Laporkan masalah secara mudah untuk pemeliharaan fasilitas bersama.
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/ruang-publik/taman-suropati/lapor')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <AlertCircle size={20} /> Pelajari Cara Melapor
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
