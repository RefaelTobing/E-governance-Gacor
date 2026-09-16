import React from 'react';
import { Search } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState Component for displaying empty search/filter results
 */
export const EmptyState = ({
  title = 'Data Tidak Ditemukan',
  description = 'Maaf, tidak ada data yang sesuai dengan kriteria pencarian Anda.',
  icon,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`empty-state ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3xl) var(--space-xl)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--color-border)'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-md)'
        }}
      >
        {icon || <Search size={24} color="#0F766E" />}
      </div>
      <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>{title}</h3>
      <p className="text-small" style={{ color: 'var(--color-text-muted)', maxWidth: '400px', marginBottom: actionLabel ? 'var(--space-lg)' : 0 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
