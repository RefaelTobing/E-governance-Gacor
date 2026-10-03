import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getUserReports } from '../../../services/laporanService';
import { StatusBadge, Skeleton } from '../../../components';

export const ProfilDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getUserReports();
        if (isMounted) {
          setReports(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Gagal memuat data laporan. Coba lagi nanti.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalLaporan = reports.length;
  const dalamPenanganan = reports.filter((r) => r.status === 'dalam_penanganan').length;
  const selesai = reports.filter((r) => r.status === 'selesai').length;

  const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'W';

  const stats = [
    { label: 'Total Laporan', value: totalLaporan, icon: ClipboardList, color: 'var(--color-info)' },
    { label: 'Dalam Penanganan', value: dalamPenanganan, icon: Clock, color: 'var(--color-accent)' },
    { label: 'Selesai Ditangani', value: selesai, icon: CheckCircle2, color: 'var(--color-success)' },
  ];

  return (
    <div className="container" style={{ maxWidth: '1000px', padding: 0 }}>
      {/* Kartu ringkasan akun */}
      <div className="profil-hero-card">
        <div className="profil-hero-avatar">{inisial}</div>
        <div className="profil-hero-info">
          <h1 className="h1 profil-hero-nama">{user?.name || 'Warga Jakarta'}</h1>
          <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>{user?.email || '-'}</span>
          <div className="profil-hero-meta">
            <span className="badge badge-success">
              <span className="badge-dot"></span> Warga Terverifikasi
            </span>
          </div>
        </div>
      </div>

      {/* Metrik kontribusi */}
      <div className="profil-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="profil-stat-card">
              <div className="profil-stat-icon" style={{ color: stat.color }}>
                <Icon size={22} aria-hidden="true" />
              </div>
              <div className="profil-stat-value">
                {isLoading ? <Skeleton height="28px" width="60px" /> : stat.value}
              </div>
              <div className="profil-stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="profil-error-state">
          <strong>Gagal memuat data laporan.</strong>
          <span>Pastikan koneksi ke server tersedia, lalu muat ulang halaman ini.</span>
        </div>
      )}

      {/* Daftar laporan terkini */}
      <div className="profil-section-head">
        <h2 className="h2">Laporan Terbaru</h2>
        {!isLoading && totalLaporan > 0 && (
          <button
            type="button"
            className="profil-link-button"
            onClick={() => navigate('/profil/laporan')}
          >
            Lihat Semua <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="profil-report-list">
          {[1, 2, 3].map((n) => (
            <div key={`skeleton-profil-${n}`} className="profil-report-item">
              <Skeleton height="48px" width="48px" borderRadius="var(--radius-md)" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skeleton height="16px" width="55%" />
                <Skeleton height="12px" width="35%" />
              </div>
              <Skeleton height="22px" width="110px" borderRadius="var(--radius-pill)" />
            </div>
          ))}
        </div>
      ) : totalLaporan === 0 ? (
        <div className="profil-empty-state">
          <ClipboardList size={36} color="var(--color-text-light)" aria-hidden="true" />
          <h3 className="h3">Belum Ada Laporan Terkirim</h3>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Mulai berkontribusi melaporkan kondisi fasilitas ruang publik di sekitar Anda.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ruang-publik')}
          >
            <Plus size={16} aria-hidden="true" /> Buat Laporan Baru
          </button>
        </div>
      ) : (
        <div className="profil-report-list">
          {reports.slice(0, 3).map((item) => (
            <button
              key={item.id}
              type="button"
              className="profil-report-item"
              onClick={() => navigate(`/laporan-saya/${item.id}`)}
            >
              <div className="profil-report-thumb" aria-hidden="true">
                {item.jenisMasalah ? item.jenisMasalah.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="profil-report-body">
                <span className="profil-report-title">{item.jenisMasalah || 'Laporan Fasilitas'}</span>
                <span className="profil-report-sub">
                  {item.ruangPublikNama || 'Ruang Publik'}
                </span>
              </div>
              <StatusBadge status={item.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilDashboardPage;
