import React from 'react';

/**
 * Base Card Component
 */
export const Card = ({ children, hoverable = false, className = '', style, onClick, ...props }) => {
  return (
    <div
      className={`card ${hoverable ? 'card-hover' : ''} ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '', style, ...props }) => {
  return (
    <div className={`card-body ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
};

export default Card;
