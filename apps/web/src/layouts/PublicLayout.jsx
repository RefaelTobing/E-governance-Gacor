import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Logo from '../components/Logo';


export const PublicLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [showTentangModal, setShowTentangModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar Header */}
      <header className="public-navbar">
        <div className="container navbar-container">
          {/* Logo Branding */}
          <Logo size="md" to="/home" />

          {/* Navigation Menu */}
          <nav>
            <ul className="navbar-menu">
              <li>
                <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Beranda
                </NavLink>
              </li>
              <li>
                <NavLink to="/ruang-publik" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Ruang Publik
                </NavLink>
              </li>
              <li>
                <NavLink to="/laporan-saya" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Laporan Saya
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowTentangModal(true)}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Tentang
                </button>
              </li>
            </ul>
          </nav>

          {/* Auth Actions / User Badge */}
          <div className="navbar-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-bg-main)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <span className="text-small" style={{ fontWeight: 600 }}>{user.name || 'Warga Jakarta'}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Keluar
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Masuk</Button>
                </Link>
                <Link to="/login?mode=register">
                  <Button variant="outline" size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer Section */}
      <footer className="public-footer">
        <div className="container">
          <div className="footer-grid">
            {/* Brand & Description */}
            <div>
              <div className="footer-brand-title">
                <Logo size="sm" asLink={false} subtitle="Jakarta" showSubtitle={true} />
              </div>
              <p className="footer-desc">
                Platform resmi keterbukaan informasi, pemantauan fasilitas, dan partisipasi warga untuk taman kota dan ruang terbuka hijau di wilayah Provinsi DKI Jakarta.
              </p>
            </div>

            {/* Layanan Publik Links */}
            <div>
              <h4 className="footer-col-title">Layanan Publik</h4>
              <ul className="footer-links">
                <li><Link to="/ruang-publik" className="footer-link">Daftar Taman & RPTRA</Link></li>
                <li><Link to="/ruang-publik" className="footer-link">Pengaduan Fasilitas</Link></li>
                <li><a href="#komunitas" className="footer-link">Jadwal Kegiatan Komunitas</a></li>
                <li><a href="#izin" className="footer-link">Izin Pemanfaatan Ruang</a></li>
              </ul>
            </div>

            {/* Pemerintah Terkait Links */}
            <div>
              <h4 className="footer-col-title">Pemerintah Terkait</h4>
              <ul className="footer-links">
                <li><a href="https://jakarta.go.id" target="_blank" rel="noreferrer" className="footer-link">Portal Resmi Pemprov DKI</a></li>
                <li><a href="https://jaki.jakarta.go.id" target="_blank" rel="noreferrer" className="footer-link">JAKI (Jakarta Kini)</a></li>
                <li><a href="https://smartcity.jakarta.go.id" target="_blank" rel="noreferrer" className="footer-link">Jakarta Smart City</a></li>
                <li><a href="https://dinastaman.jakarta.go.id" target="_blank" rel="noreferrer" className="footer-link">Dinas Bina Marga DKI</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Copyright */}
          <div className="footer-bottom">
            <div>
              © 2025 Pemerintah Provinsi DKI Jakarta • RuangTerbuka. Hak Cipta Dilindungi.
            </div>
            <div className="footer-bottom-links">
              <a href="#privasi" className="footer-link">Kebijakan Privasi</a>
              <a href="#syarat" className="footer-link">Syarat & Ketentuan</a>
              <a href="#situs" className="footer-link">Peta Situs</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Tentang Platform (Modal Sederhana) */}
      {showTentangModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="h3">Tentang RuangTerbuka</h3>
              <button type="button" onClick={() => setShowTentangModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Tutup">
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>
            <p className="text-body" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              <strong>RuangTerbuka DKI Jakarta</strong> adalah platform direktori informasi ruang publik (taman kota, RTH, RPTRA) dan kanal pelaporan kondisi fasilitas kota berbasis keterbukaan informasi publik.
            </p>
            <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Platform ini dikembangkan untuk memudahkan warga menemukan ruang hijau terdekat dan berpartisipasi menjaga fasilitas publik demi kenyamanan bersama.
            </p>
            <div style={{ textAlign: 'right' }}>
              <Button variant="primary" onClick={() => setShowTentangModal(false)}>
                Tutup Info
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLayout;
