import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ClipboardList, Tag, Calendar, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { MOCK_LAPORAN } from '../../../config/mockData';
import { Button, Card, CardBody, StatusBadge, EmptyState } from '../../../components';

export const RiwayatLaporanPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('semua');

  // Filter Reports by status tab
  const filteredLaporan = MOCK_LAPORAN.filter((item) => {
    if (activeTab === 'semua') return true;
    return item.status === activeTab;
  });

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="badge badge-info" style={{ marginBottom: 'var(--space-xs)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> KETERBUKAAN PELAYANAN WARGA
          </span>
          <h1 className="text-display">Laporan Saya</h1>
          <p className="text-body" style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Pantau perkembangan laporan fasilitas ruang publik yang telah Anda sampaikan secara transparan dan berkala.
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--color-primary-light)', padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} color="#0F766E" />
          </div>
          <div>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>KONTRIBUSI KOMUNITAS</span>
            <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }}>3 Ruang Aktif</div>
          </div>
        </div>
      </div>

      {/* STATUS TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('semua')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'semua' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'semua' ? 'white' : 'var(--color-text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Semua ({MOCK_LAPORAN.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dalam_penanganan')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'dalam_penanganan' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: activeTab === 'dalam_penanganan' ? 'white' : 'var(--color-text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Dalam Penanganan (1)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('selesai')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'selesai' ? 'var(--color-success)' : 'var(--color-surface)',
            color: activeTab === 'selesai' ? 'white' : 'var(--color-text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Selesai (1)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menunggu_verifikasi')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'menunggu_verifikasi' ? 'var(--color-info)' : 'var(--color-surface)',
            color: activeTab === 'menunggu_verifikasi' ? 'white' : 'var(--color-text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Menunggu Verifikasi (1)
        </button>
      </div>

      {/* REPORT LIST CARDS */}
      {filteredLaporan.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {filteredLaporan.map((item) => (
            <Card key={item.id} hoverable>
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '180px' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img src={item.foto} alt={item.fasilitasNama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="badge badge-info" style={{ position: 'absolute', top: '12px', left: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} /> {item.jenisMasalah.split('/')[0]}
                  </span>
                </div>

                <CardBody style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span className="text-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> Dilaporkan pada {item.tanggal}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <h3 className="h3" style={{ marginBottom: '2px' }}>{item.fasilitasNama}</h3>
                    <p className="text-caption" style={{ marginBottom: 'var(--space-md)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="var(--color-text-muted)" /> <strong>{item.ruangPublikNama}</strong> • {item.wilayah}
                    </p>

                    {/* Latest Status Timeline Update Box */}
                    <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--color-primary)' }}>
                      <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <RefreshCw size={12} /> PEMBARUAN TERAKHIR
                      </span>
                      <p className="text-small" style={{ fontWeight: 600 }}>
                        {item.pembaruanTerakhir}
                      </p>
                      <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                        {item.tanggalPembaruan}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Button variant="primary" size="sm" onClick={() => navigate(`/laporan-saya/${item.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Lihat Status Laporan <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Tidak Ada Laporan"
          description="Anda belum memiliki laporan pada kategori status ini."
          actionLabel="Tampilkan Semua Laporan"
          onAction={() => setActiveTab('semua')}
        />
      )}
    </div>
  );
};

export default RiwayatLaporanPage;
