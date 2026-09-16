import React from 'react';

/**
 * Global SearchInput Component with Search Icon
 */
export const SearchInput = ({
  placeholder = 'Cari taman, lapangan, atau wilayah...',
  value,
  onChange,
  onSearch,
  className = '',
  buttonLabel = 'Cari',
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`search-input-wrapper ${className}`.trim()} style={{ position: 'relative', display: 'flex', width: '100%', gap: '8px' }}>
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <svg
          style={{ position: 'absolute', left: '14px', width: '18px', height: '18px', color: 'var(--color-text-muted)', pointerEvents: 'none' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="form-input"
          style={{ paddingLeft: '42px' }}
          {...props}
        />
      </div>
      {onSearch && (
        <button type="submit" className="btn btn-primary">
          {buttonLabel}
        </button>
      )}
    </form>
  );
};

export default SearchInput;
