import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useProfil } from '../../../context/ProfilContext';

const KOTA_DKI = [
  'Jakarta Pusat',
  'Jakarta Utara',
  'Jakarta Barat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Kepulauan Seribu',
];

export const EditProfilPage = () => {
  const { user } = useAuth();
  const { localProfile, updateProfileData } = useProfil();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    wilayah: localProfile.wilayah || 'Jakarta Pusat',
    phone: localProfile.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Nama lengkap wajib diisi.';
    }
    if (form.phone && !/^[0-9+\-\s]{8,20}$/.test(form.phone.trim())) {
      next.phone = 'Nomor telepon 8 sampai 20 digit angka.';
    }
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    // TODO: backend belum menyediakan endpoint update profil warga.
    // Perubahan disimpan lokal di perangkat ini untuk MVP.
    updateProfileData({ wilayah: form.wilayah, phone: form.phone.trim() });
    setSaved(true);
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: 0 }}>
      <div className="profil-section-head">
        <h2 className="h2">Edit Profil</h2>
      </div>

      <form className="profil-form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="edit-nama">Nama Lengkap</label>
          <input
            id="edit-nama"
            className="form-input"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama lengkap Anda"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'error-nama' : undefined}
          />
          {errors.name && (
            <span id="error-nama" className="profil-form-error">{errors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-email">Email</label>
          <input
            id="edit-email"
            className="form-input"
            type="email"
            value={form.email}
            disabled
            readOnly
            aria-readonly="true"
            aria-describedby="email-note"
          />
          <span id="email-note" className="text-caption">
            Email tidak dapat diubah karena menjadi kunci akun Anda.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-wilayah">Wilayah Domisili</label>
          <select
            id="edit-wilayah"
            className="form-select"
            name="wilayah"
            value={form.wilayah}
            onChange={handleChange}
          >
            {KOTA_DKI.map((kota) => (
              <option key={kota} value={kota}>{kota}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-phone">Nomor Telepon (opsional)</label>
          <input
            id="edit-phone"
            className="form-input"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="08xxxxxxxxxx"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'error-phone' : undefined}
          />
          {errors.phone && (
            <span id="error-phone" className="profil-form-error">{errors.phone}</span>
          )}
        </div>

        {saved && (
          <div className="profil-saved-notice" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Perubahan profil berhasil disimpan di perangkat ini.</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full">
          <Save size={16} aria-hidden="true" /> Simpan Perubahan
        </button>

        <span className="text-caption" style={{ textAlign: 'center', display: 'block' }}>
          Data tambahan (wilayah, telepon) tersimpan lokal hingga backend tersedia.
        </span>
      </form>
    </div>
  );
};

export default EditProfilPage;
