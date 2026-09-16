import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, RotateCcw, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { MOCK_RUANG_PUBLIK, MOCK_WILAYAH, MOCK_CATEGORIES } from '../../../config/mockData';
import { Button, SearchInput, Card, CardBody, StatusBadge, CategoryChip, EmptyState } from '../../../components';

export const DaftarRuangPublikPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('kategori') || 'semua';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedWilayah, setSelectedWilayah] = useState('Semua Wilayah');
  const [selectedKategori, setSelectedKategori] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('relevan');

  // Filter Logic
  const filteredList = MOCK_RUANG_PUBLIK.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWilayah = selectedWilayah === 'Semua Wilayah' || item.wilayah === selectedWilayah;
    const matchKategori =
      selectedKategori === 'semua' ||
      item.kategori.toLowerCase().replace(/ /g, '-').includes(selectedKategori);
    return matchSearch && matchWilayah && matchKategori;
  });

  const handleReset = () => {
    setSearchTerm('');
    setSelectedWilayah('Semua Wilayah');
    setSelectedKategori('semua');
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* HEADER SECTION */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
          marginBottom: 'var(--space-2xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-xl)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <span className="text-caption" style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} /> EKSPLORASI KOTA HIJAU • PEMBARUAN FASILITAS TERKINI
          </span>
          <h1 className="text-display" style={{ marginTop: '4px', marginBottom: '8px' }}>
            Ruang Publik di Jakarta
          </h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Temukan taman kota, ruang terbuka hijau, dan gelanggang olahraga di seluruh lima wilayah administrasi Jakarta lengkap dengan transparansi kondisi fasilitas.
          </p>
        </div>

        {/* Metric Summary Counter Box */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-xl)',
            backgroundColor: 'var(--color-bg-main)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-lg) var(--space-xl)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700 }}>TOTAL TERDATA</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>142</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)', textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-success)' }}>STATUS PRIMA</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>92%</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)', textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-warning)' }}>PERHATIAN</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-warning)' }}>8%</div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama ruang publik, jalan, atau fasilitas..."
            />
          </div>
          <select
            className="form-select"
            value={selectedWilayah}
            onChange={(e) => setSelectedWilayah(e.target.value)}
            style={{ width: '180px' }}
          >
            {MOCK_WILAYAH.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={14} /> Reset Filter
          </Button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="text-caption" style={{ fontWeight: 700, marginRight: '4px' }}>KATEGORI:</span>
          {MOCK_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isActive={selectedKategori === cat.id}
              onClick={() => setSelectedKategori(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* MAP VIEW CONTAINER (Visual Interactive Map View) */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', backgroundColor: 'var(--color-bg-main)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-small" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="#0F766E" /> Peta Sebaran Lokasi (3 Titik Terdekat Dalam Filter)
          </span>
          <span className="badge badge-info">Pin Terverifikasi Pemprov</span>
        </div>
        <div style={{ position: 'relative', height: '320px', backgroundColor: '#e5e3df', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
          {/* Mock Interactive Map Pins */}
          <div style={{ position: 'absolute', top: '35%', left: '42%', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/ruang-publik/taman-suropati')}>
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="#FFFFFF" /> Taman Suropati
            </div>
          </div>
          <div style={{ position: 'absolute', top: '55%', left: '55%', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/ruang-publik/tebet-eco-park')}>
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="#FFFFFF" /> Tebet Eco Park
            </div>
          </div>
          <div style={{ position: 'absolute', top: '25%', left: '25%', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/ruang-publik/rth-kalijodo')}>
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="#FFFFFF" /> RTH Kalijodo
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600 }}>
            Zona Populer: <span style={{ color: 'var(--color-primary)' }}>Menteng • Kebayoran • Tebet</span>
          </div>
        </div>
      </div>

      {/* LIST CONTENT SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h3 className="h3">Menampilkan {filteredList.length} Ruang Publik</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>Urutkan:</span>
          <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: '160px', padding: '6px 12px' }}>
            <option value="relevan">Paling Relevan</option>
            <option value="terdekat">Jarak Terdekat</option>
            <option value="kondisi">Kondisi Terbaik</option>
          </select>
        </div>
      </div>

      {/* Cards Horizontal / Grid List */}
      {filteredList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {filteredList.map((item) => (
            <Card key={item.id} hoverable>
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '180px' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img src={item.image} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="badge badge-info" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    {item.kategori}
                  </span>
                </div>

                <CardBody style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="h3" style={{ marginBottom: '2px' }}>{item.nama}</h3>
                        <p className="text-caption" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color="var(--color-text-muted)" /> {item.alamat} • <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{item.wilayah}</span>
                        </p>
                      </div>
                      <StatusBadge status="baik" customLabel="Terverifikasi" />
                    </div>

                    {/* Facility Summary Pills */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                      <span className="badge badge-success">{item.stats.baik} Baik</span>
                      <span className="badge badge-warning">{item.stats.perluPerhatian} Perlu Perhatian</span>
                      <span className="badge badge-danger">{item.stats.rusak} Rusak</span>
                    </div>

                    {/* Facilities Tag List */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                      {item.fasilitas.map((f) => (
                        <span key={f.id} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-main)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                          {f.nama}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                    <span className="text-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color="var(--color-text-muted)" /> Jam Operasional: <strong>{item.jamOperasional}</strong>
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/ruang-publik/${item.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Lihat Detail Ruang <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Ruang Publik Tidak Ditemukan"
          description="Coba ubah kata kunci pencarian atau reset filter kategori & wilayah Anda."
          actionLabel="Reset Pencarian"
          onAction={handleReset}
        />
      )}
    </div>
  );
};

export default DaftarRuangPublikPage;
