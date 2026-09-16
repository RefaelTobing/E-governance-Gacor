import React from 'react';

/**
 * StatusBadge Component for Facility Condition or Report Status
 * @param {string} status - 'baik' | 'perlu_perhatian' | 'rusak' | 'dilaporkan' | 'menunggu_verifikasi' | 'diverifikasi' | 'dalam_penanganan' | 'selesai' | 'ditolak'
 * @param {string} customLabel - optional override for text label
 */
export const StatusBadge = ({ status, customLabel, className = '' }) => {
  const normalizedStatus = (status || '').toLowerCase().replace(/ /g, '_');

  let badgeType = 'neutral';
  let label = customLabel || status;

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

    // Report Progress Statuses
    case 'dilaporkan':
    case 'menunggu_verifikasi':
      badgeType = 'info';
      label = customLabel || 'Menunggu Verifikasi';
      break;
    case 'diverifikasi':
      badgeType = 'info';
      label = customLabel || 'Diverifikasi';
      break;
    case 'dalam_penanganan':
      badgeType = 'warning';
      label = customLabel || 'Dalam Penanganan';
      break;
    case 'selesai':
      badgeType = 'success';
      label = customLabel || 'Selesai';
      break;
    case 'ditolak':
      badgeType = 'danger';
      label = customLabel || 'Ditolak';
      break;

    default:
      badgeType = 'neutral';
      break;
  }

  return (
    <span className={`badge badge-${badgeType} ${className}`.trim()}>
      <span className="badge-dot"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
