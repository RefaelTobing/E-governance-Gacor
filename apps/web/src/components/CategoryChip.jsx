import React from 'react';
import { LayoutGrid, Trees, Leaf, Dumbbell, TreePine, Footprints } from 'lucide-react';

const ICON_MAP = {
  LayoutGrid,
  Trees,
  Leaf,
  Dumbbell,
  TreePine,
  Footprints,
  'semua': LayoutGrid,
  'taman-kota': Trees,
  'rth': Leaf,
  'lapangan-olahraga': Dumbbell,
  'hutan-kota': TreePine,
  'jalur-pedestrian': Footprints
};

/**
 * CategoryChip — Filter tag / Category Chip component
 *
 * @param {object} category - Category object { id, label, iconName }
 * @param {string} iconName - Icon identifier (optional)
 * @param {string} label - Category label (optional)
 * @param {boolean} isActive - Active state (Teal background, white text/icon)
 * @param {function} onClick - Click handler
 */
export const CategoryChip = ({
  category,
  iconName,
  label,
  isActive = false,
  onClick,
  className = '',
  style = {}
}) => {
  const catId = category?.id || '';
  const catLabel = label || category?.label || '';
  const iconKey = iconName || category?.iconName || catId;

  const IconComponent = ICON_MAP[iconKey] || ICON_MAP[catId] || Trees;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`category-chip ${isActive ? 'active' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: 'var(--radius-pill, 9999px)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all var(--transition-fast, 0.2s ease)',
        backgroundColor: isActive ? '#0F766E' : '#FFFFFF',
        color: isActive ? '#FFFFFF' : '#475569',
        border: isActive ? '1px solid #0F766E' : '1px solid #E2E8F0',
        boxShadow: isActive
          ? '0 2px 4px rgba(15, 118, 110, 0.2)'
          : '0 1px 2px rgba(0, 0, 0, 0.04)',
        ...style
      }}
    >
      <IconComponent
        size={16}
        color={isActive ? '#FFFFFF' : '#475569'}
        style={{ flexShrink: 0, transition: 'color 0.2s ease' }}
      />
      <span>{catLabel}</span>
    </button>
  );
};

export default CategoryChip;
