// src/components/BackButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  /** Explicit destination. When omitted, navigates back in history. */
  to?: string;
  /** Override the label text. */
  label?: string;
  className?: string;
}

/**
 * Reusable back-navigation control. Uses theme tokens so it reads correctly
 * in both light and dark modes. Defaults to history-back, but accepts an
 * explicit `to` for predictable navigation from deep links.
 */
const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
