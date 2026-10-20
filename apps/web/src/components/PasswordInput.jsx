import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input kata sandi dengan tombol tampilkan/sembunyikan (ikon mata).
 * Markup dan prop mengikuti Input.jsx; hanya type-nya yang digisikan otomatis.
 */
export const PasswordInput = ({
  label,
  error,
  type = 'password',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  id,
  name,
  ...props
}) => {
  const [lihatSandi, setLihatSandi] = useState(false);
  const idUnik = useId();
  const inputId = id || name || `password-${idUnik}`;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          name={name}
          type={lihatSandi ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-input ${error ? 'border-danger' : ''}`}
          style={{ paddingRight: '44px' }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setLihatSandi((aktif) => !aktif)}
          aria-pressed={lihatSandi}
          aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          style={{
            position: 'absolute',
            top: '50%',
            right: '4px',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {lihatSandi ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="text-caption" style={{ color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
};

export default PasswordInput;
