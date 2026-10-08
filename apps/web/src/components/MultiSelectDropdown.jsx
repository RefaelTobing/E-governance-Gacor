import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

const MultiSelectDropdown = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Pilih opsi', 
  clearLabel = 'Hapus pilihan',
  emptyLabel = 'Tidak ada pilihan tersedia',
  className = '', 
  ariaLabel 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
    triggerRef.current?.focus();
  };

  const displayLabel = value.length > 0 ? `${placeholder} (${value.length})` : placeholder;

  return (
    <div className={`select-dropdown ${className}`.trim()} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="select-dropdown-trigger ruang-publik-filter"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || placeholder}
      >
        <span style={{ fontWeight: value.length > 0 ? 700 : 400, color: value.length > 0 ? 'var(--color-primary)' : 'inherit' }}>
          {displayLabel}
        </span>
        <ChevronDown className={`select-dropdown-chevron ${isOpen ? 'open' : ''}`} size={16} aria-hidden="true" />
      </button>
      
      {isOpen && (
        <div className="select-dropdown-menu" id={listboxId} role="listbox" aria-label={ariaLabel} style={{ minWidth: '220px' }}>
          {value.length > 0 && (
            <div style={{ padding: '0 8px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={clearAll}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--color-danger)', 
                  fontSize: '11px', cursor: 'pointer', fontWeight: 600, 
                  display: 'inline-flex', alignItems: 'center', gap: '4px' 
                }}
              >
                <X size={12} /> {clearLabel}
              </button>
            </div>
          )}
          
          {options.length === 0 ? (
            <div style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {emptyLabel}
            </div>
          ) : (
            options.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.nama;
              const label = typeof opt === 'string' ? opt : opt.nama;
              const isSelected = value.includes(val);
              
              return (
                <button
                  key={val}
                  type="button"
                  className={`select-dropdown-option ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleOption(val)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{label}</span>
                  {isSelected && <Check size={14} color="var(--color-primary)" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
