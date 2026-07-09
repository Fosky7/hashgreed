import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Centralizes order-status color mapping with consistent pill styling.
 * Unknown/new statuses fall back to a neutral blue treatment rather than
 * rendering an unstyled pill.
 */
const getStatusStyles = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
        status,
      )} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
