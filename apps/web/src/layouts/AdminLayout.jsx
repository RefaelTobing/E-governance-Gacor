import React from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Trees,
  HardHat,
  User,
  LogOut,
  Globe,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-main)' }}>
      {/* SIDEBAR ADMIN */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40
        }}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size="md" to="/dashboard" subtitle="Halaman Admin" />
          </div>

          {/* Navigation Links */}
          <div style={{ padding: '16px 12px' }}>
            <span className="text-caption" style={{ fontWeight: 700, padding: '0 12px 8px', display: 'block', color: 'var(--color-text-muted)' }}>
              ADMINISTRASI
            </span>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <NavLink
                to="/dashboard/moderasi"
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <ClipboardList size={18} /> Daftar Laporan
              </NavLink>
              <NavLink
                to="/dashboard/fasilitas"
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Trees size={18} /> Kelola Fasilitas
              </NavLink>
              <NavLink
                to="/dashboard/petugas"
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <HardHat size={18} /> Petugas Lapangan
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer User Profile */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <User size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Drs. H. Hendra M.'}
              </div>
              <span className="text-caption" style={{ display: 'block' }}>Pengawas Distrik</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login-pemerintah');
            }}
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-main)',
              color: 'var(--color-danger)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} /> Keluar Admin
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          <div className="text-small" style={{ fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={16} color="var(--color-primary)" /> DISTRIK TERPADU • WILAYAH DKI JAKARTA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-success">● Petugas Operasional</span>
            <Link to="/home" target="_blank" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={14} /> Lihat Situs Publik <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Outlet Content */}
        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .admin-nav-item:hover {
          background-color: var(--color-bg-main);
          color: var(--color-primary);
        }
        .admin-nav-item.active {
          background-color: var(--color-primary);
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
