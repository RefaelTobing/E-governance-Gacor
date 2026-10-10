import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('tidak merender apa pun saat open=false', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Judul">
        <p>Isi</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('merender dialog saat open=true', () => {
    render(
      <Modal open onClose={() => {}} title="Judul Modal">
        <p>Isi</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Judul Modal')).toBeInTheDocument();
  });

  it('memanggil onClose saat menekan Escape', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="X"><p>a</p></Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('memanggil onClose saat klik area luar (overlay)', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="X"><p>a</p></Modal>);
    // Overlay = parent dari dialog
    const dialog = screen.getByRole('dialog');
    await userEvent.click(dialog.parentElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('tidak memanggil onClose saat klik di dalam panel', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="X"><p>isi dalam</p></Modal>);
    await userEvent.click(screen.getByText('isi dalam'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('memfokuskan elemen interaktif pertama', async () => {
    render(
      <Modal open onClose={() => {}} title="X" footer={<button type="button">Simpan</button>}>
        <p>konten</p>
      </Modal>
    );
    // setTimeout(0) di Modal -> tunggu microtask
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByRole('button', { name: 'Simpan' })).toHaveFocus();
  });
});
