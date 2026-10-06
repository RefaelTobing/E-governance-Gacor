import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Plus, Upload, AlertTriangle } from 'lucide-react';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton, Input, SearchInput } from '../../../components';
import {
  STATUS_FASILITAS,
  getAllFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
  getFacilityOptions,
  importFacilitiesCsv,
  cariRuangPublik,
} from '../../../services/fasilitasService';

const FORM_KOSONG = {
  ruangPublikId: '',
  ruangPublikNama: '',
  nama: '',
  kategori: '',
  status: 'baik',
  deskripsi: '',
};

const gayaLabel = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '6px',
  color: 'var(--color-text-main)',
};

const gayaModal = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 1000,
};

export const KelolaFasilitasPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [pencarian, setPencarian] = useState('');

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saran, setSaran] = useState([]);
  const [saranDipilih, setSaranDipilih] = useState(false);
  const [kategoriOpsi, setKategoriOpsi] = useState([]);

  const [fileImpor, setFileImpor] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [imporError, setImporError] = useState('');
  const [imporHasil, setImporHasil] = useState(null);

  const muatUlang = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      setFacilities(await getAllFacilities());
    } catch (err) {
      setErrorMsg(err.message || 'Data fasilitas gagal dimuat dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    muatUlang();
    getFacilityOptions()
      .then((opsi) => {
        const unik = [...new Set(opsi.map((o) => o.kategori).filter(Boolean))];
        setKategoriOpsi(unik);
      })
      .catch(() => setKategoriOpsi([]));
  }, []);

  // Saran ruang publik hanya untuk form Tambah, dan hanya saat admin mengetik.
  useEffect(() => {
    if (modal !== 'tambah' || saranDipilih) {
      setSaran([]);
      return undefined;
    }
    const teks = form.ruangPublikNama.trim();
    if (teks.length < 2) {
      setSaran([]);
      return undefined;
    }
    const jeda = setTimeout(async () => {
      try {
        setSaran(await cariRuangPublik(teks, 8));
      } catch (err) {
        setSaran([]);
      }
    }, 300);
    return () => clearTimeout(jeda);
  }, [modal, form.ruangPublikNama, saranDipilih]);

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
    setForm(FORM_KOSONG);
    setEditingId(null);
    setFormError('');
    setSaran([]);
    setSaranDipilih(false);
    setFileImpor(null);
    setImporError('');
    setImporHasil(null);
  };

  const tertampil = useMemo(() => {
    const q = pencarian.trim().toLowerCase();
    if (!q) return facilities;
    return facilities.filter((f) =>
      [f.nama, f.ruangPublikNama, f.kategori, f.wilayah]
        .some((nilai) => (nilai || '').toLowerCase().includes(q))
    );
  }, [facilities, pencarian]);

  const bukaTambah = () => {
    setForm(FORM_KOSONG);
    setFormError('');
    setSaran([]);
    setSaranDipilih(false);
    setModal('tambah');
  };

  const bukaEdit = (fas) => {
    setForm({
      ruangPublikId: fas.ruangPublikId,
      ruangPublikNama: fas.ruangPublikNama,
      nama: fas.nama,
      kategori: fas.kategori || '',
      status: fas.status || 'baik',
      deskripsi: fas.deskripsi || '',
    });
    setEditingId(fas.id);
    setFormError('');
    setModal('edit');
  };

  const simpanForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.nama.trim()) {
      setFormError('Nama fasilitas wajib diisi.');
      return;
    }
    if (modal === 'tambah' && !form.ruangPublikId) {
      setFormError('Pilih ruang publik dari daftar saran sebelum menyimpan.');
      return;
    }

    setIsSaving(true);
    try {
      if (modal === 'edit') {
        await updateFacility(editingId, form);
      } else {
        await createFacility(form);
      }
      tutupModal();
      muatUlang();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan fasilitas.');
    } finally {
      setIsSaving(false);
    }
  };

  const hapus = async (fas) => {
    if (!window.confirm(`Hapus fasilitas "${fas.nama}"? Data yang dihapus tidak bisa dikembalikan.`)) {
      return;
    }
    try {
      await deleteFacility(fas.id);
      muatUlang();
    } catch (err) {
      window.alert(err.message || 'Fasilitas gagal dihapus.');
    }
  };

  const impor = async (e) => {
    e.preventDefault();
    if (!fileImpor) {
      setImporError('Pilih dulu berkas CSV yang akan diimpor.');
      return;
    }
    setIsImporting(true);
    setImporError('');
    try {
      const hasil = await importFacilitiesCsv(fileImpor);
      setImporHasil(hasil);
      muatUlang();
    } catch (err) {
      setImporError(err.message || 'Berkas gagal diimpor.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            DATA MASTER • KELOLA FASILITAS
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Kelola Fasilitas Ruang Publik</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Daftar fasilitas terdata di seluruh lokasi ruang terbuka DKI Jakarta.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => setModal('impor')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Upload size={16} /> Impor CSV
          </Button>
          <Button variant="primary" size="sm" onClick={bukaTambah} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> Tambah Fasilitas Baru
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
        <div style={{ flex: '1 1 280px', maxWidth: '420px' }}>
          <SearchInput
            placeholder="Cari nama fasilitas atau ruang publik..."
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
          />
        </div>
        {!isLoading && !errorMsg && facilities.length > 0 && (
          <span className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            {tertampil.length === facilities.length
              ? `${facilities.length} fasilitas terdata`
              : `${tertampil.length} dari ${facilities.length} fasilitas cocok dengan pencarian`}
          </span>
        )}
      </div>

      <Card>
        <CardBody>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>FASILITAS</th>
                  <th style={{ padding: '12px' }}>RUANG PUBLIK</th>
                  <th style={{ padding: '12px' }}>KATEGORI</th>
                  <th style={{ padding: '12px' }}>STATUS KONDISI</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={`skeleton-fas-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="140px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="120px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="80px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="90px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : errorMsg ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        icon={<AlertTriangle size={24} color="#0F766E" />}
                        title="Data fasilitas gagal dimuat"
                        description={errorMsg}
                        actionLabel="Coba lagi"
                        onAction={muatUlang}
                      />
                    </td>
                  </tr>
                ) : tertampil.length > 0 ? (
                  tertampil.map((fas) => (
                    <tr key={fas.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{fas.nama}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--color-text-muted)" /> {fas.ruangPublikNama}
                        </span>
                        {fas.wilayah && (
                          <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{fas.wilayah}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>{fas.kategori ? <span className="badge badge-info">{fas.kategori}</span> : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}</td>
                      <td style={{ padding: '12px' }}><StatusBadge status={fas.status} /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button variant="outline" size="sm" onClick={() => bukaEdit(fas)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => hapus(fas)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title={pencarian.trim() ? 'Tidak ada yang cocok' : 'Belum ada fasilitas terdata'}
                        description={
                          pencarian.trim()
                            ? `Tidak ada fasilitas yang mengandung "${pencarian.trim()}". Coba kata kunci lain.`
                            : 'Belum ada satu pun fasilitas tercatat. Tambahkan satu per satu lewat tombol Tambah Fasilitas Baru, atau impor sekaligus dari berkas CSV.'
                        }
                        actionLabel={pencarian.trim() ? undefined : 'Tambah Fasilitas'}
                        onAction={pencarian.trim() ? undefined : bukaTambah}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {(modal === 'tambah' || modal === 'edit') && (
        <div style={gayaModal} role="dialog" aria-modal="true" aria-label={modal === 'edit' ? 'Edit fasilitas' : 'Tambah fasilitas'}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>{modal === 'edit' ? 'Edit Fasilitas' : 'Tambah Fasilitas Baru'}</h3>
            {formError && <div role="alert" style={{ color: 'var(--color-danger)', marginBottom: '12px', fontSize: '13px' }}>{formError}</div>}

            <form onSubmit={simpanForm}>
              {modal === 'tambah' ? (
                <div style={{ marginBottom: '12px', position: 'relative' }}>
                  <label style={gayaLabel} htmlFor="fas-ruang-publik">Ruang Publik <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    id="fas-ruang-publik"
                    className="form-input"
                    value={form.ruangPublikNama}
                    onChange={(e) => {
                      setForm({ ...form, ruangPublikNama: e.target.value, ruangPublikId: '' });
                      setSaranDipilih(false);
                    }}
                    placeholder="Ketik nama taman atau ruang publik"
                    autoComplete="off"
                    required
                  />
                  {saran.length > 0 && (
                    <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', maxHeight: '220px', overflowY: 'auto', zIndex: 10, listStyle: 'none', padding: 0 }}>
                      {saran.map((rp) => (
                        <li key={rp.id}>
                          <button
                            type="button"
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '13px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
                            onClick={() => {
                              setForm({ ...form, ruangPublikId: rp.id, ruangPublikNama: rp.nama });
                              setSaran([]);
                              setSaranDipilih(true);
                            }}
                          >
                            {rp.nama}
                            {rp.wilayah && <span style={{ color: 'var(--color-text-muted)' }}> • {rp.wilayah}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {form.ruangPublikId && (
                    <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                      Induk terpilih: {form.ruangPublikNama}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '12px' }}>
                  <span style={gayaLabel}>Ruang Publik</span>
                  <div className="form-input" style={{ backgroundColor: 'var(--color-bg-main)', color: 'var(--color-text-muted)' }}>
                    {form.ruangPublikNama}
                  </div>
                </div>
              )}

              <Input
                id="fas-nama"
                name="fas-nama"
                label="Nama Fasilitas"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="mis. Toilet Umum"
                required
              />

              <div style={{ marginBottom: '12px' }}>
                <label style={gayaLabel} htmlFor="fas-kategori">Kategori</label>
                <input
                  id="fas-kategori"
                  className="form-input"
                  list="fas-kategori-opsi"
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  placeholder="mis. Sanitasi, Penerangan, Perabot"
                />
                <datalist id="fas-kategori-opsi">
                  {kategoriOpsi.map((kat) => <option key={kat} value={kat} />)}
                </datalist>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={gayaLabel} htmlFor="fas-status">Status Kondisi</label>
                <select
                  id="fas-status"
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_FASILITAS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={gayaLabel} htmlFor="fas-deskripsi">Deskripsi</label>
                <textarea
                  id="fas-deskripsi"
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

      {modal === 'impor' && (
        <div style={gayaModal} role="dialog" aria-modal="true" aria-label="Impor fasilitas dari CSV">
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', width: '520px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '8px' }}>Impor Fasilitas dari CSV</h3>
            <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Satu baris untuk satu fasilitas. Baris yang gagal divalidasi dilewati dan
              dilaporkan satu per satu, tanpa membatalkan baris yang benar.
            </p>

            {imporHasil ? (
              <div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '12px', fontSize: '13px' }}>
                  <strong>{imporHasil.created}</strong> fasilitas ditambahkan.
                  {imporHasil.failed > 0 && (
                    <> <strong>{imporHasil.failed}</strong> baris dilewati.</>
                  )}
                </div>
                {imporHasil.errors.length > 0 && (
                  <ul style={{ marginBottom: '16px', paddingLeft: '18px', fontSize: '13px', color: 'var(--color-danger)', maxHeight: '220px', overflowY: 'auto' }}>
                    {imporHasil.errors.map((err) => (
                      <li key={`${err.baris}-${err.pesan}`}>Baris {err.baris}: {err.pesan}</li>
                    ))}
                  </ul>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button variant="outline" size="sm" onClick={() => { setImporHasil(null); setFileImpor(null); }}>
                    Impor berkas lain
                  </Button>
                  <Button variant="primary" size="sm" onClick={tutupModal}>Selesai</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={impor}>
                {imporError && <div role="alert" style={{ color: 'var(--color-danger)', marginBottom: '12px', fontSize: '13px' }}>{imporError}</div>}

                <div style={{ marginBottom: '12px' }}>
                  <label style={gayaLabel} htmlFor="fas-csv">Berkas CSV</label>
                  <input
                    id="fas-csv"
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      setFileImpor(e.target.files?.[0] || null);
                      setImporError('');
                    }}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div style={{ backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  <p style={{ marginBottom: '6px' }}>Kolom wajib: <strong>nama</strong>, dan salah satu dari <strong>ruang_publik_id</strong> atau <strong>ruang_publik_nama</strong>.</p>
                  <p style={{ marginBottom: 0 }}>Kolom opsional: <strong>kategori</strong>, <strong>status</strong> (baik, perlu_perhatian, rusak), <strong>deskripsi</strong>. Maksimal 2000 baris per berkas.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button type="button" variant="outline" size="sm" onClick={tutupModal}>Batal</Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isImporting}>
                    {isImporting ? 'Mengimpor...' : 'Unggah dan Impor'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaFasilitasPage;
