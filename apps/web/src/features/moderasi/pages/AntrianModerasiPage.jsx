import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, MapPin } from 'lucide-react';
import { MOCK_WILAYAH, MOCK_MODERASI_STATS } from '../../../data/mockData';
import { Button, Card, CardBody, StatusBadge, SearchInput, EmptyState, Skeleton } from '../../../components';
import { getAdminReports, getModerasiStats } from '../../../services/laporanService';

export const AntrianModerasiPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedWilayah, setSelectedWilayah] = useState('Semua Wilayah');

  const [queueList, setQueueList] = useState([]);
  const [stats, setStats] = useState(MOCK_MODERASI_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchQueue = async () => {
      setIsLoading(true);
      try {
        const [reportsData, statsData] = await Promise.all([
          getAdminReports(),
          getModerasiStats()
        ]);
        if (isMounted) {
          setQueueList(reportsData);
          if (statsData) setStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching moderasi queue:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Logic
  const filteredList = queueList.filter((item) => {
    const matchSearch =
      (item.fasilitasNama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ruangPublikNama || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchWilayah = selectedWilayah === 'Semua Wilayah' || item.wilayah === selectedWilayah;
    const matchStatus =
      selectedStatus === 'Semua Status' || item.statusLabel?.toLowerCase() === selectedStatus.toLowerCase();
    return matchSearch && matchWilayah && matchStatus;
  });

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatus('Semua Status');
    setSelectedWilayah('Semua Wilayah');
  };

  const perluTindakanCount = stats?.perluTindakan ?? queueList.filter(l => l.status === 'menunggu_verifikasi').length;
  const selesaiPekanIniCount = stats?.selesaiPekanIni ?? queueList.filter(l => l.status === 'selesai').length;

  return (
    <div>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            PUSAT PENANGANAN FASILITAS WARGA • Update Realtime
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Daftar Laporan Fasilitas</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Kelola dan tindaklanjuti laporan kondisi fasilitas dari warga.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div style={{ backgroundColor: 'var(--color-warning-light)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-warning)' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: '#92400E' }}>PERLU TINDAKAN</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400E' }}>
              {isLoading ? '...' : `${perluTindakanCount} Laporan`}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--color-success-light)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-success)' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: '#065F46' }}>SELESAI PEKAN INI</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#065F46' }}>
              {isLoading ? '...' : `${selesaiPekanIniCount} Fasilitas`}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <Card style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama fasilitas, ruang publik, atau masalah..."
            />
          </div>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '170px' }}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Dalam Penanganan">Dalam Penanganan</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <select
            className="form-select"
            value={selectedWilayah}
            onChange={(e) => setSelectedWilayah(e.target.value)}
            style={{ width: '170px' }}
          >
            {MOCK_WILAYAH.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <Button variant="ghost" size="sm" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card>
        <CardBody>
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
                    <tr key={`skeleton-mod-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="140px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="150px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="80px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="80px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : filteredList.length > 0 ? (
                  filteredList.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{row.fasilitasNama}</td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--color-text-muted)" /> {row.ruangPublikNama}, <span className="text-caption">{row.wilayah}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-neutral">{(row.jenisMasalah || 'Umum').split('/')[0]}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{row.tanggal}</td>
                      <td style={{ padding: '12px' }}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Button
                          variant={row.status === 'menunggu_verifikasi' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => navigate(`/dashboard/moderasi/${row.id}`)}
                        >
                          {row.status === 'menunggu_verifikasi' ? 'Verifikasi' : 'Periksa Laporan'}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title="Tidak Ada Antrian Laporan"
                        description="Tidak ada laporan yang sesuai dengan filter atau kata kunci pencarian Anda."
                        actionLabel="Reset Filter"
                        onAction={handleReset}
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

export default AntrianModerasiPage;
