import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, RotateCcw, MapPin, Clock, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';
import { MOCK_WILAYAH, MOCK_CATEGORIES, MOCK_RUANG_PUBLIK_METRICS } from '../../../data/mockData';
import { Button, SearchInput, Card, CardBody, StatusBadge, CategoryChip, EmptyState, Skeleton } from '../../../components';
import { getPublicSpaces, getPublicSpacesStats } from '../../../services/ruangPublikService';
import PetaSebaranLokasi from '../components/PetaSebaranLokasi';
import useGeolocation from '../../../hooks/useGeolocation';
import 'leaflet/dist/leaflet.css';

export const DaftarRuangPublikPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('kategori') || 'semua';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedWilayah, setSelectedWilayah] = useState('Semua Wilayah');
  const [selectedKategori, setSelectedKategori] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('relevan');

  // Dynamic States
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { location, error: geoError, isLoading: isGeoLoading, requestLocation } = useGeolocation();

  // Fetch Public Spaces & Metrics from FastAPI or dev mock fallback
  useEffect(() => {
    let isMounted = true;

    const fetchSpaces = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicSpaces({
          kategori: selectedKategori,
          wilayah: selectedWilayah,
          lat: location.lat,
          lng: location.lng
        });
        if (isMounted) {
          setSpaces(data);
        }
      } catch (err) {
        console.error('Error fetching public spaces:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSpaces();

    return () => {
      isMounted = false;
    };
  }, [selectedKategori, selectedWilayah, location.lat, location.lng]);

  const computedMetrics = React.useMemo(() => {
    let prima = 0;
    let perhatian = 0;
    
    spaces.forEach(s => {
      const rusak = s.stats?.rusak || 0;
      const perluPerhatian = s.stats?.perluPerhatian || 0;
      
      if (rusak > 0 || perluPerhatian > 0) {
        perhatian++;
      } else {
        prima++;
      }
    });
    
    return {
      totalTerdata: spaces.length,
      statusPrima: prima,
      perluPerhatian: perhatian
    };
  }, [spaces]);

  // Filter Logic over dynamic spaces state
  const filteredList = spaces.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'kondisi') {
      const scoreA = (a.stats?.baik || 0) - (a.stats?.rusak || 0);
      const scoreB = (b.stats?.baik || 0) - (b.stats?.rusak || 0);
      return scoreB - scoreA;
    }
    if (sortBy === 'terdekat') {
      if (a.jarak_km !== undefined && b.jarak_km !== undefined) {
        return a.jarak_km - b.jarak_km;
      }
    }
    return 0;
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
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {computedMetrics.totalTerdata}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)', textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-success)' }}>STATUS PRIMA</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
              {computedMetrics.statusPrima}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)', textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-warning)' }}>PERHATIAN</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-warning)' }}>
              {computedMetrics.perluPerhatian}
            </div>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={requestLocation}
            disabled={isGeoLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Navigation size={14} /> 
            {isGeoLoading ? 'Mencari Lokasi...' : 'Gunakan Lokasi Saya'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={14} /> Reset Filter
          </Button>
        </div>
        
        {geoError && (
          <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>
            {geoError}
          </div>
        )}

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
        <PetaSebaranLokasi
          selectedKategori={selectedKategori}
          selectedWilayah={selectedWilayah}
        />
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

      {/* Cards Horizontal / Grid List with Loading & Empty State */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {[1, 2, 3].map((n) => (
            <Card key={`skeleton-space-${n}`}>
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '180px' }}>
                <Skeleton height="100%" borderRadius="var(--radius-lg) 0 0 var(--radius-lg)" />
                <CardBody style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-lg)', gap: '12px' }}>
                  <div>
                    <Skeleton height="24px" width="50%" style={{ marginBottom: '8px' }} />
                    <Skeleton height="16px" width="70%" style={{ marginBottom: '16px' }} />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <Skeleton height="22px" width="60px" borderRadius="var(--radius-pill)" />
                      <Skeleton height="22px" width="90px" borderRadius="var(--radius-pill)" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                    <Skeleton height="16px" width="160px" />
                    <Skeleton height="32px" width="130px" borderRadius="var(--radius-md)" />
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {filteredList.map((item) => (
            <Card key={item.id} hoverable>
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '180px' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img src={item.image} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="badge badge-info" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    {typeof item.kategori === 'object' ? item.kategori?.label || 'Kategori' : item.kategori || item.kategori_id || 'Kategori'}
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
                        {item.jarak_km !== undefined && item.jarak_km !== null && (
                          <span className="badge badge-neutral" style={{ display: 'inline-block', marginBottom: '8px' }}>
                            {item.jarak_km.toFixed(2)} km dari Anda
                          </span>
                        )}
                      </div>
                      <StatusBadge status="baik" customLabel="Terverifikasi" />
                    </div>

                    {/* Facility Summary Pills */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                      <span className="badge badge-success">{item.stats?.baik || 0} Baik</span>
                      <span className="badge badge-warning">{item.stats?.perluPerhatian || 0} Perlu Perhatian</span>
                      <span className="badge badge-danger">{item.stats?.rusak || 0} Rusak</span>
                    </div>

                    {/* Facilities Tag List */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                      {item.fasilitas?.map((f) => (
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
