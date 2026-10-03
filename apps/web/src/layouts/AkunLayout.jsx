import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AkunSidebar from '../features/profil/components/AkunSidebar';

const JUDUL_PER_RUTE = {
  '/profil': 'Dashboard Akun',
  '/profil/laporan': 'Laporan Saya',
  '/profil/tersimpan': 'Ruang Publik Disimpan',
  '/profil/edit': 'Edit Profil',
  '/profil/tema': 'Pengaturan Tema',
  '/profil/keamanan': 'Keamanan & Kata Sandi',
  '/profil/bantuan': 'FAQ & Bantuan',
};

export const AkunLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const judul = JUDUL_PER_RUTE[location.pathname] || 'Akun Warga';

  return (
    <div className="akun-shell">
      <AkunSidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <div className="akun-main">
        <header className="akun-topbar">
          <button
            type="button"
            className="akun-menu-toggle"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Buka menu akun"
            aria-expanded={isDrawerOpen}
          >
            <Menu size={18} aria-hidden="true" /> Menu
          </button>
          <span className="akun-topbar-judul">{judul}</span>
        </header>

        <main className="akun-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AkunLayout;
