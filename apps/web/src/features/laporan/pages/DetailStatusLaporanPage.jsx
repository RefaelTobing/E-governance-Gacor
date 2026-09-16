import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tag,
  Calendar,
  MapPin,
  CheckCircle2,
  Wrench,
  ClipboardList,
  Trees,
  Armchair,
  AlertTriangle,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { MOCK_LAPORAN } from '../../../config/mockData';
import { Button, Card, CardBody, StatusBadge } from '../../../components';

export const DetailStatusLaporanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const laporan = MOCK_LAPORAN.find((item) => item.id === id) || MOCK_LAPORAN[0];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* BREADCRUMB */}
      <nav style={{ marginBottom: 'var(--space-md)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        <Link to="/home" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Beranda</Link>
        {' > '}
        <Link to="/laporan-saya" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Laporan Saya</Link>
        {' > '}
        <strong style={{ color: 'var(--color-text-main)' }}>Detail Laporan #{laporan.id}</strong>
      </nav>

      {/* HEADER CARD */}
      <Card style={{ marginBottom: 'var(--space-2xl)' }}>
        <CardBody style={{ padding: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} /> {laporan.jenisMasalah}
                </span>
                <StatusBadge status={laporan.status} />
                <span className="text-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {laporan.tanggal}
                </span>
              </div>
              <h1 className="text-display">{laporan.fasilitasNama}</h1>
              <p className="text-small" style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--color-text-muted)" /> {laporan.ruangPublikNama}, {laporan.wilayah}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px 16px', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
              <span className="text-caption" style={{ fontWeight: 700 }}>WILAYAH PENGAWASAN</span>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '14px' }}>Suku Dinas Pertamanan</div>
              <span className="text-caption">{laporan.wilayah} • Ruang Terbuka Hijau</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* STEPPER ALUR TINDAK LANJUT */}
      <Card style={{ marginBottom: 'var(--space-2xl)' }}>
        <CardBody style={{ padding: 'var(--space-2xl)' }}>
          <span className="text-caption" style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
            TRANSPARANSI PENANGANAN
          </span>
          <h2 className="h2" style={{ marginBottom: 'var(--space-xl)' }}>Alur Tindak Lanjut Ruang Publik</h2>

          {/* Stepper Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
            {laporan.timeline.map((step, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: step.status === laporan.status.toUpperCase() ? 'var(--color-warning-light)' : 'var(--color-bg-main)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: `4px solid ${step.status === 'SELESAI' ? 'var(--color-success)' : 'var(--color-primary)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {step.status === 'SELESAI' ? (
                      <CheckCircle2 size={16} color="var(--color-success)" />
                    ) : step.status === 'DALAM_PENANGANAN' ? (
                      <Wrench size={16} color="#0F766E" />
                    ) : (
                      <ClipboardList size={16} color="var(--color-text-muted)" />
                    )}
                  </span>
                  <strong className="text-small">{step.title}</strong>
                </div>
                <div className="text-caption" style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
                  {step.date}
                </div>
                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* TWO COLUMN DETAILS & BUKTI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 'var(--space-2xl)' }}>
        {/* Left Column: Data Fasilitas */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <span className="text-caption" style={{ fontWeight: 700 }}>RINCIAN KOMPREHENSIF</span>
              <h3 className="h3" style={{ marginBottom: 'var(--space-lg)' }}>Data Fasilitas & Kondisi</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">RUANG PUBLIK</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trees size={14} color="#0F766E" /> {laporan.ruangPublikNama}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">FASILITAS TERKAIT</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Armchair size={14} color="#0F766E" /> {laporan.fasilitasNama}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-danger-light)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', color: '#991B1B' }}>
                <span className="text-caption" style={{ fontWeight: 700, color: '#991B1B' }}>JENIS KENDALA</span>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#991B1B" /> {laporan.jenisMasalah}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <span className="text-caption" style={{ fontWeight: 700 }}>CATATAN & PENGAMATAN WARGA</span>
                <p className="text-body" style={{ fontStyle: 'italic', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                  "{laporan.deskripsi}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border)', fontSize: '12px' }}>
                  <span>Identitas Pelapor: <strong>{laporan.modeIdentitas === 'anonim' ? 'Anonim (Warga)' : laporan.namaPelapor}</strong></span>
                  <span className="badge badge-info">{laporan.modeIdentitas === 'anonim' ? 'Identitas Terlindung' : 'Warga Terdaftar'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Bukti Foto */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <h4 className="h3" style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} color="#0F766E" /> Bukti Dokumentasi Warga
              </h4>
              <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '12px' }}>
                <img src={laporan.foto} alt="Bukti Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="var(--color-text-muted)" /> <strong>Posisi Titik Perbaikan:</strong> Sisi Jalur Pedestrian
                </div>
                <div style={{ color: 'var(--color-success)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Akurasi GPS ±4m (Presisi)
                </div>
              </div>
            </CardBody>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate(`/ruang-publik/${laporan.ruangPublikId}`)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Trees size={16} /> Lihat Halaman Fasilitas Taman
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/laporan-saya')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Kembali ke Laporan Saya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailStatusLaporanPage;
