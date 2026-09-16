import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Logo — Komponen reusable untuk branding RuangTerbuka.
 * Menampilkan ikon/gambar LogoRuka.png beserta teks branding 2 baris rapi.
 *
 * Props:
 * @param {'sm' | 'md' | 'lg'} size - Ukuran logo (default: 'md')
 * @param {string} subtitle - Teks subtitle di bawah nama brand (default: 'JAKARTA')
 * @param {string} to - Link tujuan (default: '/home')
 * @param {boolean} asLink - Jika true, logo dibungkus Link. (default: true)
 * @param {boolean} showSubtitle - Tampilkan subtitle? (default: true)
 * @param {object} style - Style tambahan untuk wrapper
 * @param {string} className - Custom className
 */

const sizeConfig = {
  sm: { imgSize: 30, fontSize: '15px', subtitleSize: '9px', gap: '10px', subMarginTop: '2px' },
  md: { imgSize: 38, fontSize: '18px', subtitleSize: '10px', gap: '12px', subMarginTop: '2px' },
  lg: { imgSize: 48, fontSize: '24px', subtitleSize: '12px', gap: '14px', subMarginTop: '3px' },
};

export const Logo = ({
  size = 'md',
  subtitle = 'JAKARTA',
  to = '/home',
  asLink = true,
  showSubtitle = true,
  style = {},
  className = '',
}) => {
  const config = sizeConfig[size] || sizeConfig.md;

  const content = (
    <div
      className={`logo-component ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: config.gap,
        textDecoration: 'none',
        ...style,
      }}
    >
      <img
        src="/LogoRuka.png"
        alt="Logo RuangTerbuka"
        style={{
          width: `${config.imgSize}px`,
          height: `${config.imgSize}px`,
          objectFit: 'contain',
          borderRadius: 'var(--radius-sm, 6px)',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          lineHeight: 1.15,
        }}
      >
        {/* Baris 1: Ruang (Slate 900) + Terbuka (Teal #0F766E) */}
        <span
          style={{
            fontSize: config.fontSize,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1.15,
          }}
        >
          <span style={{ color: '#0F172A' }}>Ruang</span>
          <span style={{ color: '#0F766E' }}>Terbuka</span>
        </span>

        {/* Baris 2: Sub-teks JAKARTA */}
        {showSubtitle && subtitle && (
          <span
            style={{
              fontSize: config.subtitleSize,
              color: '#64748B',
              fontWeight: 700,
              marginTop: config.subMarginTop,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link
        to={to}
        className="navbar-brand"
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          marginRight: '8px',
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
