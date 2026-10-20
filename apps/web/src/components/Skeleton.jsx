import React from 'react';

/**
 * Skeleton Loading Component
 * Supports custom width, height, radius, and subtle shimmer animation
 */
export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  variant = 'rect', // 'rect', 'circle', 'text'
  style = {},
  className = ''
}) => {
  const isCircle = variant === 'circle';

  return (
    <div
      className={`skeleton-loader ${className}`.trim()}
      style={{
        width: isCircle ? height : width,
        height,
        borderRadius: isCircle ? '50%' : borderRadius,
        backgroundColor: 'var(--color-border)',
        backgroundImage: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-neutral-light) 50%, var(--color-border) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite ease-in-out',
        display: 'inline-block',
        ...style
      }}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;
