import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, SelectDropdown, Skeleton } from '../../../components';
import { getPublicSpaceDetail, getPublicSpaces, getPublicSpacesStats } from '../../../services/ruangPublikService';
import { STANDAR_FASILITAS } from '../../../utils/standarFasilitas';

const hitungStandar = (rows = []) => {
  const nama = new Set(rows.map((row) => row.nama.trim().toLowerCase()));
  return STANDAR_FASILITAS.filter((item) => nama.has(item.toLowerCase())).length;
};

const PAGE_SIZES = [10, 20, 50, 100];

export const KelolaFasilitasPage = () => {
  const navigate = useNavigate();
  const [ruangPublik, setRuangPublik] = useState([]);
  const [jumlahTotal, setJumlahTotal] = useState(0);
  const [pencarian, setPencarian] = useState('');
  const [ukuranHalaman, setUkuranHalaman] = useState(10);
  const [halaman, setHalaman] = useState(1);
  const [jumlahFasilitas, setJumlahFasilitas] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const muatData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const skip = (halaman - 1) * ukuranHalaman;
      const [ruang, stats] = await Promise.all([
        getPublicSpaces({ q: pencarian.trim() || undefined, skip, limit: ukuranHalaman }),
        getPublicSpacesStats({ q: pencarian.trim() || undefined }),
      ]);
      const detail = await Promise.all(ruang.map((item) => getPublicSpaceDetail(item.id)));
      const hitungan = {};
      detail.forEach((item) => {
        if (item) hitungan[item.id] = hitungStandar(item.fasilitas || []);
      });
      setRuangPublik(ruang);
      setJumlahFasilitas(hitungan);
      setJumlahTotal(stats.totalTerdata || 0);
    } catch (err) {
      setError(err.message || 'Data ruang publik gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    muatData();
  }, [halaman, ukuranHalaman, pencarian]);

  const jumlahHalaman = Math.max(1, Math.ceil(jumlahTotal / ukuranHalaman));

  const ubahPencarian = (value) => {
    setPencarian(value);
    setHalaman(1);
  };

  const ubahUkuran = (value) => {
    setUkuranHalaman(Number(value));
    setHalaman(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            DATA MASTER • KETERANGAN RUANG TERBUKA
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Kelola Fasilitas</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Pilih satu ruang publik untuk melihat dan mengatur 12 fasilitas standarnya.
          </p>
        </div>
        <div className="text-small" style={{ color: 'var(--color-text-muted)' }}>
          {isLoading ? 'Memuat ruang publik...' : `${jumlahTotal} ruang publik`}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', maxWidth: '460px' }}>
        <Search size={18} color="var(--color-text-muted)" aria-hidden="true" />
        <input
          className="form-input"
          value={pencarian}
          onChange={(e) => ubahPencarian(e.target.value)}
          placeholder="Cari nama ruang publik atau wilayah..."
          aria-label="Cari ruang publik"
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {[1, 2, 3].map((n) => <Skeleton key={`ruang-sk-${n}`} height="82px" />)}
        </div>
      ) : error ? (
        <EmptyState title="Data gagal dimuat" description={error} actionLabel="Coba lagi" onAction={muatData} />
      ) : ruangPublik.length === 0 ? (
        <EmptyState
          title={pencarian ? 'Ruang publik tidak ditemukan' : 'Belum ada ruang publik'}
          description={pencarian ? 'Coba gunakan kata kunci lain.' : 'Belum ada data ruang publik yang dapat dikelola.'}
          actionLabel={pencarian ? 'Reset pencarian' : undefined}
          onAction={pencarian ? () => ubahPencarian('') : undefined}
        />
      ) : (
        <Card className="card-kelola-fasilitas">
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>RUANG PUBLIK</th>
                    <th style={{ padding: '12px' }}>WILAYAH</th>
                    <th style={{ padding: '12px' }}>FASILITAS STANDAR</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {ruangPublik.map((ruang) => {
                    const jumlah = jumlahFasilitas[ruang.id] || 0;
                    return (
                      <tr key={ruang.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px 12px', minWidth: '260px' }}>
                          <strong style={{ display: 'block' }}>{ruang.nama}</strong>
                          <span className="text-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <MapPin size={12} /> {ruang.alamat || 'Alamat belum tersedia'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>{ruang.wilayah || '-'}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span className={`badge ${jumlah === STANDAR_FASILITAS.length ? 'badge-success' : jumlah > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                            {jumlah}/{STANDAR_FASILITAS.length} tersedia
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="btn-rounded-accent"
                            onClick={() => navigate(`/dashboard/fasilitas/${ruang.id}`)}
                          >
                            Lihat Fasilitas
                          </Button>
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
    </div>
  );
};

export default KelolaFasilitasPage;
