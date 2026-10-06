import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleAlert, CircleX, Clock3, Pencil, Plus, X } from 'lucide-react';
import { Button, Card, CardBody, EmptyState, Skeleton } from '../../../components';
import { STANDAR_FASILITAS, STANDAR_FASILITAS_SET } from '../../../utils/standarFasilitas';
import {
  STATUS_FASILITAS,
  createFacility,
  updateFacility,
} from '../../../services/fasilitasService';

const gayaLabel = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '6px',
  color: 'var(--color-text-main)',
};

const gayaModal = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 1000,
};

const PILL_KEADAAN = {
  baik: { kelas: 'badge badge-success', label: 'Tersedia', warna: 'var(--color-success)' },
  perlu_perhatian: { kelas: 'badge badge-warning', label: 'Perlu Perhatian', warna: 'var(--color-warning)' },
  rusak: { kelas: 'badge badge-danger', label: 'Rusak', warna: 'var(--color-danger)' },
  kosong: { kelas: 'badge badge-neutral', label: 'Belum tersedia', warna: 'var(--color-text-muted)' },
};

const ikonKeadaan = (status) => {
  if (status === 'baik') return <CheckCircle2 size={16} color={PILL_KEADAAN.baik.warna} />;
  if (status === 'perlu_perhatian') return <Clock3 size={16} color={PILL_KEADAAN.perlu_perhatian.warna} />;
  if (status === 'rusak') return <CircleX size={16} color={PILL_KEADAAN.rusak.warna} />;
  return <CircleAlert size={16} color={PILL_KEADAAN.kosong.warna} />;
};

/**
 * Halaman keterangan 12 fasilitas standar milik satu ruang publik.
 *
 * Baris memakai pil status sesuai data: hijau tersedia, kuning perlu
 * perhatian, merah rusak, abu-abu belum tersedia. Fasilitas lama di luar
 * standar tetap tampil terpisah supaya data existing tidak hilang.
 */
export const DetailFasilitasRuangPublik = ({ ruangPublik, fasilitas, isLoading, onRefresh }) => {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nama: '', status: 'baik', deskripsi: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!modal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') tutupModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const tutupModal = () => {
    setModal(null);
    setForm({ nama: '', status: 'baik', deskripsi: '' });
    setFormError('');
  };

  const standarTerisi = useMemo(() => {
    const peta = {};
    (fasilitas || []).forEach((f) => {
      peta[f.nama.trim().toLowerCase()] = f;
    });
    return STANDAR_FASILITAS.map((nama) => ({
      nama,
      fasilitas: peta[nama.trim().toLowerCase()] || null,
    }));
  }, [fasilitas]);

  const lainnya = useMemo(() => {
    return (fasilitas || []).filter(
      (f) => !STANDAR_FASILITAS_SET.has(f.nama.trim().toLowerCase())
    );
  }, [fasilitas]);

  const bukaTambah = (namaStandar) => {
    setForm({ nama: namaStandar || '', status: 'baik', deskripsi: '' });
    setFormError('');
    setModal('tambah');
  };

  const bukaEdit = (row) => {
    if (!row.fasilitas) {
      bukaTambah(row.nama);
      return;
    }
    setForm({
      nama: row.nama,
      status: row.fasilitas.status || 'baik',
      deskripsi: row.fasilitas.deskripsi || '',
    });
    setFormError('');
    setModal(row.fasilitas.id);
  };

  const simpan = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.nama.trim()) {
      setFormError('Nama fasilitas wajib diisi.');
      return;
    }
    setIsSaving(true);
    try {
      if (modal === 'tambah') {
        await createFacility({ ...form, ruangPublikId: ruangPublik.id, kategori: 'Standar' });
      } else {
        await updateFacility(modal, form);
      }
      tutupModal();
      onRefresh?.();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan fasilitas.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton height="24px" width="260px" style={{ marginBottom: '12px' }} />
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={`sk-${n}`} height="56px" style={{ marginBottom: '8px' }} />
        ))}
      </div>
    );
  }

  if (!ruangPublik) {
    return (
      <EmptyState
        title="Ruang Publik Tidak Ditemukan"
        description="Data ruang publik yang Anda cari tidak tersedia atau ID tidak valid."
        actionLabel="Kembali ke Kelola Fasilitas"
        onAction={() => navigate('/dashboard/fasilitas')}
      />
    );
  }

  const jumlahTersedia = standarTerisi.filter((row) => row.fasilitas).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/dashboard/fasilitas')}
        className="text-small"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px 0', marginBottom: '12px' }}
      >
        <ArrowLeft size={14} /> Kelola Fasilitas
      </button>

      <h1 className="text-display" style={{ marginTop: '2px' }}>{ruangPublik.nama}</h1>
      <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
        {ruangPublik.wilayah || 'Wilayah belum tersedia'}
        {' • '}
        {jumlahTersedia} dari {STANDAR_FASILITAS.length} fasilitas standar terdata
      </p>

      <div style={{ marginTop: 'var(--space-xl)' }}>
        <Card>
          <CardBody style={{ padding: 0 }}>
              <div style={{ padding: '20px 16px 24px' }}>
                <h3 className="h3" style={{ fontSize: '18px', marginBottom: '6px' }}>Standar Fasilitas</h3>
                <p className="text-caption" style={{ margin: 0 }}>Status keberadaan setiap fasilitas baku di ruang ini.</p>
              </div>
            <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
              {standarTerisi.map((row) => {
                const keadaan = PILL_KEADAAN[row.fasilitas ? (row.fasilitas.status || 'baik') : 'kosong'];
                return (
                  <div
                    key={row.nama}
                    role="listitem"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '1 1 220px' }}>
                      {ikonKeadaan(row.fasilitas ? (row.fasilitas.status || 'baik') : 'kosong')}
                      <span className="text-small" style={{ fontWeight: 600 }}>{row.nama}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={keadaan.kelas}>{keadaan.label}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="btn-rounded-accent"
                        onClick={() => bukaEdit(row)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {row.fasilitas ? <Pencil size={13} /> : <Plus size={13} />}
                        {row.fasilitas ? 'Ubah' : 'Tambah'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {lainnya.length > 0 && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <Card>
            <CardBody style={{ padding: 0 }}>
              <div style={{ padding: '16px 16px 0' }}>
                <h3 className="h3" style={{ fontSize: '18px' }}>Fasilitas Lainnya</h3>
                <p className="text-caption">Fasilitas di luar daftar standar yang sudah terdata.</p>
              </div>
              <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
                {lainnya.map((f) => {
                  const keadaan = PILL_KEADAAN[f.status || 'baik'];
                  return (
                    <div
                      key={f.id}
                      role="listitem"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '1 1 220px' }}>
                        {ikonKeadaan(f.status || 'baik')}
                        <span className="text-small" style={{ fontWeight: 600 }}>{f.nama}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={keadaan.kelas}>{keadaan.label}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="btn-rounded-accent"
                          onClick={() => {
                            setForm({ nama: f.nama, status: f.status || 'baik', deskripsi: f.deskripsi || '' });
                            setFormError('');
                            setModal(f.id);
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Pencil size={13} /> Ubah
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {modal && (
        <div style={gayaModal} role="dialog" aria-modal="true" aria-label="Form fasilitas">
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', width: '440px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{modal === 'tambah' ? 'Tambah Fasilitas' : 'Ubah Fasilitas'}</h3>
              <button type="button" onClick={tutupModal} aria-label="Tutup" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>
            {formError && <div role="alert" style={{ color: 'var(--color-danger)', marginBottom: '12px', fontSize: '13px' }}>{formError}</div>}

            <form onSubmit={simpan}>
              <div style={{ marginBottom: '12px' }}>
                <label style={gayaLabel} htmlFor="f-nama">Nama Fasilitas</label>
                <input
                  id="f-nama"
                  className="form-input"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  readOnly={modal !== 'tambah'}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={gayaLabel} htmlFor="f-status">Status Kondisi</label>
                <select
                  id="f-status"
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_FASILITAS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={gayaLabel} htmlFor="f-deskripsi">Deskripsi</label>
                <textarea
                  id="f-deskripsi"
                  className="form-textarea"
                  rows="3"
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Kondisi atau catatan singkat"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button type="button" variant="outline" size="sm" onClick={tutupModal}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailFasilitasRuangPublik;
