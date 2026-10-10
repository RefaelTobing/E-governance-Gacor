import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('mengasosiasikan label dengan input via htmlFor/id', () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'email');
  });

  it('menampilkan tanda bintang saat required', () => {
    render(<Input label="Nama" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('menampilkan pesan error', () => {
    render(<Input label="Sandi" error="Wajib diisi" />);
    expect(screen.getByText('Wajib diisi')).toBeInTheDocument();
  });

  it('menerima value & onChange', () => {
    render(<Input label="X" value="abc" onChange={() => {}} />);
    expect(screen.getByLabelText('X')).toHaveValue('abc');
  });

  it('id eksplisit dipakai bila diberikan', () => {
    render(<Input label="Halo" id="khusus" />);
    expect(screen.getByLabelText('Halo')).toHaveAttribute('id', 'khusus');
  });
});
