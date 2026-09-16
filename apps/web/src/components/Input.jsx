import React from 'react';

/**
 * Global Form Input Component
 */
export const Input = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  id,
  name,
  ...props
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`form-input ${error ? 'border-danger' : ''}`}
        {...props}
      />
      {error && <span className="text-caption" style={{ color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
};

export default Input;
