import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultiSelectDropdown from './MultiSelectDropdown';

const OPTIONS = [
  { nama: 'Toilet' },
  { nama: 'Playground' },
  { nama: 'Lampu' },
];

describe('MultiSelectDropdown', () => {
  it('menampilkan placeholder saat belum ada pilihan', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} placeholder="Fasilitas" />);
    expect(screen.getByRole('button', { name: 'Fasilitas' })).toHaveTextContent('Fasilitas');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('membuka panel saat trigger diklik', async () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} placeholder="Fasilitas" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fasilitas' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('memanggil onChange dengan nilai baru saat opsi dipilih', async () => {
    const onChange = vi.fn();
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={onChange} placeholder="Fasilitas" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fasilitas' }));
    await userEvent.click(screen.getByRole('option', { name: 'Toilet' }));
    expect(onChange).toHaveBeenCalledWith(['Toilet']);
  });

  it('melepas opsi yang sudah terpilih (toggle)', async () => {
    const onChange = vi.fn();
    render(<MultiSelectDropdown options={OPTIONS} value={['Toilet']} onChange={onChange} placeholder="Fasilitas" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fasilitas' }));
    await userEvent.click(screen.getByRole('option', { name: 'Toilet' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('menampilkan jumlah pilihan pada label trigger', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={['Toilet', 'Lampu']} onChange={() => {}} placeholder="Fasilitas" />);
    expect(screen.getByRole('button', { name: 'Fasilitas' })).toHaveTextContent('Fasilitas (2)');
  });

  it('tombol "Hapus pilihan" mengosongkan semua', async () => {
    const onChange = vi.fn();
    render(<MultiSelectDropdown options={OPTIONS} value={['Toilet']} onChange={onChange} placeholder="Fasilitas" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fasilitas' }));
    await userEvent.click(screen.getByRole('button', { name: /Hapus pilihan/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('menutup panel saat Escape', async () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} placeholder="Fasilitas" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fasilitas' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('menampilkan emptyLabel saat opsi kosong', async () => {
    render(<MultiSelectDropdown options={[]} value={[]} onChange={() => {}} placeholder="Fasilitas" emptyLabel="Tidak ada" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fasilitas' }));
    expect(screen.getByText('Tidak ada')).toBeInTheDocument();
  });
});
