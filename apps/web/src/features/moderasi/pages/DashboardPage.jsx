import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Download,
  ClipboardList,
  Inbox,
  Wrench,
  CheckCircle2,
  MapPin,
  Lightbulb,
  Droplets,
  Armchair,
  Radio
} from 'lucide-react';
import { MOCK_DASHBOARD_STATS } from '../../../data/mockData';
import { Button, Card, CardBody, StatusBadge, SearchInput, EmptyState, Skeleton } from '../../../components';
import { getAdminReports, getDashboardStats } from '../../../services/laporanService';
import PetaDashboardAdmin from '../components/PetaDashboardAdmin';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [laporanList, setLaporanList] = useState([]);
  const [stats, setStats] = useState(MOCK_DASHBOARD_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const [reportsData, statsData] = await Promise.all([
          getAdminReports(),
          getDashboardStats()
        ]);
        if (isMounted) {
          setLaporanList(reportsData);
          if (statsData) setStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLaporan = laporanList.filter((item) =>
    (item.fasilitasNama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.ruangPublikNama || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            ● DISTRIK TERPADU • WILAYAH DKI JAKARTA
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Dashboard Pengelola Ruang Publik</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Ringkasan verifikasi dan status pemeliharaan fasilitas ruang terbuka hijau Jakarta.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Pembaruan: Hari Ini, 10:45 WIB
          </Button>
          <Button variant="primary" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Unduh Laporan (CSV)
          </Button>
        </div>
      </div>

      {/* 4 SUMMARY STATISTIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700 }}>TOTAL LAPORAN</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '4px' }}>
              {isLoading ? '...' : (stats?.totalLaporan ?? laporanList.length)}
            </div>
            <span className="text-caption">Laporan Terdata</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-info">Seluruh RTH Aktif</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-info)' }}>MENUNGGU VERIFIKASI</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inbox size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-info)', marginBottom: '4px' }}>
              {isLoading ? '...' : (stats?.menungguVerifikasi ?? laporanList.filter(l => l.status === 'menunggu_verifikasi').length)}
            </div>
            <span className="text-caption">Laporan Baru</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-info">Perlu Tinjauan Lapangan</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-warning)' }}>DALAM PENANGANAN</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-warning)', marginBottom: '4px' }}>
              {isLoading ? '...' : (stats?.dalamPenanganan ?? laporanList.filter(l => l.status === 'dalam_penanganan').length)}
            </div>
            <span className="text-caption">Fasilitas Sedang Dikerjakan</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-warning">Proses Perbaikan Fisik</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-success)' }}>SELESAI</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-success)', marginBottom: '4px' }}>
              {isLoading ? '...' : (stats?.selesai ?? laporanList.filter(l => l.status === 'selesai').length)}
            </div>
            <span className="text-caption">Fasilitas Normal Kembali</span>
          </CardBody>
        </Card>
      </div>

      {/* ROW 1: PETA SEBARAN & RINGKASAN KATEGORI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        {/* Peta Sebaran Ruang Publik */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: '8px', flexWrap: 'wrap' }}>
              <div>
                <h3 className="h3" style={{ fontSize: '18px' }}>Peta Sebaran Ruang Publik</h3>
                <p className="text-caption">Seluruh ruang terbuka terdata di Jakarta beserta lokasinya.</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="badge badge-success">Terverifikasi</span>
                <span className="badge badge-neutral">Terdaftar</span>
              </div>
            </div>

            <PetaDashboardAdmin />
          </CardBody>
        </Card>

        {/* Ringkasan Kategori */}
        <Card>
          <CardBody>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '4px' }}>Ringkasan Kategori</h3>
            <p className="text-caption" style={{ marginBottom: 'var(--space-md)' }}>Distribusi masalah fasilitas terlapor.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={14} color="#0F766E" /> Fasilitas Rusak
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>54 Kasus</strong>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={14} color="#0F766E" /> Lampu Mati
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>42 Kasus</strong>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={14} color="#0F766E" /> Masalah Kebersihan
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>32 Kasus</strong>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Armchair size={14} color="#0F766E" /> Bangku Rusak
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>20 Kasus</strong>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ROW 2: MONITORING LAPORAN TERKINI TABLE */}
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <h3 className="h3" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={18} color="#0F766E" /> Monitoring Laporan Terkini
              </h3>
              <p className="text-caption">Hubungan terpadu laporan warga, objek fasilitas, dan status penanganan dinas.</p>
            </div>
            <div style={{ width: '280px' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari fasilitas / lokasi..."
              />
            </div>
          </div>

          {/* DATA TABLE */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>LAPORAN</th>
                  <th style={{ padding: '12px' }}>LOKASI</th>
                  <th style={{ padding: '12px' }}>FASILITAS</th>
                  <th style={{ padding: '12px' }}>TANGGAL</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={`skeleton-row-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="140px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="120px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="100px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="80px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="60px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : filteredLaporan.length > 0 ? (
                  filteredLaporan.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{row.fasilitasNama}</td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--color-text-muted)" /> {row.ruangPublikNama}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-neutral">{row.jenisMasalah.split('/')[0]}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{row.tanggal}</td>
                      <td style={{ padding: '12px' }}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/dashboard/moderasi/${row.id}`)}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title="Tidak Ada Laporan Ditemukan"
                        description="Tidak ada laporan fasilitas yang sesuai dengan pencarian Anda."
                        actionLabel={searchTerm ? "Reset Pencarian" : undefined}
                        onAction={searchTerm ? () => setSearchTerm('') : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DashboardPage;
