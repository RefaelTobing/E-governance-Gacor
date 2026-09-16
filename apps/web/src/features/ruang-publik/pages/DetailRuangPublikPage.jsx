import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { MOCK_RUANG_PUBLIK } from '../../../config/mockData';
import { Button, Card, CardBody, StatusBadge } from '../../../components';

export const DetailRuangPublikPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find detail data or fallback to Taman Suropati
  const detail = MOCK_RUANG_PUBLIK.find((item) => item.id === id) || MOCK_RUANG_PUBLIK[0];
  const [selectedFacility, setSelectedFacility] = useState(null);

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
          <Button variant="outline" size="sm" onClick={() => alert('Ruang publik disimpan ke favorit!')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={14} /> Simpan Ruang
          </Button>
        </div>
      </div>

      {/* TOP ROW: PETA AKSES & JAM AKSESIBILITAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-3xl)' }}>
        {/* Peta Akses & Batas Kawasan */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div>
                <h3 className="h3" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Map size={18} color="#0F766E" /> Peta Akses & Batas Kawasan
                </h3>
                <p className="text-caption">{detail.alamat}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.nama + ' ' + detail.alamat)}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="primary" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={14} /> Petunjuk Arah / Rute
                </Button>
              </a>
            </div>

            <div style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
              <img
                src={detail.image}
                alt="Peta Lokasi"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontWeight: 700, boxShadow: 'var(--shadow-md)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#0F766E" /> Spot Utama {detail.nama}
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

        {/* Facility Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
          {detail.fasilitas.map((fas) => (
            <Card key={fas.id} style={{ borderColor: fas.status === 'rusak' ? 'var(--color-danger)' : 'var(--color-border)' }}>
              <CardBody style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 className="h3" style={{ fontSize: '16px' }}>{fas.nama}</h4>
                    <StatusBadge status={fas.status} />
                  </div>
                  <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                    {fas.deskripsi}
                  </p>
                  <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                    <MapPin size={12} color="var(--color-text-muted)" /> {fas.lokasiSpesifik}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setSelectedFacility(fas)}
                  >
                    Rincian Fasilitas
                  </Button>
                  <Button
                    variant={fas.status === 'rusak' ? 'danger' : 'primary'}
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/ruang-publik/${detail.id}/lapor?fasilitas=${fas.id}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <AlertCircle size={14} /> Lapor Kerusakan
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
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

              <p className="text-body" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                {selectedFacility.deskripsi}
              </p>

              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px' }}>
                <strong>Lokasi Spesifik:</strong> {selectedFacility.lokasiSpesifik}
              </div>

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
    </div>
  );
};

export default DetailRuangPublikPage;
