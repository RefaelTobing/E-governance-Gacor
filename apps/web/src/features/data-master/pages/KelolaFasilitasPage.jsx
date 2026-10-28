import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, SelectDropdown, Skeleton } from '../../../components';
import {
  getAdminPublicSpaces,
  getPublicSpaceDetail,
  getPublicSpacesStats,
  updatePublicSpaceManual,
} from '../../../services/ruangPublikService';
import { STANDAR_FASILITAS } from '../../../utils/standarFasilitas';
import EditRuangPublikModal from '../components/EditRuangPublikModal';
import SinkronisasiPanel from '../components/SinkronisasiPanel';

const hitungStandar = (rows = []) => {
  const nama = new Set(rows.map((row) => row.nama.trim().toLowerCase()));
  return STANDAR_FASILITAS.filter((item) => nama.has(item.toLowerCase())).length;
};

const PAGE_SIZES = [10, 20, 50, 100];

/**
 * Halaman induk data master + fasilitas ruang publik.
 *
 * Satu tabel memuat data master (endpoint admin, termasuk penanda edit manual)
 * sekaligus pintu masuk pengelolaan 12 fasilitas standar per ruang publik.
 */
export const KelolaFasilitasPage = () => {
  const navigate = useNavigate();
  const [ruangPublik, setRuangPublik] = useState([]);
  const [jumlahTotal, setJumlahTotal] = useState(0);
  const [pencarian, setPencarian] = useState('');
  const [pencarianServer, setPencarianServer] = useState('');
  const [ukuranHalaman, setUkuranHalaman] = useState(10);
  const [halaman, setHalaman] = useState(1);
  const [jumlahFasilitas, setJumlahFasilitas] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [versiMuat, setVersiMuat] = useState(0);

  // Edit manual data master (FE-27 / BE-33).
  const [editTarget, setEditTarget] = useState(null);
  const [suksesMsg, setSuksesMsg] = useState('');

  // Pencarian server-side: tunggu ketikan berhenti agar tidak membanjiri API.
  useEffect(() => {
    const timer = setTimeout(() => setPencarianServer(pencarian.trim()), 300);
    return () => clearTimeout(timer);
  }, [pencarian]);

  useEffect(() => {
    let aktif = true;

    const muatData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const skip = (halaman - 1) * ukuranHalaman;
        const [ruang, stats] = await Promise.all([
          getAdminPublicSpaces({ q: pencarianServer || undefined, skip, limit: ukuranHalaman }),
          getPublicSpacesStats({ q: pencarianServer || undefined }),
        ]);
        const detail = await Promise.all(ruang.map((item) => getPublicSpaceDetail(item.id)));
        const hitungan = {};
        detail.forEach((item) => {
          if (item) hitungan[item.id] = hitungStandar(item.fasilitas || []);
        });
        if (!aktif) return;
        setRuangPublik(ruang);
        setJumlahFasilitas(hitungan);
        setJumlahTotal(stats.totalTerdata || 0);
      } catch (err) {
        if (aktif) setError(typeof err.detail === 'string' ? err.detail : (err.message || 'Data ruang publik gagal dimuat.'));
      } finally {
        if (aktif) setIsLoading(false);
      }
    };

    muatData();

    return () => {
      aktif = false;
    };
  }, [halaman, ukuranHalaman, pencarianServer, versiMuat]);

  const jumlahHalaman = Math.max(1, Math.ceil(jumlahTotal / ukuranHalaman));

  const ubahPencarian = (value) => {
    setPencarian(value);
    setHalaman(1);
  };

  const ubahUkuran = (value) => {
    setUkuranHalaman(Number(value));
    setHalaman(1);
  };

  // Simpan edit manual: kirim hanya kolom berubah, lalu perbarui baris memakai
  // response backend supaya penanda field_source ikut segar.
  const simpanEdit = async (payload) => {
    const hasil = await updatePublicSpaceManual(editTarget.id, payload);
    setRuangPublik((prev) => prev.map((ruang) => (ruang.id === hasil.id ? hasil : ruang)));
    setEditTarget(null);
    setSuksesMsg(`Perubahan "${hasil.nama}" berhasil disimpan dan ditandai sebagai edit manual.`);
  };

  const kolomDiedit = (ruang) => Object.keys(ruang.fieldSource || {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            Data master
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Kelola Fasilitas</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Kelola data master ruang publik dan 12 fasilitas standarnya.
          </p>
        </div>
        <div className="text-small" style={{ color: 'var(--color-text-muted)' }}>
          {isLoading ? 'Memuat ruang publik...' : `${jumlahTotal} ruang publik`}
        </div>
      </div>

      <SinkronisasiPanel onSelesai={() => setVersiMuat((versi) => versi + 1)} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', maxWidth: '460px' }}>
        <Search size={18} color="var(--color-text-muted)" aria-hidden="true" />
        <input
          className="form-input"
          value={pencarian}
          onChange={(e) => ubahPencarian(e.target.value)}
          placeholder="Cari nama, alamat, atau wilayah..."
          aria-label="Cari ruang publik"
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {[1, 2, 3].map((n) => <Skeleton key={`ruang-sk-${n}`} height="82px" />)}
        </div>
      ) : error ? (
        <EmptyState title="Data gagal dimuat" description={error} actionLabel="Coba lagi" onAction={() => setVersiMuat((versi) => versi + 1)} />
      ) : ruangPublik.length === 0 ? (
        <EmptyState
          title={pencarianServer ? 'Ruang publik tidak ditemukan' : 'Belum ada ruang publik'}
          description={pencarianServer ? 'Coba gunakan kata kunci lain.' : 'Belum ada data ruang publik yang dapat dikelola.'}
          actionLabel={pencarianServer ? 'Reset pencarian' : undefined}
          onAction={pencarianServer ? () => ubahPencarian('') : undefined}
        />
      ) : (
        <Card className="card-kelola-fasilitas">
          <CardBody style={{ padding: 0 }}>
            {suksesMsg && (
              <div role="status" aria-live="polite" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', margin: '16px 16px 0', fontSize: '13px' }}>
                {suksesMsg}
              </div>
            )}
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>NAMA RUANG PUBLIK</th>
                    <th style={{ padding: '12px' }}>KATEGORI</th>
                    <th style={{ padding: '12px' }}>ALAMAT</th>
                    <th style={{ padding: '12px' }}>WILAYAH</th>
                    <th style={{ padding: '12px' }}>FASILITAS STANDAR</th>
                    <th style={{ padding: '12px' }}>SUMBER DATA</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {ruangPublik.map((ruang) => {
                    const jumlah = jumlahFasilitas[ruang.id] || 0;
                    const diedit = kolomDiedit(ruang);
                    return (
                      <tr key={ruang.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px 12px', minWidth: '220px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={13} color="var(--color-text-muted)" aria-hidden="true" />
                            <strong>{ruang.nama}</strong>
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span className="text-caption">{ruang.kategori}</span>
                        </td>
                        <td style={{ padding: '14px 12px', minWidth: '220px' }}>
                          <span className="text-caption">{ruang.alamat || 'Alamat belum tersedia'}</span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>{ruang.wilayah || '—'}</td>
                        <td style={{ padding: '14px 12px' }}>
                          {/* Angka kelengkapan jadi sorotan hanya kalau belum
                              lengkap; 12/12 cukup teks biasa. */}
                          {jumlah === STANDAR_FASILITAS.length ? (
                            <span className="text-caption">{jumlah}/{STANDAR_FASILITAS.length} tersedia</span>
                          ) : (
                            <span className="badge badge-warning">
                              {jumlah}/{STANDAR_FASILITAS.length} tersedia
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          {diedit.length > 0 ? (
                            <span className="badge badge-warning" title={`Kolom: ${diedit.join(', ')}`}>
                              {diedit.length} kolom diedit manual
                            </span>
                          ) : (
                            <span className="text-caption">Sumber Satu Data</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSuksesMsg(''); setEditTarget(ruang); }}
                            >
                              Edit Master
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/dashboard/fasilitas/${ruang.id}`)}
                            >
                              Lihat Fasilitas
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
              <label className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Tampilkan
                <SelectDropdown
                  options={PAGE_SIZES.map(String)}
                  value={String(ukuranHalaman)}
                  onChange={(size) => ubahUkuran(size)}
                  className="select-dropdown-inline"
                  ariaLabel="Jumlah ruang per halaman"
                  placement="up"
                />
                per halaman
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-small">Halaman {halaman} dari {jumlahHalaman}</span>
                <Button variant="outline" size="sm" disabled={halaman <= 1} onClick={() => setHalaman((page) => Math.max(1, page - 1))} aria-label="Halaman sebelumnya">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" disabled={halaman >= jumlahHalaman} onClick={() => setHalaman((page) => Math.min(jumlahHalaman, page + 1))} aria-label="Halaman berikutnya">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <EditRuangPublikModal
        open={!!editTarget}
        ruang={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={simpanEdit}
      />
    </div>
  );
};

export default KelolaFasilitasPage;
