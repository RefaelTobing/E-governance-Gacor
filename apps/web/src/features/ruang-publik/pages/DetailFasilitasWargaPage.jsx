import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trees,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Tag,
  Info,
} from 'lucide-react';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton } from '../../../components';
import { getPublicSpaceDetail } from '../../../services/ruangPublikService';

/**
 * Detail Fasilitas (publik), Screen 05.
 *
 * Halaman info satu fasilitas dalam sebuah ruang publik: kondisi terkini,
 * dokumentasi bila ada, jenis sarana/pemanfaatan, dan CTA laporkan masalah.
 * Data diambil dari `getPublicSpaceDetail` (tanpa endpoint baru); fasilitas
 * yang tidak ada dikembalikan sebagai "tidak ditemukan".
 */
export const DetailFasilitasWargaPage = () => {
  const { id, fasilitasId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicSpaceDetail(id);
        if (isMounted) setDetail(data);
      } catch (err) {
        console.error('Error fetching detail fasilitas:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (id) fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
        <Skeleton height="20px" width="360px" style={{ marginBottom: 'var(--space-md)' }} />
        <Card style={{ marginBottom: 'var(--space-2xl)' }}>
          <CardBody style={{ padding: 'var(--space-2xl)' }}>
            <Skeleton height="24px" width="160px" style={{ marginBottom: '10px' }} />
            <Skeleton height="36px" width="55%" style={{ marginBottom: '8px' }} />
            <Skeleton height="18px" width="40%" />
          </CardBody>
        </Card>
      </div>
    );
  }

  const fasilitas = detail?.fasilitas?.find((f) => String(f.id) === String(fasilitasId)) || null;

  if (!detail || !fasilitas) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
        <EmptyState
          title="Fasilitas Tidak Ditemukan"
          description="Data fasilitas yang Anda cari tidak tersedia atau tautannya sudah tidak berlaku."
          actionLabel={detail ? `Kembali ke ${detail.nama}` : 'Kembali ke Daftar Ruang Publik'}
          onAction={() => navigate(detail ? `/ruang-publik/${id}` : '/ruang-publik')}
        />
      </div>
    );
  }

  const centerCoords = fasilitas.koordinat || detail.koordinat || null;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* BREADCRUMB */}
      <nav style={{ marginBottom: 'var(--space-md)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        <Link to="/home" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Beranda</Link>
        {' > '}
        <Link to="/ruang-publik" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Ruang Publik</Link>
        {' > '}
        <Link to={`/ruang-publik/${id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>{detail.nama}</Link>
        {' > '}
        <strong style={{ color: 'var(--color-text-main)' }}>{fasilitas.nama}</strong>
      </nav>

      {/* HEADER */}
      <Card style={{ marginBottom: 'var(--space-2xl)' }}>
        <CardBody style={{ padding: 'var(--space-2xl)' }}>
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
            <Trees size={12} /> {detail.nama}
          </span>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={12} /> {fasilitas.kategori || 'Fasilitas Umum'}
            </span>
            <StatusBadge status={fasilitas.status} />
          </div>
          <h1 className="text-display">{fasilitas.nama}</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} color="var(--color-text-muted)" /> {fasilitas.lokasiSpesifik || detail.alamat} • {detail.wilayah}
          </p>
        </CardBody>
      </Card>

      <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 'var(--space-2xl)' }}>
        {/* LEFT COLUMN */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <span className="text-caption" style={{ fontWeight: 700 }}>KONDISI TERKINI</span>
              <h3 className="h3" style={{ marginBottom: 'var(--space-md)' }}>Status Fasilitas</h3>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <StatusBadge status={fasilitas.status} />
              </div>
              {fasilitas.deskripsi && (
                <p className="text-body" style={{ color: 'var(--color-text-muted)' }}>{fasilitas.deskripsi}</p>
              )}
              {!fasilitas.deskripsi && (
                <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>Belum ada catatan kondisi untuk fasilitas ini.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="h3" style={{ fontSize: '16px', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} color="#0F766E" /> Informasi Fasilitas
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">JENIS SARANA</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{fasilitas.kategori || 'Umum'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">PEMANFAATAN AREA</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{fasilitas.lokasiSpesifik || detail.wilayah}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <h4 className="h3" style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="#0F766E" /> Posisi Fasilitas
              </h4>
              {centerCoords ? (
                <a
                  className="btn btn-outline btn-sm"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${centerCoords.lat},${centerCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}
                >
                  <MapPin size={14} /> Buka di Google Maps
                </a>
              ) : (
                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Koordinat fasilitas belum tersedia.</p>
              )}
            </CardBody>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate(`/ruang-publik/${id}/lapor?fasilitas=${fasilitas.id}`)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <AlertCircle size={16} /> Laporkan Masalah Fasilitas Ini
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(`/ruang-publik/${id}`)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Kembali ke {detail.nama}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailFasilitasWargaPage;
