import React, { useState } from 'react';
import { ChevronDown, HelpCircle, PhoneCall, Mail } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Bagaimana cara melaporkan fasilitas publik yang rusak?',
    a: 'Cari ruang publik yang dimaksud di menu "Ruang Publik", buka halaman detailnya, lalu klik tombol "Laporkan Masalah". Isi formulir dengan deskripsi, foto, dan lokasi presisi.',
  },
  {
    q: 'Apa itu Mode Identitas Anonim?',
    a: 'Mode anonim memungkinkan Anda mengirimkan laporan tanpa menyertakan nama publik Anda. Identitas Anda tetap terlindungi di laporan publik.',
  },
  {
    q: 'Berapa lama laporan saya diproses oleh petugas?',
    a: 'Laporan baru akan diverifikasi dalam 1-2 hari kerja. Setelah diverifikasi, status akan diperbarui menjadi "Dalam Penanganan" hingga selesai.',
  },
  {
    q: 'Apakah saya bisa mengubah laporan yang sudah dikirim?',
    a: 'Laporan yang sudah dikirim tidak dapat diubah untuk menjaga integritas audit log. Jika ada pembaruan, Anda dapat menambahkan catatan pada detail laporan.',
  },
];

export const BantuanPage = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIdx((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <div className="container" style={{ maxWidth: '820px', padding: 0 }}>
      <div className="profil-section-head">
        <h2 className="h2">FAQ & Pusat Bantuan</h2>
      </div>

      <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>
        Pertanyaan umum seputar pelaporan dan pemeliharaan fasilitas ruang publik Jakarta.
      </p>

      {/* Accordion FAQ */}
      <div className="profil-faq-list">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.q} className={`profil-faq-item ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="profil-faq-trigger"
                onClick={() => toggleAccordion(idx)}
                aria-expanded={isOpen}
              >
                <HelpCircle size={18} color="var(--color-primary)" aria-hidden="true" />
                <span className="profil-faq-q">{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`profil-faq-arrow ${isOpen ? 'rotate' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="profil-faq-content">
                  <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kontak Layanan */}
      <div className="profil-kontak-card">
        <h3 className="h3" style={{ marginBottom: '8px' }}>Butuh Bantuan Lebih Lanjut?</h3>
        <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
          Kanal resmi pengaduan dan layanan informasi Pemerintah Provinsi DKI Jakarta.
        </p>

        <div className="profil-kontak-grid">
          <div className="profil-kontak-item">
            <PhoneCall size={20} color="var(--color-primary)" aria-hidden="true" />
            <div>
              <span className="text-caption">Call Center Jakarta</span>
              <strong style={{ display: 'block', fontSize: '14px' }}>112 (Bebas Pulsa)</strong>
            </div>
          </div>
          <div className="profil-kontak-item">
            <Mail size={20} color="var(--color-primary)" aria-hidden="true" />
            <div>
              <span className="text-caption">Email Layanan</span>
              <strong style={{ display: 'block', fontSize: '14px' }}>dinas.taman@jakarta.go.id</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BantuanPage;
