import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('merender children', () => {
    render(<Button>Kirim</Button>);
    expect(screen.getByRole('button', { name: 'Kirim' })).toBeInTheDocument();
  });

  it('memanggil onClick saat diklik', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Klik</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Klik' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('tidak memanggil onClick saat disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Klik</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Klik' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Klik' })).toBeDisabled();
  });

  it('default type="button"', () => {
    render(<Button>X</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('meneruskan type="submit"', () => {
    render(<Button type="submit">Simpan</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('menerapkan class variant/size/fullWidth', () => {
    render(<Button variant="danger" size="lg" fullWidth>Hapus</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('btn-danger');
    expect(btn.className).toContain('btn-lg');
    expect(btn.className).toContain('btn-full');
  });
});
