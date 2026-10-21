import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Skeleton, Spinner } from '../../../components';
import { riwayatSync, triggerSync } from '../../../services/syncService';

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

const gayaBarisRiwayat = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-sm)',
  backgroundColor: 'var(--color-surface)',
};

const LABEL_PEMICU = {
  manual: 'Manual',
  terjadwal: 'Terjadwal',
  sekali: 'Sekali jalan',
};

const badgeRun = (status) => {
  if (status === 'sukses') return 'badge-success';
  if (status === 'gagal') return 'badge-danger';
  return 'badge-warning';
};

const formatWaktu = (iso) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const durasiRun = (run) => {
  if (!run.selesai) return run.status === 'berjalan' ? 'berjalan' : null;
  const detik = Math.round((new Date(run.selesai) - new Date(run.mulai)) / 1000);
  return `${Math.max(detik, 0)} detik`;
};

const ringkasanHitung = (hitung) => {
  if (!hitung) return null;
  const angka = (kunci) => hitung[kunci] ?? 0;
  return `${angka('baru')} baru, ${angka('diupdate')} diupdate, ${angka(
    'tanpa_perubahan'
  )} tanpa perubahan`;
};

/**
 * Panel impor Satu Data + riwayat sinkronisasi.
 *
 * Dipisah dari halaman supaya tabel data master tetap ringkas. `onSelesai`
 * dipanggil setelah sinkronisasi sukses agar halaman memuat ulang datanya.
 */
export const SinkronisasiPanel = ({ onSelesai }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [statusRiwayat, setStatusRiwayat] = useState('memuat');
  const [riwayatError, setRiwayatError] = useState(null);
  const [logTerbuka, setLogTerbuka] = useState(null);

  const muatRiwayat = async () => {
    setStatusRiwayat('memuat');
    try {
      const data = await riwayatSync(10);
      setRiwayat(data);
      setStatusRiwayat('siap');
    } catch (err) {
      setRiwayatError(typeof err.detail === 'string' ? err.detail : err.message);
      setStatusRiwayat('gagal');
    }
  };

  useEffect(() => {
    muatRiwayat();
  }, []);

  const jalankanSinkronisasi = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const hasil = await triggerSync();
      if (hasil.status === 'sukses') {
        await onSelesai?.();
      }
      setSyncResult(hasil);
    } catch (err) {
      setSyncError(typeof err.detail === 'string' ? err.detail : err.message);
    } finally {
      setIsSyncing(false);
      muatRiwayat();
    }
  };

  return (
    <Card style={{ marginBottom: 'var(--space-xl)' }}>
      <CardBody>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}
        >
          <div>
            <h2 className="h3" style={{ margin: 0 }}>Sinkronisasi Satu Data</h2>
            <p className="text-small" style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
              Impor data resmi lokasi ruang terbuka hijau dari Satu Data Jakarta.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={jalankanSinkronisasi} disabled={isSyncing}>
            {isSyncing ? 'Menyinkronkan…' : 'Impor Data Satu Data'}
          </Button>
        </div>

        {(isSyncing || syncResult || syncError) && (
          <div role="status" aria-live="polite" style={{ marginTop: 'var(--space-md)' }}>
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
        )}

        <details style={{ marginTop: 'var(--space-lg)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            Riwayat Sinkronisasi
            <span className="text-small" style={{ marginLeft: '8px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
              10 run terakhir, terbaru di atas.
            </span>
          </summary>

          <div style={{ marginTop: 'var(--space-md)' }}>
            {statusRiwayat === 'memuat' && (
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                {[1, 2, 3].map((n) => (
                  <div key={`skeleton-riwayat-${n}`} style={gayaBarisRiwayat}>
                    <Skeleton height="18px" width="220px" />
                    <div style={{ marginTop: '8px' }}>
                      <Skeleton height="12px" width="140px" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {statusRiwayat === 'gagal' && (
              <div style={gayaBarisStatus}>
                <span className="badge badge-danger">Riwayat tidak termuat</span>
                <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                  {riwayatError || 'Server tidak menjawab permintaan riwayat.'}
                </span>
                <Button variant="outline" size="sm" onClick={muatRiwayat}>
                  Coba lagi
                </Button>
              </div>
            )}

            {statusRiwayat === 'siap' && riwayat.length === 0 && (
              <div style={gayaBarisRiwayat}>
                <p style={{ margin: 0, fontWeight: 600 }}>Belum ada sinkronisasi yang tercatat</p>
                <p className="text-small" style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
                  Jalankan tombol Impor Data Satu Data; hasil run-nya langsung tersimpan dan
                  muncul di daftar ini.
                </p>
              </div>
            )}

            {statusRiwayat === 'siap' && riwayat.length > 0 && (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: 'var(--space-sm)',
                }}
              >
                {riwayat.map((run) => {
                  const terbuka = logTerbuka === run.id;
                  const hitung = ringkasanHitung(run.hitung);
                  const durasi = durasiRun(run);
                  return (
                    <li key={run.id} style={gayaBarisRiwayat}>
                      <div style={gayaBarisStatus}>
                        <span className={`badge ${badgeRun(run.status)}`}>{run.status}</span>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>
                          {formatWaktu(run.mulai)}
                        </span>
                        <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                          {LABEL_PEMICU[run.pemicu] || run.pemicu}
                        </span>
                        {durasi && (
                          <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                            {durasi}
                          </span>
                        )}
                        {hitung && (
                          <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                            {hitung}
                          </span>
                        )}
                        {run.status === 'gagal' && run.tahapGagal && (
                          <span style={{ fontWeight: 600 }}>Berhenti di tahap {run.tahapGagal}</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ marginLeft: 'auto' }}
                          aria-expanded={terbuka}
                          onClick={() => setLogTerbuka(terbuka ? null : run.id)}
                        >
                          {terbuka ? 'Tutup log' : 'Lihat log'}
                        </Button>
                      </div>

                      {terbuka && (
                        <div
                          id={`log-run-${run.id}`}
                          style={{
                            marginTop: 'var(--space-sm)',
                            display: 'grid',
                            gap: 'var(--space-sm)',
                          }}
                        >
                          {run.tahap.length === 0 && (
                            <p className="text-small" style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                              Run ini berhenti sebelum tahap pertama selesai dicatat.
                            </p>
                          )}
                          {run.tahap.map((t) => (
                            <div key={t.nama}>
                              <div style={gayaBarisStatus}>
                                <span
                                  className={`badge ${
                                    t.status === 'sukses' ? 'badge-success' : 'badge-danger'
                                  }`}
                                >
                                  {t.status}
                                </span>
                                <span style={{ fontWeight: 600 }}>{t.nama}</span>
                                <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                                  {t.detik} detik
                                </span>
                              </div>
                              {t.log.length > 0 ? (
                                <pre style={{ ...gayaLog, marginTop: 'var(--space-xs)' }}>
                                  {t.log.join('\n')}
                                </pre>
                              ) : (
                                <p
                                  className="text-small"
                                  style={{ margin: 'var(--space-xs) 0 0', color: 'var(--color-text-muted)' }}
                                >
                                  Tidak ada keluaran log untuk tahap ini.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </details>
      </CardBody>
    </Card>
  );
};

export default SinkronisasiPanel;
