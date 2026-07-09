import React from 'react';

interface OrderStatusBadgeProps {
  status: string;
}

const getStatusBadgeClasses = (status: string): string => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const label = status.trim() || 'Unknown';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(label)}`}
    >
      {label}
    </span>
  );
};

export default OrderStatusBadge;
