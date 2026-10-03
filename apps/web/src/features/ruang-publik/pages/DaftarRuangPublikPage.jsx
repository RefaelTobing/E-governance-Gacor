import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, RotateCcw, MapPin, Clock, ArrowRight, Navigation } from 'lucide-react';
import { MOCK_WILAYAH, MOCK_CATEGORIES } from '../../../data/mockData';
import { Button, SearchInput, Card, CardBody, StatusBadge, CategoryChip, EmptyState, Skeleton } from '../../../components';
import { getAllPublicSpaces, getPublicSpacesStats } from '../../../services/ruangPublikService';
import { JAKARTA_CENTER } from '../../../config/constants';
import { getCategories } from '../../../services/categoryService';
import PetaSebaranLokasi from '../components/PetaSebaranLokasi';
import useGeolocation from '../../../hooks/useGeolocation';
import 'leaflet/dist/leaflet.css';

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 3000, label: '3 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
];
const RADIUS_BAWAAN = 5000;
const PER_HALAMAN = 12;

export const DaftarRuangPublikPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('kategori') || 'semua';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedWilayah, setSelectedWilayah] = useState('Semua Wilayah');
  const [selectedKategori, setSelectedKategori] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('relevan');
  const [selectedRadius, setSelectedRadius] = useState(() => {
    const radiusParam = Number(searchParams.get('radius'));
    return RADIUS_OPTIONS.some((opsi) => opsi.value === radiusParam) ? radiusParam : RADIUS_BAWAAN;
  });

  // Dynamic States
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [metrics, setMetrics] = useState(null);

  const { location, error: geoError, isLoading: isGeoLoading, requestLocation } = useGeolocation();

  // Metrik ringkas dihitung backend atas seluruh tabel. "Status prima" dan
  // "perhatian" adalah hitungan fasilitas, bukan ruang publik, jadi angkanya
  // tidak bisa diturunkan dari daftar yang tampil di bawah.
  useEffect(() => {
    let isMounted = true;

    getPublicSpacesStats()
      .then((data) => {
        if (isMounted) setMetrics(data);
      })
      .catch((err) => console.error('Error fetching public space stats:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Satu unduhan untuk seluruh data, dipakai bersama oleh daftar dan peta.
  // Titik acuan ikut dikirim supaya backend menghitung jarak tiap baris;
  // kalau pengguna belum berbagi lokasi, acuannya pusat kota.
  useEffect(() => {
    let isMounted = true;

    const fetchSpaces = async () => {
      setIsLoading(true);
      try {
        const data = await getAllPublicSpaces({
          lat: Number.isFinite(location.lat) ? location.lat : JAKARTA_CENTER.lat,
          lng: Number.isFinite(location.lng) ? location.lng : JAKARTA_CENTER.lng
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
  }, [location.lat, location.lng]);

  // Chip kategori mengikuti tabel categories lewat API, bukan daftar statis.
  useEffect(() => {
    let isMounted = true;

    getCategories()
      .then((data) => {
        if (isMounted) {
          setCategories([{ id: 'semua', label: 'Semua Kategori', iconName: 'LayoutGrid' }, ...data]);
        }
      })
      .catch((err) => console.error('Error fetching categories:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Null berarti statistik belum terbaca; tampilkan tanda hubung, bukan angka 0
  // yang bisa dibaca sebagai "memang nol".
  const angka = (nilai) => (typeof nilai === 'number' ? nilai : '–');

  // Semua penyaring dijalankan di sisi klien supaya mengganti filter tidak
  // mengunduh ulang seluruh data. Dibungkus useMemo supaya 1200 baris tidak
  // disaring ulang setiap kali tombol halaman ditekan.
  const filteredList = useMemo(() => {
    const kata = searchTerm.toLowerCase();

    const hasil = spaces
      .filter((item) => {
        if (!kata) return true;
        const nama = (item.nama || '').toLowerCase();
        const alamat = (item.alamat || '').toLowerCase();
        return nama.includes(kata) || alamat.includes(kata);
      })
      .filter((item) => selectedKategori === 'semua'
        || item.kategori_id === selectedKategori
        || item.kategori?.id === selectedKategori)
      .filter((item) => selectedWilayah === 'Semua Wilayah' || item.wilayah === selectedWilayah)
      .filter((item) => item.jarak_km != null && item.jarak_km <= selectedRadius / 1000);

    return hasil.sort((a, b) => {
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
  }, [spaces, searchTerm, selectedKategori, selectedWilayah, selectedRadius, sortBy]);

  const totalHalaman = Math.max(1, Math.ceil(filteredList.length / PER_HALAMAN));
  const halamanDariUrl = Number(searchParams.get('halaman')) || 1;
  const halamanAktif = Math.min(Math.max(1, halamanDariUrl), totalHalaman);
  const indexAwal = (halamanAktif - 1) * PER_HALAMAN;
  const itemTerlihat = filteredList.slice(indexAwal, indexAwal + PER_HALAMAN);

  const tulisHalaman = (params, nomor) => {
    const berikut = new URLSearchParams(params);
    if (nomor === 1) berikut.delete('halaman');
    else berikut.set('halaman', String(nomor));
    return berikut;
  };

  const keHalaman = (nomor) => {
    const tujuan = Math.min(Math.max(1, nomor), totalHalaman);
    setSearchParams(tulisHalaman(searchParams, tujuan));
  };

  const filterSekarang = useRef([searchTerm, selectedKategori, selectedWilayah, sortBy, selectedRadius]);

  // Ganti filter berarti kembali ke awal hasil, jadi halaman ikut direset ke 1.
  // Ref dipakai supaya tautan ?halaman= yang dibuka langsung tidak ikut
  // terhapus begitu komponen selesai dimuat.
  useEffect(() => {
    const nilai = [searchTerm, selectedKategori, selectedWilayah, sortBy, selectedRadius];
    const berubah = nilai.some((v, i) => v !== filterSekarang.current[i]);
    filterSekarang.current = nilai;

    if (!berubah || !searchParams.has('halaman')) return;

    setSearchParams((prev) => tulisHalaman(prev, 1), { replace: true });
  }, [searchTerm, selectedKategori, selectedWilayah, sortBy, selectedRadius, searchParams, setSearchParams]);

  // Halaman yang tidak ada lagi (tautan lama, atau hasil tersaring berkurang)
  // ditarik ke halaman terakhir yang masih valid. Dijeda selama data dimuat
  // agar tautan ?halaman= tidak terhapus sebelum jumlah halaman diketahui.
  useEffect(() => {
    if (isLoading || halamanDariUrl === halamanAktif) return;

    setSearchParams((prev) => tulisHalaman(prev, halamanAktif), { replace: true });
  }, [isLoading, halamanDariUrl, halamanAktif, setSearchParams]);

  const nomorHalaman = (() => {
    const kandidat = [1, totalHalaman, halamanAktif - 1, halamanAktif, halamanAktif + 1]
      .filter((n) => n >= 1 && n <= totalHalaman);
    const unik = [...new Set(kandidat)].sort((a, b) => a - b);

    const hasil = [];
    let sebelumnya = 0;
    unik.forEach((n) => {
      if (n - sebelumnya > 1) hasil.push('…');
      hasil.push(n);
      sebelumnya = n;
    });
    return hasil;
  })();

  const handleReset = () => {
    setSearchTerm('');
    setSelectedWilayah('Semua Wilayah');
    setSelectedKategori('semua');
    setSelectedRadius(RADIUS_BAWAAN);
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      <style>{`
        .kartu-ruang {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 180px;
        }
        .navigasi-nomor {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }
        .tombol-radius:focus-visible,
        .tombol-nomor-halaman:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        @media (max-width: 639px) {
          .navigasi-nomor { display: none; }
        }
        @media (max-width: 599px) {
          .kartu-ruang { grid-template-columns: 1fr; }
        }
      `}</style>

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
            flexWrap: 'wrap',
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
              {angka(metrics?.totalTerdata)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)', textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-success)' }}>STATUS PRIMA</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
              {angka(metrics?.statusPrima)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)', textAlign: 'center' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-warning)' }}>PERHATIAN</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-warning)' }}>
              {angka(metrics?.perluPerhatian)}
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
          <div style={{ color: 'var(--color-danger-text)', fontSize: '13px', marginBottom: '12px' }}>
            {geoError}
          </div>
        )}

        {!geoError && location.lat !== null && (
          <div style={{ color: 'var(--color-success-text)', fontSize: '13px', marginBottom: '12px' }}>
            Jarak pada peta dan daftar dihitung dari lokasi Anda.
          </div>
        )}

        {/* Radius dipakai bersama oleh daftar dan peta: mengubahnya sekaligus
            menyaring kartu di bawah dan marker yang tampil di peta. */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <span className="text-caption" style={{ fontWeight: 700 }}>RADIUS:</span>
          <div style={{ display: 'inline-flex', gap: 'var(--space-xs)', backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-xs)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-dark)' }}>
            {RADIUS_OPTIONS.map((opsi) => (
              <button
                key={opsi.value}
                type="button"
                className="kontrol-radius"
                aria-pressed={selectedRadius === opsi.value}
                onClick={() => setSelectedRadius(opsi.value)}
                style={{
                  minHeight: '44px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: selectedRadius === opsi.value ? 'var(--color-primary)' : 'transparent',
                  color: selectedRadius === opsi.value ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: selectedRadius === opsi.value ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {opsi.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="text-caption" style={{ fontWeight: 700, marginRight: '4px' }}>KATEGORI:</span>
          {categories.map((cat) => (
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
            <MapPin size={16} color="#0F766E" /> Peta Sebaran Lokasi (Sesuai Radius & Filter)
          </span>
          <span className="badge badge-info">Pin Terverifikasi Pemprov</span>
        </div>
        <PetaSebaranLokasi
          items={filteredList}
          loading={isLoading}
          userLocation={location}
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
              <div className="kartu-ruang">
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
          {itemTerlihat.map((item) => (
            <Card key={item.id} hoverable>
              <div className="kartu-ruang">
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
                            <MapPin size={14} color="var(--color-text-muted)" /> {item.alamat || 'Alamat tidak tersedia'} • <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{item.wilayah}</span>
                        </p>
                        {item.jarak_km !== undefined && item.jarak_km !== null && (
                          <span className="badge badge-neutral" style={{ display: 'inline-block', marginBottom: '8px' }}>
                            {item.jarak_km.toFixed(2)} km {Number.isFinite(location.lat) ? 'dari lokasi Anda' : 'dari pusat Jakarta'}
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
          description="Coba ubah kata kunci, longgarkan radius, atau reset filter kategori & wilayah Anda."
          actionLabel="Reset Pencarian"
          onAction={handleReset}
        />
      )}

      {/* Paginasi. Nomor halaman disembunyikan di layar sempit karena tidak
          muat; posisi tetap terbaca lewat teks "Halaman X dari Y". */}
      {!isLoading && totalHalaman > 1 && (
        <nav
          aria-label="Navigasi halaman daftar ruang publik"
          style={{
            marginTop: 'var(--space-xl)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap'
          }}
        >
          <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Halaman {halamanAktif} dari {totalHalaman}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              onClick={() => keHalaman(halamanAktif - 1)}
              disabled={halamanAktif === 1}
              style={{ minHeight: '44px' }}
            >
              Sebelumnya
            </Button>

            <div className="navigasi-nomor">
              {nomorHalaman.map((nomor, i) => (
                nomor === '…' ? (
                  <span key={`titik-halaman-${i}`} aria-hidden="true" style={{ color: 'var(--color-text-muted)', padding: '0 4px' }}>
                    …
                  </span>
                ) : (
                  <button
                    key={`halaman-${nomor}`}
                    type="button"
                    className="tombol-nomor-halaman"
                    aria-current={nomor === halamanAktif ? 'page' : undefined}
                    aria-label={`Halaman ${nomor}`}
                    onClick={() => keHalaman(nomor)}
                    style={{
                      minWidth: '44px',
                      minHeight: '44px',
                      padding: '0 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: nomor === halamanAktif ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: nomor === halamanAktif ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: nomor === halamanAktif ? '#FFFFFF' : 'var(--color-text-main)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {nomor}
                  </button>
                )
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => keHalaman(halamanAktif + 1)}
              disabled={halamanAktif === totalHalaman}
              style={{ minHeight: '44px' }}
            >
              Berikutnya
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default DaftarRuangPublikPage;
