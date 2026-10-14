import React from 'react';
import { STATUS_LAPORAN } from '../config/constants';

/**
 * StatusBadge Component for Facility Condition or Report Status
 * @param {string} status - 'baik' | 'perlu_perhatian' | 'rusak' | 'menunggu_verifikasi' | 'diverifikasi' | 'dalam_penanganan' | 'selesai' | 'ditolak'
 * @param {string} customLabel - optional override for text label
 */
export const StatusBadge = ({ status, customLabel, className = '' }) => {
  const normalizedStatus = (status || '').toLowerCase().replace(/ /g, '_');

  let badgeType = 'neutral';
  let label = customLabel || status;

  // Status laporan memakai enum kanonik (config/constants.js).
  const statusLaporan = Object.values(STATUS_LAPORAN).find((s) => s.key === normalizedStatus);

  if (statusLaporan) {
    badgeType = statusLaporan.badgeType;
    label = customLabel || statusLaporan.label;
  } else {
    switch (normalizedStatus) {
      // Condition Statuses
      case 'baik':
      case 'sangat_baik':
        badgeType = 'success';
        label = customLabel || 'Baik';
        break;
      case 'perlu_perhatian':
      case 'perhatian':
        badgeType = 'warning';
        label = customLabel || 'Perlu Perhatian';
        break;
      case 'rusak':
        badgeType = 'danger';
        label = customLabel || 'Rusak';
        break;
      default:
        badgeType = 'neutral';
        break;
    }
  }

  return (
    <span className={`badge badge-${badgeType} ${className}`.trim()}>
      <span className="badge-dot"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
