import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Gamepad2, Lightbulb, Droplets, Armchair, AlertCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

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

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

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

      {/* SECTION 1: RUANG PUBLIK PILIHAN */}
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

      {/* SECTION 2: CEK KONDISI FASILITAS SEBELUM BERKUNJUNG */}
      <section style={{ backgroundColor: 'var(--color-primary-light)', padding: 'var(--space-4xl) 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="h2" style={{ marginBottom: 'var(--space-xs)' }}>Cek Kondisi Fasilitas Sebelum Berkunjung</h2>
          <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3xl)', maxWidth: '600px', margin: '0 auto var(--space-3xl)' }}>
            Lihat kondisi fasilitas di ruang publik sebelum menentukan tujuanmu agar kegiatan bersantai atau berolahraga tetap nyaman.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
            <Card style={{ textAlign: 'left' }}>
              <CardBody>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Gamepad2 size={20} color="#0F766E" />
                </div>
                <h4 className="h3" style={{ fontSize: '16px', marginBottom: '6px' }}>Playground / Arena Bermain</h4>
                <p className="text-caption" style={{ marginBottom: '12px' }}>Ayunan, perosotan, dan lantai peredam benturan anak.</p>
                <StatusBadge status="baik" customLabel="Status umum: Kondisi Baik" />
              </CardBody>
            </Card>

            <Card style={{ textAlign: 'left' }}>
              <CardBody>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Lightbulb size={20} color="#0F766E" />
                </div>
                <h4 className="h3" style={{ fontSize: '16px', marginBottom: '6px' }}>Penerangan Jalur Taman</h4>
                <p className="text-caption" style={{ marginBottom: '12px' }}>Lampu pedestrian solar cell dan tiang penerangan utama.</p>
                <StatusBadge status="rusak" customLabel="Status umum: Sebagian Rusak" />
              </CardBody>
            </Card>

            <Card style={{ textAlign: 'left' }}>
              <CardBody>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Droplets size={20} color="#0F766E" />
                </div>
                <h4 className="h3" style={{ fontSize: '16px', marginBottom: '6px' }}>Fasilitas Sanitasi / Toilet</h4>
                <p className="text-caption" style={{ marginBottom: '12px' }}>Kebersihan toilet umum, kran air, dan wastafel cuci tangan.</p>
                <StatusBadge status="baik" customLabel="Status umum: Kondisi Baik" />
              </CardBody>
            </Card>

            <Card style={{ textAlign: 'left' }}>
              <CardBody>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Armchair size={20} color="#0F766E" />
                </div>
                <h4 className="h3" style={{ fontSize: '16px', marginBottom: '6px' }}>Bangku & Meja Santai</h4>
                <p className="text-caption" style={{ marginBottom: '12px' }}>Kenyamanan bangku taman kayu dan gazebo kanopi warga.</p>
                <StatusBadge status="perlu_perhatian" customLabel="Status umum: Perlu Perhatian" />
              </CardBody>
            </Card>
          </div>
        </div>
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
