import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DaftarRuangPublikPage } from './DaftarRuangPublikPage';

// Data uji: tiga ruang publik dengan jarak & kategori berbeda supaya filter
// jarak/kategori/teks punya sesuatu untuk disaring.
const DATA = [
  { id: 'a', nama: 'Taman Suropati', alamat: 'Menteng', kategori_id: 'taman-kota', wilayah: 'Jakarta Pusat', jarak_km: 2, fasilitas: [], stats: { baik: 3, rusak: 0 } },
  { id: 'b', nama: 'RPTRA Ceria', alamat: 'Kebayoran', kategori_id: 'rptra', wilayah: 'Jakarta Selatan', jarak_km: 7, fasilitas: [], stats: { baik: 1, rusak: 1 } },
  { id: 'c', nama: 'Taman Jauh', alamat: 'Cakung', kategori_id: 'taman-kota', wilayah: 'Jakarta Timur', jarak_km: 40, fasilitas: [], stats: { baik: 0, rusak: 2 } },
];

vi.mock('../../../services/ruangPublikService', () => ({
  getAllPublicSpaces: vi.fn(() => Promise.resolve(DATA)),
  getPublicSpacesStats: vi.fn(() => Promise.resolve({ total: 3 })),
}));

vi.mock('../../../services/categoryService', () => ({
  getCategories: vi.fn(() => Promise.resolve([
    { id: 'taman-kota', label: 'Taman Kota' },
    { id: 'rptra', label: 'RPTRA' },
  ])),
}));

vi.mock('../../../services/fasilitasService', () => ({
  getFacilityOptions: vi.fn(() => Promise.resolve([])),
}));

// Peta Leaflet tidak bisa dirender di jsdom; perilakunya bukan objek tes ini.
vi.mock('../components/PetaSebaranLokasi', () => ({
  default: () => <div data-testid="peta" />,
}));

vi.mock('../../../hooks/useGeolocation', () => ({
  default: () => ({
    location: { lat: null, lng: null },
    error: null,
    isLoading: false,
    isManual: false,
    requestLocation: vi.fn(),
    setManualLocation: vi.fn(),
  }),
}));

const renderHalaman = (url = '/ruang-publik') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <DaftarRuangPublikPage />
    </MemoryRouter>
  );

beforeEach(() => {
  globalThis.localStorage = {
    _isi: new Map(),
    getItem(k) { return this._isi.has(k) ? this._isi.get(k) : null; },
    setItem(k, v) { this._isi.set(k, String(v)); },
    removeItem(k) { this._isi.delete(k); },
    clear() { this._isi.clear(); },
  };
});

afterEach(() => {
  delete globalThis.localStorage;
  vi.clearAllMocks();
});

describe('DaftarRuangPublikPage - filter', () => {
  it('menyaring berdasarkan radius default 10 km', async () => {
    renderHalaman();
    await waitFor(() => expect(screen.getByText('Taman Suropati')).toBeInTheDocument());

    // 40 km > radius bawaan 10 km, jadi harus tersaring keluar.
    expect(screen.getByText('RPTRA Ceria')).toBeInTheDocument();
    expect(screen.queryByText('Taman Jauh')).not.toBeInTheDocument();
  });

  it('mengambil radius awal dari query string', async () => {
    renderHalaman('/ruang-publik?radius=50');
    await waitFor(() => expect(screen.getByText('Taman Jauh')).toBeInTheDocument());
  });

  it('menyaring berdasarkan kategori dari query string', async () => {
    renderHalaman('/ruang-publik?kategori=rptra');
    await waitFor(() => expect(screen.getByText('RPTRA Ceria')).toBeInTheDocument());

    expect(screen.queryByText('Taman Suropati')).not.toBeInTheDocument();
  });

  it('menyaring berdasarkan kata kunci dari query string', async () => {
    renderHalaman('/ruang-publik?q=suropati');
    await waitFor(() => expect(screen.getByText('Taman Suropati')).toBeInTheDocument());

    expect(screen.queryByText('RPTRA Ceria')).not.toBeInTheDocument();
  });

  it('menampilkan empty state saat semua hasil tersaring habis', async () => {
    renderHalaman('/ruang-publik?q=tidak-ada-yang-cocok');
    await waitFor(() => expect(screen.queryByText('Taman Suropati')).not.toBeInTheDocument());

    // EmptyState selalu merender judul; pastikan bukan sekadar layar kosong.
    expect(document.body.textContent.toLowerCase()).toMatch(/tidak|belum|kosong/);
  });
});
