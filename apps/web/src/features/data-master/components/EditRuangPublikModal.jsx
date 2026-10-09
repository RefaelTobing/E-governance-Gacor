import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, Info } from 'lucide-react';
import { Button, Input, Modal } from '../../../components';
import { getCategories } from '../../../services/categoryService';

// Field teks sederhana yang dipetakan ke kolom snake_case backend.
const FIELD_TEKS = [
  { key: 'nama', label: 'Nama Ruang Publik', kolom: 'nama', required: true },
  { key: 'wilayah', label: 'Wilayah', kolom: 'wilayah' },
  { key: 'kecamatan', label: 'Kecamatan', kolom: 'kecamatan' },
  { key: 'kelurahan', label: 'Kelurahan', kolom: 'kelurahan' },
  { key: 'alamat', label: 'Alamat', kolom: 'alamat' },
  { key: 'jamOperasional', label: 'Jam Operasional', kolom: 'jam_operasional' },
  { key: 'tiketMasuk', label: 'Tiket Masuk', kolom: 'tiket_masuk' },
  { key: 'aksesDisabilitas', label: 'Akses Disabilitas', kolom: 'akses_disabilitas' },
  { key: 'ramahHewan', label: 'Ramah Hewan', kolom: 'ramah_hewan' },
];

const LABEL_KOLOM = {
  nama: 'Nama',
  kategori_id: 'Kategori',
  wilayah: 'Wilayah',
  kecamatan: 'Kecamatan',
  kelurahan: 'Kelurahan',
  alamat: 'Alamat',
  deskripsi: 'Deskripsi',
  jam_operasional: 'Jam Operasional',
  tiket_masuk: 'Tiket Masuk',
  akses_disabilitas: 'Akses Disabilitas',
  ramah_hewan: 'Ramah Hewan',
  verified: 'Status Verifikasi',
  latitude: 'Latitude',
  longitude: 'Longitude',
};

/**
 * Modal edit manual satu ruang publik (FE-27 / BE-33).
 *
 * Hanya kolom yang BENAR-BENAR berubah yang dikirim ke backend, supaya
 * `field_source` (penanda edit manual FEAT-012) hanya menandai kolom yang
 * sungguh disunting — bukan seluruh baris.
 */
export const EditRuangPublikModal = ({ open, ruang, onClose, onSaved }) => {
  const [form, setForm] = useState({});
  const [kategoriOpsi, setKategoriOpsi] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [siap, setSiap] = useState(false);

  // Isi form dari baris yang dipilih + muat opsi kategori.
  useEffect(() => {
    if (!open || !ruang) {
      setSiap(false);
      return undefined;
    }
    setForm({
      nama: ruang.nama || '',
      kategoriId: ruang.kategoriId || '',
      wilayah: ruang.wilayah || '',
      kecamatan: ruang.kecamatan || '',
      kelurahan: ruang.kelurahan || '',
      alamat: ruang.alamat || '',
      deskripsi: ruang.deskripsi || '',
      jamOperasional: ruang.jamOperasional || '',
      tiketMasuk: ruang.tiketMasuk || '',
      aksesDisabilitas: ruang.aksesDisabilitas || '',
      ramahHewan: ruang.ramahHewan || '',
      verified: !!ruang.verified,
      latitude: ruang.latitude != null ? String(ruang.latitude) : '',
      longitude: ruang.longitude != null ? String(ruang.longitude) : '',
    });
    setErrorMsg('');
    setSiap(true);

    let isMounted = true;
    getCategories()
      .then((data) => {
        if (isMounted) setKategoriOpsi(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setKategoriOpsi([]);
      });

    return () => {
      isMounted = false;
    };
  }, [open, ruang]);

  const ubah = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // Bangun payload berisi HANYA kolom yang berubah (dibanding nilai asli).
  const hitungPerubahan = () => {
    const asli = {
      nama: ruang.nama || '',
      kategoriId: ruang.kategoriId || '',
      wilayah: ruang.wilayah || '',
      kecamatan: ruang.kecamatan || '',
      kelurahan: ruang.kelurahan || '',
      alamat: ruang.alamat || '',
      deskripsi: ruang.deskripsi || '',
      jamOperasional: ruang.jamOperasional || '',
      tiketMasuk: ruang.tiketMasuk || '',
      aksesDisabilitas: ruang.aksesDisabilitas || '',
      ramahHewan: ruang.ramahHewan || '',
      verified: !!ruang.verified,
      latitude: ruang.latitude != null ? String(ruang.latitude) : '',
      longitude: ruang.longitude != null ? String(ruang.longitude) : '',
    };

    const payload = {};
    const berubah = [];

    FIELD_TEKS.forEach(({ key, kolom }) => {
      const baru = (form[key] ?? '').trim();
      if (baru !== (asli[key] ?? '').trim()) {
        payload[kolom] = baru;
        berubah.push(kolom);
      }
    });

    const deskripsiBaru = (form.deskripsi ?? '').trim();
    if (deskripsiBaru !== (asli.deskripsi ?? '').trim()) {
      payload.deskripsi = deskripsiBaru;
      berubah.push('deskripsi');
    }

    if (form.kategoriId !== asli.kategoriId && form.kategoriId) {
      payload.kategori_id = form.kategoriId;
      berubah.push('kategori_id');
    }

    if (!!form.verified !== asli.verified) {
      payload.verified = !!form.verified;
      berubah.push('verified');
    }

    // Koordinat: kirim hanya bila berubah & terisi angka valid.
    ['latitude', 'longitude'].forEach((kolom) => {
      const baru = (form[kolom] ?? '').trim();
      if (baru !== (asli[kolom] ?? '').trim() && baru !== '') {
        payload[kolom] = Number(baru);
        berubah.push(kolom);
      }
    });

    return { payload, berubah };
  };

  const { berubah: previewBerubah } = siap && ruang ? hitungPerubahan() : { berubah: [] };

  const simpan = async () => {
    const { payload, berubah } = hitungPerubahan();

    if (!payload.nama && (form.nama ?? '').trim() === '') {
      setErrorMsg('Nama ruang publik wajib diisi.');
      return;
    }
    if (berubah.length === 0) {
      setErrorMsg('Belum ada perubahan untuk disimpan.');
      return;
    }
    // Validasi rentang koordinat di klien (backend juga memvalidasi -> 400).
    if ('latitude' in payload && !(-90 <= payload.latitude && payload.latitude <= 90)) {
      setErrorMsg('Latitude harus di antara -90 dan 90.');
      return;
    }
    if ('longitude' in payload && !(-180 <= payload.longitude && payload.longitude <= 180)) {
      setErrorMsg('Longitude harus di antara -180 dan 180.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await onSaved(payload);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!ruang) return null;

  return (
    <Modal
      open={open}
      onClose={isSaving ? () => {} : onClose}
      title={`Edit Data Master — ${ruang.nama}`}
      labelledBy="edit-master-title"
      maxWidth="640px"
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Nama (wajib) */}
        <Input
          label="Nama Ruang Publik"
          value={form.nama || ''}
          onChange={(e) => ubah('nama', e.target.value)}
          required
        />

        {/* Kategori */}
        <div className="form-group">
          <label className="form-label" htmlFor="edit-kategori">Kategori</label>
          <select
            id="edit-kategori"
            className="form-select"
            value={form.kategoriId || ''}
            onChange={(e) => ubah('kategoriId', e.target.value)}
          >
            <option value="">— Tidak diubah —</option>
            {kategoriOpsi.map((k) => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
        </div>

        {/* Field teks sederhana */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          {FIELD_TEKS.filter((f) => f.key !== 'nama').map((f) => (
            <Input
              key={f.key}
              label={f.label}
              value={form[f.key] || ''}
              onChange={(e) => ubah(f.key, e.target.value)}
            />
          ))}
        </div>

        {/* Deskripsi */}
        <div className="form-group">
          <label className="form-label" htmlFor="edit-deskripsi">Deskripsi</label>
          <textarea
            id="edit-deskripsi"
            className="form-textarea"
            rows={3}
            value={form.deskripsi || ''}
            onChange={(e) => ubah('deskripsi', e.target.value)}
          />
        </div>

        {/* Koordinat */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude || ''}
            onChange={(e) => ubah('latitude', e.target.value)}
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude || ''}
            onChange={(e) => ubah('longitude', e.target.value)}
          />
        </div>

        {/* Verified */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 16px', fontSize: '14px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!form.verified}
            onChange={(e) => ubah('verified', e.target.checked)}
          />
          Tandai sebagai aset terverifikasi Pemprov DKI
        </label>

        {/* Ringkasan kolom yang akan berubah */}
        <div style={{ backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}>
            <Info size={12} /> Kolom yang akan ditandai "diedit manual"
          </span>
          <div style={{ marginTop: '4px', color: 'var(--color-text-muted)' }}>
            {previewBerubah.length === 0
              ? 'Belum ada perubahan.'
              : previewBerubah.map((k) => LABEL_KOLOM[k] || k).join(', ')}
          </div>
        </div>

        {errorMsg && (
          <div role="alert" style={{ backgroundColor: 'var(--color-danger-light)', color: '#991B1B', padding: '10px 12px', borderRadius: 'var(--radius-md)', marginTop: '12px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
        <Button
          variant="primary"
          onClick={simpan}
          disabled={isSaving || previewBerubah.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Save size={16} /> {isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
      </div>
    </Modal>
  );
};

export default EditRuangPublikModal;
