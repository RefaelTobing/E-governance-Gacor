import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Gamepad2, Lightbulb, Droplets, Armchair, AlertCircle, ArrowUpRight } from 'lucide-react';
import { MOCK_RUANG_PUBLIK, MOCK_CATEGORIES } from '../../../config/mockData';
import { Button, SearchInput, Card, CardBody, StatusBadge, CategoryChip } from '../../../components';

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
      {/* HERO SECTION */}
      <section style={{ backgroundColor: 'var(--color-primary-light)', paddingTop: 'var(--space-4xl)', paddingBottom: 'var(--space-4xl)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <h1 className="text-display" style={{ color: 'var(--color-text-main)', marginBottom: 'var(--space-md)' }}>
            Pantau Kondisi Ruang Publik Jakarta
          </h1>
          <p className="text-body" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)' }}>
            Cari taman atau lapangan olahraga, lihat fasilitasnya, cek kondisinya, dan laporkan masalah jika diperlukan.
          </p>

          {/* Search Bar */}
          <div style={{ marginBottom: 'var(--space-xl)', maxWidth: '640px', margin: '0 auto var(--space-xl)' }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              placeholder="Cari taman, lapangan, atau wilayah di Jakarta..."
              buttonLabel="Temukan Ruang"
            />
          </div>

          {/* Quick Category Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
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
      </section>

      {/* SECTION 1: RUANG PUBLIK PILIHAN */}
      <section style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-2xl)' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: 'var(--space-xs)' }}>DIREKTORI TERKINI</span>
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

                <CardBody>
                  <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>{item.nama}</h3>
                  <p className="text-caption" style={{ marginBottom: 'var(--space-md)', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.deskripsi}
                  </p>

                  {/* Facility Condition Summary Box */}
                  <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                    <span className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                      Kondisi Fasilitas
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {item.fasilitas.slice(0, 4).map((fas) => (
                        <div key={fas.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{fas.nama}</span>
                          <StatusBadge status={fas.status} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="primary" fullWidth onClick={() => navigate(`/ruang-publik/${item.id}`)}>
                    Lihat Detail Ruang
                  </Button>
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

