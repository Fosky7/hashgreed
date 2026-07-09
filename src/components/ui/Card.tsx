import React from 'react';

interface CardProps {
  children: React.ReactNode;
  /** Additional classes appended to the base card styling. */
  className?: string;
  /** When true, applies a hover elevation transition (for clickable/interactive cards). */
  hoverable?: boolean;
  /** Optional click handler; when present, the card is keyboard accessible. */
  onClick?: () => void;
}

/**
 * Reusable surface wrapper standardizing background, rounded-xl corners,
 * border, shadow-sm, and an optional hover elevation transition.
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  const base =
    'bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow duration-300 ease-in-out';
  const hover = hoverable ? 'hover:shadow-md' : '';
  const interactive = onClick
    ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
    : '';

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${base} ${hover} ${interactive} ${className}`}
      >
        {children}
      </div>
    );
  }

  return <div className={`${base} ${hover} ${className}`}>{children}</div>;
};

export default Card;
