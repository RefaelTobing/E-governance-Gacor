import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../../../components';

/**
 * Halaman 404 untuk route `*`.
 * Menggantikan redirect diam-diam ke /home supaya URL yang salah terlihat
 * jelas sebagai "tidak ditemukan" dan pengguna tahu harus ke mana.
 */
export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-4xl)', paddingBottom: 'var(--space-4xl)' }}>
      <EmptyState
        icon={<Compass size={24} color="#0F766E" />}
        title="404 — Halaman Tidak Ditemukan"
        description="Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan. Periksa kembali tautannya, atau kembali ke beranda."
        actionLabel="Kembali ke Beranda"
        onAction={() => navigate('/home')}
      />
    </div>
  );
};

export default NotFoundPage;
