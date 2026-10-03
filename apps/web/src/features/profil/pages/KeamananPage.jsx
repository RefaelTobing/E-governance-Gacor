import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const KeamananPage = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const validate = () => {
    const next = {};
    if (!form.currentPassword) {
      next.currentPassword = 'Kata sandi saat ini wajib diisi.';
    }
    if (!form.newPassword) {
      next.newPassword = 'Kata sandi baru wajib diisi.';
    } else if (form.newPassword.length < 8) {
      next.newPassword = 'Kata sandi minimal 8 karakter.';
    }
    if (form.newPassword !== form.confirmPassword) {
      next.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
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

    // TODO: backend saat ini belum memiliki endpoint self-update password warga.
    // Diberi catatan jujur untuk MVP.
    setSaved(true);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: 0 }}>
      <div className="profil-section-head">
        <h2 className="h2">Keamanan & Kata Sandi</h2>
      </div>

      <form className="profil-form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="pass-current">Kata Sandi Saat Ini</label>
            <button
              type="button"
              className="profil-show-pass"
              onClick={() => setShowPass((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />} {showPass ? 'Sembunyikan' : 'Lihat'} Sandi
            </button>
          </div>
          <input
            id="pass-current"
            className="form-input"
            type={showPass ? 'text' : 'password'}
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder="••••••••"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={errors.currentPassword ? 'err-current' : undefined}
          />
          {errors.currentPassword && (
            <span id="err-current" className="profil-form-error">{errors.currentPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pass-new">Kata Sandi Baru</label>
          <input
            id="pass-new"
            className="form-input"
            type={showPass ? 'text' : 'password'}
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Min. 8 karakter"
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? 'err-new' : undefined}
          />
          {errors.newPassword && (
            <span id="err-new" className="profil-form-error">{errors.newPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pass-confirm">Konfirmasi Kata Sandi Baru</label>
          <input
            id="pass-confirm"
            className="form-input"
            type={showPass ? 'text' : 'password'}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Ulangi sandi baru"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'err-confirm' : undefined}
          />
          {errors.confirmPassword && (
            <span id="err-confirm" className="profil-form-error">{errors.confirmPassword}</span>
          )}
        </div>

        {saved && (
          <div className="profil-saved-notice" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Permintaan ubah sandi disimulasikan sukses (menunggu integrasi backend).</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full">
          <Lock size={16} aria-hidden="true" /> Perbarui Kata Sandi
        </button>

        <span className="text-caption" style={{ textAlign: 'center', display: 'block' }}>
          Sandi minimal 8 karakter kombinasi huruf dan angka.
        </span>
      </form>
    </div>
  );
};

export default KeamananPage;
