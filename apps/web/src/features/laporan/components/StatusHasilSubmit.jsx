import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Home, Send, Eye, MapPin, Tag } from 'lucide-react';
import { Button, Card, CardBody, StatusBadge } from '../../../components';
import { STATUS_LAPORAN } from '../../../config/constants';

// Status yang dianggap sudah tayang menurut kontrak backend
// (backend/app/schemas/laporan.py: STATUS_TAYANG).
const STATUS_TAYANG = [
  STATUS_LAPORAN.DIVERIFIKASI.key,
  STATUS_LAPORAN.DALAM_PENANGANAN.key,
  STATUS_LAPORAN.SELESAI.key,
];

/**
 * Susun alasan kualitatif kenapa laporan masuk antrean tinjauan admin.
 * Sengaja tanpa angka presisi (meter) agar tidak membocorkan detail lokasi
 * ke UI publik (lihat catatan FE-17).
 */
const buildAlasanMenunggu = (result) => {
  const alasan = [];
  if (result?.jarakExifRp == null) {
    alasan.push('Foto tidak menyertakan data lokasi (EXIF)');
  }
  if (result?.jarakBrowserRp == null) {
    alasan.push('Lokasi perangkat tidak terdeteksi');
  }
  if (alasan.length === 0) {
    alasan.push('Lokasi terdeteksi di luar area ruang publik');
  }
  return alasan;
};

/**
 * Panel hasil submit laporan (FE-19).
 * Membedakan laporan yang langsung tayang vs yang menunggu tinjauan admin.
 *
 * @param {Object}   result          - laporan hasil createReport (sudah camelCase)
 * @param {boolean}  isAuthenticated - apakah pengguna login (untuk tombol detail)
 * @param {Function} onLaporLagi     - reset & kembali ke form
 * @param {Function} onLihatDetail   - buka /laporan-saya/:id
 * @param {Function} onBeranda       - kembali ke beranda
 */
export const StatusHasilSubmit = ({
  result,
  isAuthenticated = false,
  onLaporLagi,
  onLihatDetail,
  onBeranda,
}) => {
  const headingRef = useRef(null);

  useEffect(() => {
    // Pindahkan fokus ke panel hasil supaya pembaca layar & keyboard
    // langsung tahu submit berhasil.
    headingRef.current?.focus();
  }, []);

  const status = (result?.status || '').toLowerCase();
  const isTayang = STATUS_TAYANG.includes(status);

  const theme = isTayang
    ? {
        tint: 'var(--color-success-light)',
        accent: 'var(--color-success)',
        Icon: CheckCircle2,
        badgeStatus: STATUS_LAPORAN.DIVERIFIKASI.key,
        badgeLabel: 'Laporan Tayang',
        heading: 'Laporan Anda Sudah Tayang',
        body: 'Laporan Anda lolos validasi lokasi dan langsung ditayangkan sehingga dapat dilihat pengguna lain.',
      }
    : {
        tint: 'var(--color-info-light)',
        accent: 'var(--color-info)',
        Icon: Clock,
        badgeStatus: STATUS_LAPORAN.MENUNGGU_VERIFIKASI.key,
        badgeLabel: 'Menunggu Tinjauan Admin',
        heading: 'Laporan Menunggu Tinjauan Admin',
        body: 'Laporan Anda memerlukan verifikasi lokasi oleh pengelola sebelum ditayangkan.',
      };

  const { Icon } = theme;
  const alasan = !isTayang ? buildAlasanMenunggu(result) : [];

  return (
    <Card style={{ maxWidth: '720px', margin: '0 auto' }}>
      <CardBody style={{ padding: 'var(--space-2xl)' }}>
        <div
          role="status"
          aria-live="polite"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-md)' }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: theme.tint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={36} color={theme.accent} />
          </div>

          <StatusBadge status={theme.badgeStatus} customLabel={theme.badgeLabel} />

          <h1
            className="h2"
            ref={headingRef}
            tabIndex={-1}
            style={{ margin: 0, outline: 'none' }}
          >
            {theme.heading}
          </h1>

          <p className="text-body" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            {theme.body}
          </p>
        </div>

        {/* Ringkasan laporan */}
        <div
          style={{
            marginTop: 'var(--space-xl)',
            backgroundColor: 'var(--color-bg-main)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>ID Laporan</span>
            <strong className="text-small">#{result?.id || '-'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <span className="text-caption" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={12} /> Fasilitas
            </span>
            <strong className="text-small">{result?.fasilitasNama || 'Fasilitas tidak disebutkan'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <span className="text-caption" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} /> Ruang Publik
            </span>
            <strong className="text-small">{result?.ruangPublikNama || 'Ruang publik tidak disebutkan'}</strong>
          </div>
        </div>

        {/* Alasan kualitatif untuk laporan yang menunggu tinjauan */}
        {!isTayang && alasan.length > 0 && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              backgroundColor: theme.tint,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
            }}
          >
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
              Perlu ditinjau karena:
            </span>
            <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {alasan.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Aksi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-xl)' }}>
          {isAuthenticated && (
            <Button
              variant="primary"
              fullWidth
              onClick={onLihatDetail}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Eye size={16} /> Lihat Detail Laporan
            </Button>
          )}
          <Button
            variant={isAuthenticated ? 'outline' : 'primary'}
            fullWidth
            onClick={onLaporLagi}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Send size={16} /> Kirim Laporan Lain
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={onBeranda}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Home size={16} /> Kembali ke Beranda
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default StatusHasilSubmit;
