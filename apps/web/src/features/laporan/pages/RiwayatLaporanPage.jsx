import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ClipboardList, Tag, Calendar, MapPin, RefreshCw, ArrowRight, AlertTriangle, Eye } from 'lucide-react';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton } from '../../../components';
import { getUserReports } from '../../../services/laporanService';

// Format tanggal ISO -> "12 Sep 2026" (fallback '' bila kosong/invalid).
const formatTanggal = (iso) => {
  if (!iso) return '';
  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return '';
  return tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const RiwayatLaporanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('semua');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setReports([]);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const sesiBerakhir = error?.status === 401;

  // Filter Reports by status tab
  const filteredLaporan = reports.filter((item) => {
    if (activeTab === 'semua') return true;
    return item.status === activeTab;
  });

  // Dynamic status counts
  const countSemua = reports.length;
  const countPenanganan = reports.filter((r) => r.status === 'dalam_penanganan').length;
  const countSelesai = reports.filter((r) => r.status === 'selesai').length;
  const countVerifikasi = reports.filter((r) => r.status === 'menunggu_verifikasi').length;
  const countDitolak = reports.filter((r) => r.status === 'ditolak').length;
  const distinctSpaces = new Set(reports.map((r) => r.ruangPublikId || r.ruangPublikNama)).size;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <div>
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
            <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }}>
              {isLoading ? '...' : reports.length > 0 ? `${distinctSpaces} Ruang Aktif` : '-'}
            </div>
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
          Semua ({countSemua})
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
          Dalam Penanganan ({countPenanganan})
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
          Selesai ({countSelesai})
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
          Menunggu Verifikasi ({countVerifikasi})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ditolak')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'ditolak' ? 'var(--color-danger)' : 'var(--color-surface)',
            color: activeTab === 'ditolak' ? 'white' : 'var(--color-text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Ditolak ({countDitolak})
        </button>
      </div>

      {/* REPORT LIST CARDS with Loading & Empty State */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {[1, 2].map((n) => (
            <Card key={`skeleton-report-${n}`}>
              <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '180px' }}>
                <Skeleton height="100%" borderRadius="var(--radius-lg) 0 0 var(--radius-lg)" />
                <CardBody style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-lg)', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Skeleton height="14px" width="140px" />
                      <Skeleton height="20px" width="100px" borderRadius="var(--radius-pill)" />
                    </div>
                    <Skeleton height="22px" width="55%" style={{ marginBottom: '6px' }} />
                    <Skeleton height="14px" width="40%" style={{ marginBottom: '14px' }} />
                    <Skeleton height="45px" width="100%" borderRadius="var(--radius-md)" />
                  </div>
                  <div style={{ textAlign: 'right', paddingTop: 'var(--space-md)' }}>
                    <Skeleton height="32px" width="150px" borderRadius="var(--radius-md)" />
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', textAlign: 'center', padding: 'var(--space-lg)' }}>
              <AlertTriangle size={28} color="var(--color-danger)" />
              <div>
                <h3 className="h3" style={{ marginBottom: '4px' }}>
                  {sesiBerakhir ? 'Sesi Anda Telah Berakhir' : 'Gagal Memuat Laporan'}
                </h3>
                <p className="text-small" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                  {sesiBerakhir
                    ? 'Silakan masuk kembali untuk melihat riwayat laporan Anda.'
                    : 'Terjadi kendala saat mengambil data. Coba lagi nanti.'}
                </p>
              </div>
              {sesiBerakhir ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                >
                  Masuk Kembali
                </Button>
              ) : (
                <Button variant="primary" onClick={fetchReports} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Coba Lagi
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : reports.length === 0 ? (
        <EmptyState
          title="Belum Ada Laporan Terkirim"
          description="Anda belum memiliki riwayat pengiriman laporan fasilitas. Mari bantu tingkatkan kenyamanan fasilitas publik di sekitar Anda."
          actionLabel="Laporkan Fasilitas Baru"
          onAction={() => navigate('/ruang-publik')}
        />
      ) : filteredLaporan.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {filteredLaporan.map((item) => (
            <Card key={item.id} hoverable>
              <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '180px' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '160px' }}>
                  <img src={item.foto} alt={item.fasilitasNama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="badge badge-info" style={{ position: 'absolute', top: '12px', left: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} /> {(item.jenisMasalah || 'Umum').split('/')[0]}
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

                    {/* Pembaruan terakhir: alasan penolakan (bila ditolak) atau waktu update terakhir */}
                    {item.status === 'ditolak' && item.alasanPenolakan ? (
                      <div style={{ backgroundColor: 'var(--color-danger-light, #FEE2E2)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--color-danger)' }}>
                        <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <AlertTriangle size={12} /> ALASAN PENOLAKAN
                        </span>
                        <p className="text-small" style={{ fontWeight: 600, margin: 0 }}>
                          {item.alasanPenolakan}
                        </p>
                      </div>
                    ) : (
                      <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--color-primary)' }}>
                        <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <RefreshCw size={12} /> PEMBARUAN TERAKHIR
                        </span>
                        <p className="text-small" style={{ fontWeight: 600, margin: 0 }}>
                          {item.updatedAt ? `Terakhir diperbarui ${formatTanggal(item.updatedAt)}` : 'Menunggu pembaruan status'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {item.status === 'selesai' ? (
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/laporan-saya/${item.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={14} /> Lihat Riwayat
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/laporan-saya/${item.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Lihat Status Laporan <ArrowRight size={14} />
                      </Button>
                    )}
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum Ada Laporan Terkirim"
          description="Anda belum memiliki laporan pada kategori status ini."
          actionLabel="Tampilkan Semua Laporan"
          onAction={() => setActiveTab('semua')}
        />
      )}
    </div>
  );
};

export default RiwayatLaporanPage;
