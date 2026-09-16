import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Logo — Komponen reusable untuk branding RuangTerbuka.
 * Menampilkan gambar LogoRuka.png beserta teks branding.
 *
 * Props:
 * @param {'sm' | 'md' | 'lg'} size - Ukuran logo (default: 'md')
 * @param {string} subtitle - Teks subtitle di bawah nama brand (default: 'DKI JAKARTA')
 * @param {string} to - Link tujuan (default: '/home')
 * @param {boolean} asLink - Jika true, logo dibungkus Link. (default: true)
 * @param {boolean} showSubtitle - Tampilkan subtitle? (default: true)
 * @param {object} style - Style tambahan untuk wrapper
 * @param {string} className - Custom className
 */

const sizeConfig = {
  sm: { imgSize: 28, fontSize: '14px', subtitleSize: '9px', gap: '8px', subtitleMarginTop: '-3px' },
  md: { imgSize: 36, fontSize: '16px', subtitleSize: '10px', gap: '10px', subtitleMarginTop: '-4px' },
  lg: { imgSize: 48, fontSize: '22px', subtitleSize: '12px', gap: '12px', subtitleMarginTop: '-4px' },
};

export const Logo = ({
  size = 'md',
  subtitle = 'DKI JAKARTA',
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
        display: 'flex',
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
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0,
        }}
      />
      <div style={{ lineHeight: 1.2 }}>
        <span
          style={{
            color: 'var(--color-primary)',
            fontWeight: 800,
            fontSize: config.fontSize,
            letterSpacing: '-0.02em',
          }}
        >
          RuangTerbuka
        </span>
        {showSubtitle && subtitle && (
          <span
            style={{
              display: 'block',
              fontSize: config.subtitleSize,
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              marginTop: config.subtitleMarginTop,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
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
      <Link to={to} className="navbar-brand" style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
