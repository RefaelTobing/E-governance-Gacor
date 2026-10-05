import {
  LayoutDashboard,
  ClipboardList,
  Bookmark,
  SquarePen,
  Palette,
  Lock,
  CircleHelp,
} from 'lucide-react';

/**
 * Struktur menu area akun warga.
 * Dipakai bersama oleh AkunSidebar (drawer/sidebar) dan ProfileDropdown (navbar),
 * supaya tidak ada dua sumber kebenaran untuk daftar menu profil.
 */
export const MENU_GROUPS = [
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

export default MENU_GROUPS;
