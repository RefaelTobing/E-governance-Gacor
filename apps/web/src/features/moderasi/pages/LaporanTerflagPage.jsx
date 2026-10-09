import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, MapPin, RotateCcw } from 'lucide-react';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton } from '../../../components';
import { getFlaggedReports } from '../../../services/laporanService';

/**
 * Daftar laporan yang ditandai (flagged) pengguna lain (FE-26 / BE-31).
 * Terpisah dari antrian moderasi; urut flag terbanyak dari backend.
 */
export const LaporanTerflagPage = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const muatData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await getFlaggedReports();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat laporan ter-flag.');
      setList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  return (
    <div>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            MODERASI KONTEN • PENANDAAN WARGA
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Laporan Ditandai Warga</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Laporan tayang yang ditandai tidak pantas oleh warga, urut dari penandaan terbanyak.
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--color-warning-light)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-warning)' }}>
          <span className="text-caption" style={{ fontWeight: 700, color: '#92400E' }}>TOTAL DITANDAI</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400E' }}>
            {isLoading ? '...' : `${list.length} Laporan`}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" style={{ backgroundColor: 'var(--color-danger-light)', color: '#991B1B', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>{errorMsg}</span>
          <Button variant="outline" size="sm" onClick={muatData} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={14} /> Coba Lagi
          </Button>
        </div>
      )}

      {/* DATA TABLE */}
      <Card>
        <CardBody>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>LAPORAN</th>
                  <th style={{ padding: '12px' }}>LOKASI</th>
                  <th style={{ padding: '12px' }}>JENIS MASALAH</th>
                  <th style={{ padding: '12px' }}>TANGGAL</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px' }}>PENANDAAN</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={`skeleton-flag-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="140px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="150px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="80px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="70px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="80px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : list.length > 0 ? (
                  list.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{row.fasilitasNama || 'Fasilitas'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--color-text-muted)" /> {row.ruangPublikNama}
                          {row.wilayah ? `, ${row.wilayah}` : ''}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-neutral">{(row.jenisMasalah || '').split('/')[0]}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{row.tanggal}</td>
                      <td style={{ padding: '12px' }}><StatusBadge status={row.status} /></td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Flag size={12} /> {row.flagCount} Penanda
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Button variant="primary" size="sm" onClick={() => navigate(`/dashboard/moderasi/${row.id}`)}>
                          Periksa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title="Belum Ada Laporan Ditandai"
                        description="Tidak ada laporan tayang yang ditandai tidak pantas oleh warga saat ini."
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

export default LaporanTerflagPage;
