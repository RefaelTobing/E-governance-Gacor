import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MENU_GROUPS from '../features/profil/menuConfig';

export const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const firstItemRef = useRef(null);

  const name = user?.name || 'Warga Jakarta';
  const initial = name.charAt(0).toUpperCase();
  const email = user?.email || '';

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    firstItemRef.current?.focus();

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        className="profile-dropdown-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Menu akun ${name}`}
      >
        <span className="profile-dropdown-avatar" aria-hidden="true">{initial}</span>
        <span className="profile-dropdown-trigger-name">{name}</span>
        <ChevronDown className={`profile-dropdown-chevron ${isOpen ? 'open' : ''}`} size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="profile-dropdown-panel">
          <Link to="/profil" className="profile-dropdown-identity" onClick={() => setIsOpen(false)}>
            <span className="profile-dropdown-avatar profile-dropdown-avatar-large" aria-hidden="true">{initial}</span>
            <span className="profile-dropdown-user-info">
              <span className="profile-dropdown-user-name">{name}</span>
              {email && <span className="profile-dropdown-email">{email}</span>}
              <span className="profile-dropdown-view-profile">Lihat profil</span>
            </span>
          </Link>

          <nav className="profile-dropdown-nav" aria-label="Menu akun">
            {MENU_GROUPS.map((group) => (
              <div className="profile-dropdown-group" key={group.label}>
                <span className="profile-dropdown-group-label">{group.label}</span>
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      ref={group.label === 'Kontribusi' && index === 0 ? firstItemRef : undefined}
                      to={item.to}
                      className="profile-dropdown-item"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="profile-dropdown-footer">
            <button type="button" className="profile-dropdown-logout" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
