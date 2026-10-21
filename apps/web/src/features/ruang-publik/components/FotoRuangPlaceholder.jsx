import React from 'react';
import { Armchair, Gamepad2, TreePine, Trees } from 'lucide-react';

/**
 * Tampilan pengganti saat ruang publik belum punya foto.
 *
 * Warna memakai token semantik yang sudah ada supaya tetap terbaca di mode
 * gelap. Ikon mengikuti kategori agar kartu satu halaman tidak tampil seragam.
 */
const TAMPILAN_KATEGORI = {
  'taman-lingkungan': {
    Icon: Trees,
    background: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
  },
  'taman-kota': {
    Icon: TreePine,
    background: 'var(--color-info-light)',
    color: 'var(--color-info-text)',
  },
  'taman-interaktif': {
    Icon: Gamepad2,
    background: 'var(--color-warning-light)',
    color: 'var(--color-warning-text)',
  },
  rptra: {
    Icon: Armchair,
    background: 'var(--color-success-light)',
    color: 'var(--color-success-text)',
  },
};

const TAMPILAN_BAWAAN = {
  Icon: Trees,
  background: 'var(--color-bg-main)',
  color: 'var(--color-text-muted)',
};

export const FotoRuangPlaceholder = ({ kategoriId, iconSize = 32, style = {} }) => {
  const { Icon, background, color } = TAMPILAN_KATEGORI[kategoriId] || TAMPILAN_BAWAAN;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: background,
        color,
        ...style,
      }}
    >
      <Icon size={iconSize} strokeWidth={1.5} color={color} aria-hidden="true" />
      <span style={{ fontSize: '12px', fontWeight: 600 }}>Foto belum tersedia</span>
    </div>
  );
};

export default FotoRuangPlaceholder;
