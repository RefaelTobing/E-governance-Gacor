import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useProfil } from '../../../context/ProfilContext';

const OPSI_TEMA = [
  { key: 'light', label: 'Mode Terang', desc: 'Tampilan cerah untuk siang hari.', icon: Sun },
  { key: 'dark', label: 'Mode Gelap', desc: 'Tampilan gelap untuk mengurangi silau.', icon: Moon },
  { key: 'system', label: 'Ikuti Sistem', desc: 'Mengikuti pengaturan perangkat Anda.', icon: Monitor },
];

export const PengaturanTemaPage = () => {
  const { theme, setTheme } = useProfil();

  return (
    <div className="container" style={{ maxWidth: '820px', padding: 0 }}>
      <div className="profil-section-head">
        <h2 className="h2">Pengaturan Tema</h2>
      </div>

      <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>
        Pilih tampilan aplikasi sesuai kenyamanan mata Anda.
      </p>

      <div className="profil-theme-grid">
        {OPSI_TEMA.map((opsi) => {
          const Icon = opsi.icon;
          const aktif = theme === opsi.key;

          return (
            <button
              key={opsi.key}
              type="button"
              className={`profil-theme-card ${aktif ? 'active' : ''}`}
              onClick={() => setTheme(opsi.key)}
              aria-pressed={aktif}
            >
              <div className="profil-theme-icon">
                <Icon size={24} aria-hidden="true" />
              </div>
              <div className="profil-theme-text">
                <span className="profil-theme-label">{opsi.label}</span>
                <span className="profil-theme-desc">{opsi.desc}</span>
              </div>
              {aktif && <span className="profil-theme-check" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PengaturanTemaPage;
