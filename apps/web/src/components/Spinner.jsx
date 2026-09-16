import React from 'react';

/**
 * Loading Spinner Component
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const pixelSize = size === 'sm' ? 20 : size === 'lg' ? 40 : 28;

  return (
    <div className={`spinner-wrapper ${className}`.trim()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
          animation: 'spin 1s linear infinite',
          color: 'var(--color-primary)'
        }}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
