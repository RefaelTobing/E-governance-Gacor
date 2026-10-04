import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, EmptyState, Skeleton, Spinner } from '../../../components';
import { getPublicSpaces } from '../../../services/ruangPublikService';
import { getAllFacilities } from '../../../services/fasilitasService';
import { triggerSync } from '../../../services/syncService';

const gayaLog = {
  margin: 'var(--space-xs) 0 0',
  padding: 'var(--space-sm)',
  backgroundColor: 'var(--color-bg-main)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '12px',
  maxHeight: '200px',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const gayaBarisStatus = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  flexWrap: 'wrap',
};

export const DataMasterPage = () => {
  const [masterList, setMasterList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jumlahFasilitas, setJumlahFasilitas] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicSpaces();
        if (isMounted) {
          setMasterList(data);
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const fetchJumlahFasilitas = async () => {
      try {
        const daftar = await getAllFacilities();
        const hitung = {};
        daftar.forEach((f) => {
          hitung[f.ruangPublikId] = (hitung[f.ruangPublikId] || 0) + 1;
        });
        if (isMounted) setJumlahFasilitas(hitung);
      } catch (err) {
        // Gagal memuat hitungan: kolom memakai "-", bukan angka nol yang menyesatkan.
        if (isMounted) setJumlahFasilitas(null);
      }
    };

    fetchMasterData();
    fetchJumlahFasilitas();

    return () => {
      isMounted = false;
    };
  }, []);

  const muatUlangMaster = async () => {
    try {
      const data = await getPublicSpaces();
      setMasterList(data);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const jalankanSinkronisasi = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const hasil = await triggerSync();
      if (hasil.status === 'sukses') {
        await muatUlangMaster();
      }
      setSyncResult(hasil);
    } catch (err) {
      setSyncError(typeof err.detail === 'string' ? err.detail : err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            DATA MASTER • SINKRONISASI SATU DATA
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Data Master Ruang Publik</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Data resmi lokasi ruang terbuka hijau hasil integrasi Satu Data Jakarta.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={jalankanSinkronisasi} disabled={isSyncing}>
          {isSyncing ? 'Menyinkronkan…' : 'Impor Data Satu Data'}
        </Button>
      </div>

      {(isSyncing || syncResult || syncError) && (
        <Card style={{ marginBottom: 'var(--space-xl)' }}>
          <CardBody>
            <div role="status" aria-live="polite">
              {isSyncing && (
                <div style={gayaBarisStatus}>
                  <Spinner size="sm" />
                  <span style={{ fontWeight: 600 }}>Menyinkronkan data dari Satu Data Jakarta</span>
                  <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                    Extract, transform, dan seed berjalan di server; hasilnya tampil di sini setelah selesai.
                  </span>
                </div>
              )}

              {!isSyncing && syncError && (
                <div style={gayaBarisStatus}>
                  <span className="badge badge-danger">Sinkronisasi tidak berjalan</span>
                  <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>{syncError}</span>
                </div>
              )}

              {!isSyncing && syncResult && (
                <div>
                  <div style={gayaBarisStatus}>
                    <span className={`badge ${syncResult.status === 'sukses' ? 'badge-success' : 'badge-danger'}`}>
                      {syncResult.status === 'sukses' ? 'Sinkronisasi selesai' : 'Sinkronisasi gagal'}
                    </span>
                    <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                      {syncResult.status === 'sukses'
                        ? `Total ${syncResult.totalDetik} detik.`
                        : `Berhenti di tahap ${syncResult.tahapGagal} setelah ${syncResult.totalDetik} detik.`}
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-md) 0 0', display: 'grid', gap: 'var(--space-sm)' }}>
                    {syncResult.tahap.map((t) => (
                      <li key={t.nama} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        <span className={`badge ${t.status === 'sukses' ? 'badge-success' : 'badge-danger'}`}>{t.status}</span>
                        <span style={{ fontWeight: 600 }}>{t.nama}</span>
                        <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>{t.detik} detik</span>
                        {t.log.length > 0 && (
                          <details style={{ flexBasis: '100%' }}>
                            <summary className="text-small" style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                              Log {t.nama}
                            </summary>
                            <pre style={gayaLog}>{t.log.join('\n')}</pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>NAMA RUANG PUBLIK</th>
                  <th style={{ padding: '12px' }}>KATEGORI</th>
                  <th style={{ padding: '12px' }}>WILAYAH</th>
                  <th style={{ padding: '12px' }}>JAM OPERASIONAL</th>
                  <th style={{ padding: '12px' }}>FASILITAS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={`skeleton-dm-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="160px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="100px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="100px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="80px" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="80px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : masterList.length > 0 ? (
                  masterList.map((rp) => (
                    <tr key={rp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>📍 {rp.nama}</td>
                      <td style={{ padding: '12px' }}><span className="badge badge-info">{rp.kategori}</span></td>
                      <td style={{ padding: '12px' }}>{rp.wilayah}</td>
                      <td style={{ padding: '12px' }}>{rp.jamOperasional}</td>
                      <td style={{ padding: '12px' }}>{jumlahFasilitas ? `${jumlahFasilitas[rp.id] || 0} Terdata` : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Button variant="outline" size="sm" onClick={() => alert(`Edit Ruang Publik: ${rp.nama}`)}>
                          Edit Master
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title="Belum Ada Data Master"
                        description="Data master ruang publik belum tersedia di sistem."
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

export default DataMasterPage;
