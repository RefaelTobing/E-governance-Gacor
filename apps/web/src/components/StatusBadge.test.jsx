import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('memetakan status laporan dari enum kanonik ke label', () => {
    const { rerender } = render(<StatusBadge status="menunggu_verifikasi" />);
    expect(screen.getByText('Menunggu Verifikasi')).toBeInTheDocument();

    rerender(<StatusBadge status="dalam_penanganan" />);
    expect(screen.getByText('Dalam Penanganan')).toBeInTheDocument();

    rerender(<StatusBadge status="selesai" />);
    expect(screen.getByText('Selesai')).toBeInTheDocument();

    rerender(<StatusBadge status="ditolak" />);
    expect(screen.getByText('Ditolak')).toBeInTheDocument();
  });

  it('memetakan status kondisi fasilitas', () => {
    const { rerender } = render(<StatusBadge status="baik" />);
    expect(screen.getByText('Baik')).toBeInTheDocument();

    rerender(<StatusBadge status="perlu_perhatian" />);
    expect(screen.getByText('Perlu Perhatian')).toBeInTheDocument();

    rerender(<StatusBadge status="rusak" />);
    expect(screen.getByText('Rusak')).toBeInTheDocument();
  });

  it('menghormati customLabel untuk override teks', () => {
    render(<StatusBadge status="baik" customLabel="Status umum: Kondisi Baik" />);
    expect(screen.getByText('Status umum: Kondisi Baik')).toBeInTheDocument();
    expect(screen.queryByText('Baik')).not.toBeInTheDocument();
  });

  it('menampilkan label mentah untuk status tak dikenal', () => {
    render(<StatusBadge status="entah_apa" />);
    expect(screen.getByText('entah_apa')).toBeInTheDocument();
  });

  it('menormalkan spasi menjadi underscore', () => {
    render(<StatusBadge status="Perlu Perhatian" />);
    expect(screen.getByText('Perlu Perhatian')).toBeInTheDocument();
  });

  it('memakai badgeType dari enum untuk warna (success untuk selesai)', () => {
    const { container } = render(<StatusBadge status="selesai" />);
    expect(container.querySelector('.badge-success')).not.toBeNull();
  });
});
