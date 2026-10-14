import React, { useEffect, useRef } from 'react';

/**
 * Modal generik lintas-fitur.
 *
 * - Menutup via tombol Escape dan klik area gelap di luar panel.
 * - `role="dialog"` + `aria-modal` untuk pembaca layar; fokus otomatis ke
 *   elemen interaktif pertama di dalam panel saat dibuka.
 * - `title` opsional (dirender sebagai heading dengan id untuk `aria-labelledby`).
 * - `footer` opsional (mis. deretan tombol aksi).
 */
export const Modal = ({
  open = false,
  onClose,
  title,
  children,
  footer,
  labelledBy = 'modal-title',
  maxWidth = '440px',
}) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);

    // Fokuskan elemen interaktif pertama agar keyboard user langsung bisa mengetik.
    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        className="card"
        style={{
          width: '100%',
          maxWidth,
          padding: 'var(--space-xl)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {title && (
          <h3
            id={labelledBy}
            className="h3"
            style={{ fontSize: '18px', marginBottom: 'var(--space-md)' }}
          >
            {title}
          </h3>
        )}

        <div>{children}</div>

        {footer && (
          <div
            style={{
              marginTop: 'var(--space-lg)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
