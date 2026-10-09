import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Trees,
  MapPin,
  ShieldCheck,
  Share2,
  Bookmark,
  Map,
  Navigation,
  Clock,
  Ticket,
  Accessibility,
  PawPrint,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock3,
  Camera
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton, Modal } from '../../../components';
import { getPublicSpaceDetail } from '../../../services/ruangPublikService';
import { getSpaceReports, flagReport } from '../../../services/laporanService';
import { useAuth } from '../../../context/AuthContext';
import { useProfil } from '../../../context/ProfilContext';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (color = '#0F766E') =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

// Section "Pembaruan Partisipasi Warga": hanya laporan tayang (STATUS_TAYANG backend).
const FILTER_STATUS_LAPORAN = ['diverifikasi', 'dalam_penanganan', 'selesai'];
const TAHAP_LAPORAN = 6;

const OPSI_FILTER_LAPORAN = [
  ['semua', 'Semua'],
  ['diverifikasi', 'Diverifikasi'],
  ['dalam_penanganan', 'Dalam Penanganan'],
  ['selesai', 'Selesai'],
];

export const DetailRuangPublikPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { toggleSaveSpace, isSpaceSaved } = useProfil();
  const mapSectionRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityFilter, setFacilityFilter] = useState('semua');
  const [showMap, setShowMap] = useState(false);

  // Section "Pembaruan Partisipasi Warga" (laporan tayang) + aksi flag (FE-21).
  const [semuaLaporan, setSemuaLaporan] = useState([]);
  const [isLoadingLaporan, setIsLoadingLaporan] = useState(false);
  const [visibleCount, setVisibleCount] = useState(TAHAP_LAPORAN);
  const [flaggedIds, setFlaggedIds] = useState([]);
  const [flagError, setFlagError] = useState('');

  // Filter status section partisipasi, tersinkron ke query string (CONVENTIONS §1.2).
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const statusFilter = FILTER_STATUS_LAPORAN.includes(statusParam) ? statusParam : 'semua';

  const gantiStatusFilter = (nilai) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nilai === 'semua') next.delete('status');
      else next.set('status', nilai);
      return next;
    }, { replace: true });
    setVisibleCount(TAHAP_LAPORAN);
  };

  // Galeri foto (FE-14): indeks foto yang sedang diperbesar di lightbox (null = tertutup).
  const [fotoAktifIdx, setFotoAktifIdx] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicSpaceDetail(id);
        if (isMounted) {
          setDetail(data);
        }
      } catch (err) {
        console.error('Error fetching detail ruang publik:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      fetchDetail();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Muat laporan tayang ruang publik ini setelah detail tersedia.
  // Satu request (limit maksimum backend) dipakai ganda: sumber daftar section
  // (load-more di sisi klien) + set foto untuk label galeri "Dokumentasi Warga".
  useEffect(() => {
    let isMounted = true;
    if (!detail?.id) return undefined;

    const muatLaporan = async () => {
      setIsLoadingLaporan(true);
      try {
        const data = await getSpaceReports(detail.id, { limit: 500 });
        if (isMounted) setSemuaLaporan(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching laporan ruang publik:', err);
        if (isMounted) setSemuaLaporan([]);
      } finally {
        if (isMounted) setIsLoadingLaporan(false);
      }
    };

    muatLaporan();
    return () => {
      isMounted = false;
    };
  }, [detail?.id]);

  // Laporan setelah difilter status (klien-side) dan yang sedang terlihat (load-more).
  const laporanTerfilter = useMemo(
    () => (statusFilter === 'semua'
      ? semuaLaporan
      : semuaLaporan.filter((lap) => lap.status === statusFilter)),
    [semuaLaporan, statusFilter]
  );
  const laporanTampil = laporanTerfilter.slice(0, visibleCount);
  const adaLagi = visibleCount < laporanTerfilter.length;

  // Set URL foto laporan warga (untuk melabeli galeri "Dokumentasi Warga").
  const fotoWargaSet = useMemo(
    () => new Set(semuaLaporan.map((lap) => lap.foto).filter(Boolean)),
    [semuaLaporan]
  );

  const galeriFoto = detail?.foto ?? [];
  const tampilkanGaleri = galeriFoto.length > 1;

  // Tandai laporan warga sebagai tidak pantas (FE-21 / BE-25).
  const handleFlag = async (laporanId) => {
    setFlagError('');
    if (!user || !token) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const hasil = await flagReport(laporanId);
      setFlaggedIds((prev) => (prev.includes(laporanId) ? prev : [...prev, laporanId]));
      if (hasil?.flag_count != null) {
        setSemuaLaporan((prev) =>
          prev.map((l) => (l.id === laporanId ? { ...l, flagCount: hasil.flag_count } : l))
        );
      }
    } catch (err) {
      // 409 = sudah pernah ditandai; perlakukan sebagai "sudah ditandai".
      if (err.status === 409) {
        setFlaggedIds((prev) => (prev.includes(laporanId) ? prev : [...prev, laporanId]));
        return;
      }
      setFlagError(err.message || 'Gagal menandai laporan.');
    }
  };

  const handleToggleMap = () => {
    setShowMap((prev) => {
      const nextState = !prev;
      if (nextState) {
        setTimeout(() => {
          mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      return nextState;
    });
  };

  const filteredFacilities = detail?.fasilitas?.filter((facility) => (
    facilityFilter === 'semua' || facility.status === facilityFilter
  )) || [];

  const centerCoords = detail?.koordinat
    ? [detail.koordinat.lat, detail.koordinat.lng]
    : null;

  const urlPetunjukArah = centerCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${centerCoords[0]},${centerCoords[1]}`
    : null;
  const isSaved = detail ? isSpaceSaved(detail.id) : false;

  const handleSaveSpace = () => {
    if (!user || !token) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggleSaveSpace(detail.id);
  };

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
        <Skeleton height="20px" width="320px" style={{ marginBottom: 'var(--space-md)' }} />
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Skeleton height="24px" width="100px" />
            <Skeleton height="24px" width="160px" />
            <Skeleton height="24px" width="140px" />
          </div>
          <Skeleton height="40px" width="50%" style={{ marginBottom: '8px' }} />
          <Skeleton height="20px" width="70%" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-3xl)' }}>
          <Card><CardBody><Skeleton height="260px" /></CardBody></Card>
          <Card><CardBody><Skeleton height="260px" /></CardBody></Card>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
        <EmptyState
          title="Ruang Publik Tidak Ditemukan"
          description="Data detail ruang publik yang Anda cari tidak tersedia atau ID tidak valid."
          actionLabel="Kembali ke Direktori Ruang Publik"
          onAction={() => navigate('/ruang-publik')}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* BREADCRUMB */}
      <nav style={{ marginBottom: 'var(--space-md)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        <Link to="/home" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Beranda</Link>
        {' > '}
        <Link to="/ruang-publik" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Ruang Publik</Link>
        {' > '}
        <span>{detail.wilayah}</span>
        {' > '}
        <strong style={{ color: 'var(--color-text-main)' }}>{detail.nama}</strong>
      </nav>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Trees size={14} /> {detail.kategori}
            </span>
            <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {detail.alamat}
            </span>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> {detail.verified ? 'Aset Terverifikasi Pemprov DKI' : 'Terdaftar'}
            </span>
          </div>
          <h1 className="text-display">{detail.nama}</h1>
          <p className="text-body" style={{ color: 'var(--color-text-muted)', maxWidth: '800px', marginTop: '4px' }}>
            {detail.deskripsi}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={() => alert('Link telah disalin!')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Share2 size={14} /> Bagikan
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveSpace} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={14} /> {isSaved ? 'Tersimpan' : 'Simpan Ruang'}
          </Button>
        </div>
      </div>

      {/* INTERACTIVE LEAFLET MAP TOGGLE CONTAINER */}
      <div ref={mapSectionRef}>
        {showMap && (
          <div style={{ marginBottom: 'var(--space-2xl)', animation: 'fadeIn 0.3s ease-in-out' }}>
            <Card style={{ border: '2px solid var(--color-primary)' }}>
              <CardBody style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Map size={20} color="var(--color-primary)" />
                    <h3 className="h3" style={{ fontSize: '18px', margin: 0 }}>Peta Interaktif & Rute Kawasan • {detail.nama}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {urlPetunjukArah && (
                      <a
                        className="btn btn-outline btn-sm"
                        href={urlPetunjukArah}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ExternalLink size={14} /> Petunjuk Arah (Google Maps)
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMap(false)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={16} /> Tutup Peta
                    </Button>
                  </div>
                </div>
                {!centerCoords ? (
                  <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)' }}>
                    <MapPin size={24} />
                    <p className="text-small" style={{ margin: 0 }}>Koordinat belum tersedia untuk lokasi ini.</p>
                  </div>
                ) : (
                <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 1, position: 'relative' }}>
                  <MapContainer
                    center={centerCoords}
                    zoom={15}
                    style={{ height: '100%', width: '100%', filter: 'grayscale(70%) contrast(1.2) brightness(1.05)' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={centerCoords} icon={createCustomIcon()}>
                      <Popup>
                        <div style={{ padding: '4px' }}>
                          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>{detail.nama}</strong>
                          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{detail.alamat}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* TOP ROW: PETA AKSES & JAM AKSESIBILITAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-3xl)' }}>
        {/* Peta Akses & Batas Kawasan */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: '8px', flexWrap: 'wrap' }}>
              <div>
                <h3 className="h3" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Map size={18} color="#0F766E" /> Peta Akses & Batas Kawasan
                </h3>
                <p className="text-caption">{detail.alamat}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant={showMap ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleToggleMap}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Navigation size={14} /> {showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
                </Button>
                {urlPetunjukArah && (
                  <a
                    className="btn btn-primary btn-sm"
                    href={urlPetunjukArah}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={14} /> Petunjuk Arah (Google Maps)
                  </a>
                )}
              </div>
            </div>

            <div style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
              <img
                src={detail.image}
                alt="Peta Lokasi"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontWeight: 700, boxShadow: 'var(--shadow-md)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#0F766E" /> Lokasi {detail.nama}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Jam & Aksesibilitas Warga */}
        <Card>
          <CardBody style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 className="h3" style={{ fontSize: '18px', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={18} color="#0F766E" /> Jam & Aksesibilitas Warga
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Jam Buka
                  </span>
                  <strong className="text-small">{detail.jamOperasional}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Ticket size={14} /> Tiket Masuk
                  </span>
                  <strong className="text-small" style={{ color: 'var(--color-success)' }}>{detail.tiketMasuk}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Accessibility size={14} /> Akses Disabilitas
                  </span>
                  <strong className="text-small">{detail.aksesDisabilitas}</strong>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-primary-light)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-lg)' }}>
              <p className="text-caption" style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PawPrint size={14} /> {detail.ramahHewan}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* SECOND ROW: KONDISI FASILITAS PUBLIK */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <span className="text-caption" style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
              TRANSPARANSI PRASARANA • DIPERBARUI WARGA & DINAS
            </span>
            <h2 className="h2">Kondisi Fasilitas Publik</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-neutral">{detail.fasilitas.length} Fasilitas Terdata</span>
            <span className="badge badge-success">{detail.stats.baik} Baik</span>
            <span className="badge badge-warning">{detail.stats.perluPerhatian} Perlu Perhatian</span>
            <span className="badge badge-danger">{detail.stats.rusak} Rusak</span>
          </div>
        </div>

        <Card className="facility-list-panel">
          <CardBody style={{ padding: 0 }}>
            <div className="facility-list-toolbar">
              <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                Pilih fasilitas untuk melihat rincian atau mengirim laporan.
              </p>
              <div className="facility-filter-group" role="group" aria-label="Filter kondisi fasilitas">
                {[
                  ['semua', 'Semua'],
                  ['baik', 'Baik'],
                  ['perlu_perhatian', 'Perlu Perhatian'],
                  ['rusak', 'Rusak']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`facility-filter-button ${facilityFilter === value ? 'is-active' : ''}`}
                    onClick={() => setFacilityFilter(value)}
                    aria-pressed={facilityFilter === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {filteredFacilities.length === 0 ? (
              <div className="facility-list-empty">
                <p className="text-body">Tidak ada fasilitas dengan kondisi tersebut.</p>
                <button type="button" className="facility-reset-filter" onClick={() => setFacilityFilter('semua')}>
                  Tampilkan semua fasilitas
                </button>
              </div>
            ) : (
              <div className="facility-list" role="list">
                {filteredFacilities.map((fas) => (
                  <div className="facility-list-row" key={fas.id} role="listitem">
                    <div className="facility-list-info">
                      <div className="facility-list-title-row">
                        <h4 className="h3" style={{ fontSize: '16px' }}>{fas.nama}</h4>
                        <StatusBadge status={fas.status} />
                      </div>
                      <p className="text-small facility-list-description">{fas.deskripsi}</p>
                      <span className="text-caption facility-list-location">
                        <MapPin size={12} /> {fas.lokasiSpesifik}
                      </span>
                    </div>
                    <div className="facility-list-actions">
                      <Button variant="outline" size="sm" onClick={() => setSelectedFacility(fas)}>
                        Rincian
                      </Button>
                      <Button
                        variant={fas.status === 'rusak' ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => navigate(`/ruang-publik/${detail.id}/lapor?fasilitas=${fas.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <AlertCircle size={14} /> Lapor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* SECTION: GALERI FOTO (FE-14) — foto resmi + dokumentasi warga */}
      {tampilkanGaleri && (
        <section style={{ marginBottom: 'var(--space-3xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <span className="text-caption" style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
                DOKUMENTASI
              </span>
              <h2 className="h2">Galeri Foto</h2>
              <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                Foto resmi pengelola dan dokumentasi warga untuk ruang publik ini.
              </p>
            </div>
            <span className="badge badge-neutral">{galeriFoto.length} Foto</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
            {galeriFoto.map((url, idx) => {
              const dariWarga = fotoWargaSet.has(url);
              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setFotoAktifIdx(idx)}
                  aria-label={`Perbesar foto ${idx + 1} dari ${galeriFoto.length}`}
                  style={{ position: 'relative', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '110px' }}
                >
                  <img
                    src={url}
                    alt={`Foto ${detail.nama} ke-${idx + 1}`}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {dariWarga && (
                    <span className="badge badge-info" style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '11px' }}>
                      <Camera size={11} /> Dokumentasi Warga
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION: PEMBARUAN PARTISIPASI WARGA (laporan tayang) */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <span className="text-caption" style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
              PARTISIPASI WARGA
            </span>
            <h2 className="h2">Pembaruan Partisipasi Warga</h2>
            <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
              Laporan kondisi fasilitas yang sudah tayang dan dipantau bersama.
            </p>
          </div>
          <span className="badge badge-neutral">{semuaLaporan.length} Laporan Tayang</span>
        </div>

        {flagError && (
          <div role="alert" style={{ backgroundColor: 'var(--color-danger-light)', color: '#991B1B', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} /> {flagError}
          </div>
        )}

        {!isLoadingLaporan && semuaLaporan.length > 0 && (
          <div className="facility-filter-group" role="group" aria-label="Filter status laporan" style={{ marginBottom: 'var(--space-lg)' }}>
            {OPSI_FILTER_LAPORAN.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`facility-filter-button ${statusFilter === value ? 'is-active' : ''}`}
                onClick={() => gantiStatusFilter(value)}
                aria-pressed={statusFilter === value}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {isLoadingLaporan ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
            {[1, 2].map((n) => (
              <Card key={`sk-lap-${n}`}><CardBody><Skeleton height="80px" /></CardBody></Card>
            ))}
          </div>
        ) : laporanTerfilter.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-small" style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
                {semuaLaporan.length === 0
                  ? 'Belum ada laporan warga yang tayang untuk ruang publik ini.'
                  : 'Belum ada laporan dengan status ini.'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
              {laporanTampil.map((lap) => {
                const sudahDitandai = flaggedIds.includes(lap.id);
                const laporanSendiri = user?.id && lap.userId && user.id === lap.userId;
                return (
                  <Card key={lap.id}>
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <h4 className="h3" style={{ fontSize: '16px' }}>{lap.fasilitasNama || 'Fasilitas'}</h4>
                        <StatusBadge status={lap.status} />
                      </div>
                      <div className="text-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock3 size={12} /> {lap.tanggal || 'Baru'} • {lap.jenisMasalah}
                      </div>
                      {lap.deskripsi && (
                        <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                          {lap.deskripsi}
                        </p>
                      )}
                      {!laporanSendiri && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={sudahDitandai}
                          onClick={() => handleFlag(lap.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: sudahDitandai ? 'var(--color-text-muted)' : 'var(--color-danger)' }}
                        >
                          <Flag size={14} /> {sudahDitandai ? 'Sudah Ditandai' : 'Tandai Tidak Pantas'}
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {adaLagi && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-lg)' }}>
                <Button variant="outline" onClick={() => setVisibleCount((c) => c + TAHAP_LAPORAN)}>
                  Muat Lebih Banyak
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* BANNER CTA LAPORKAN MASALAH */}
      <Card style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary)' }}>
        <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="#FFFFFF" />
            </div>
            <div>
              <h3 className="h3" style={{ color: 'var(--color-text-main)' }}>Ada fasilitas yang bermasalah?</h3>
              <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                Bantu informasikan masalah fasilitas kepada pengelola kota demi kenyamanan bersama.
              </p>
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate(`/ruang-publik/${detail.id}/lapor`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> Laporkan Masalah Fasilitas
          </Button>
        </CardBody>
      </Card>

      {/* MODAL DETAIL FASILITAS */}
      {selectedFacility && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <Card style={{ maxWidth: '480px', width: '100%' }}>
            <CardBody style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="h3">{selectedFacility.nama}</h3>
                <button type="button" onClick={() => setSelectedFacility(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Tutup">
                  <X size={20} color="var(--color-text-muted)" />
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <StatusBadge status={selectedFacility.status} />
              </div>

              {selectedFacility.deskripsi && (
                <p className="text-body" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  {selectedFacility.deskripsi}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" fullWidth onClick={() => setSelectedFacility(null)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    const fid = selectedFacility.id;
                    setSelectedFacility(null);
                    navigate(`/ruang-publik/${detail.id}/lapor?fasilitas=${fid}`);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <AlertCircle size={14} /> Laporkan Kerusakan
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* LIGHTBOX GALERI FOTO (FE-14) */}
      <Modal
        open={fotoAktifIdx !== null}
        onClose={() => setFotoAktifIdx(null)}
        maxWidth="760px"
        title={fotoAktifIdx !== null ? `Foto ${fotoAktifIdx + 1} dari ${galeriFoto.length} • ${detail.nama}` : ''}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={fotoAktifIdx === null || fotoAktifIdx <= 0}
              onClick={() => setFotoAktifIdx((i) => Math.max(0, i - 1))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={14} /> Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={fotoAktifIdx === null || fotoAktifIdx >= galeriFoto.length - 1}
              onClick={() => setFotoAktifIdx((i) => Math.min(galeriFoto.length - 1, i + 1))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Berikutnya <ChevronRight size={14} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => setFotoAktifIdx(null)}>
              Tutup
            </Button>
          </>
        }
      >
        {fotoAktifIdx !== null && galeriFoto[fotoAktifIdx] && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <img
              src={galeriFoto[fotoAktifIdx]}
              alt={`Foto ${detail.nama} ke-${fotoAktifIdx + 1}`}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
            />
            {fotoWargaSet.has(galeriFoto[fotoAktifIdx]) && (
              <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Camera size={12} /> Dokumentasi Warga
              </span>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DetailRuangPublikPage;
