import React, { useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Bookmark,
  SquarePen,
  Palette,
  Lock,
  CircleHelp,
  LogOut,
  X,
  Home,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../../components/Logo';

const MENU_GROUPS = [
  {
    label: 'Kontribusi',
    items: [
      { to: '/profil', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/profil/laporan', label: 'Laporan Saya', icon: ClipboardList, end: false },
      { to: '/profil/tersimpan', label: 'Ruang Disimpan', icon: Bookmark, end: false },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { to: '/profil/edit', label: 'Edit Profil', icon: SquarePen, end: false },
      { to: '/profil/tema', label: 'Pengaturan Tema', icon: Palette, end: false },
      { to: '/profil/keamanan', label: 'Keamanan', icon: Lock, end: false },
    ],
  },
  {
    label: 'Bantuan',
    items: [
      { to: '/profil/bantuan', label: 'FAQ & Bantuan', icon: CircleHelp, end: false },
    ],
  },
];

export const AkunSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const logoutButtonRef = useRef(null);

  // Tutup drawer dengan tombol Escape, tapi jangan mencuri fokus dari elemen lain.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'W';
  const nama = user?.name || 'Warga Jakarta';
  const email = user?.email || '-';

  const sidebarContent = (
    <div
      ref={sidebarRef}
      className="akun-sidebar"
      role="navigation"
      aria-label="Navigasi Akun Warga"
    >
      {/* Header brand */}
      <div className="akun-sidebar-header">
        <Logo size="sm" to="/home" subtitle="PORTAL WARGA" />
        <button
          type="button"
          className="akun-sidebar-close"
          onClick={onClose}
          aria-label="Tutup menu akun"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mini profil */}
      <div className="akun-mini-profil">
        <div className="akun-avatar" aria-hidden="true">{inisial}</div>
        <div className="akun-mini-info">
          <span className="akun-mini-nama">{nama}</span>
          <span className="akun-mini-email">{email}</span>
        </div>
      </div>

      {/* Grup menu */}
      <nav className="akun-menu">
        {MENU_GROUPS.map((group) => (
          <div key={group.label} className="akun-menu-group">
            <span className="akun-menu-label">{group.label}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `akun-menu-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon size={18} aria-hidden="true" /> {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: logout terpin di bawah */}
      <div className="akun-sidebar-footer">
        <Link to="/home" className="akun-menu-item" onClick={onClose}>
          <Home size={18} aria-hidden="true" /> Kembali ke Beranda
        </Link>
        <button
          ref={logoutButtonRef}
          type="button"
          className="akun-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} aria-hidden="true" /> Keluar Akun
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Drawer mobile: backdrop + slide-over */}
      <div
        className={`akun-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`akun-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Menu akun warga"
        aria-hidden={!isOpen}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar permanen untuk desktop */}
      <aside className="akun-sidebar-desktop" aria-label="Menu akun warga">
        {sidebarContent}
      </aside>
    </>
  );
};

export default AkunSidebar;
