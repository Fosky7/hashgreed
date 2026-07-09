import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Order } from '../../types/Order';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  onViewDetails?: (orderId: string) => void;
}

const formatCurrency = (amount: number): string => `₦${amount.toLocaleString()}`;

const formatOrderDate = (value: string): string => {
  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-card transition-shadow duration-300 ease-in-out hover:shadow-lg sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{order.restaurantName}</h2>
          <p className="mt-1 text-sm text-gray-500">Order ID: {order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2 sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order date</p>
          <p className="mt-1 text-sm font-medium text-gray-800">{formatOrderDate(order.orderDate)}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total paid</p>
          <p className="mt-1 text-lg font-bold text-primary-700">{formatCurrency(order.totalAmount)}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Items</h3>
        {order.items.length > 0 ? (
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-xl bg-white text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="font-semibold text-gray-800">{item.quantity}x</span> {item.name}
                </span>
                <span className="font-medium text-gray-900 sm:pl-4">{formatCurrency(item.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No items available for this order.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onViewDetails?.(order.id)}
        className="mt-5 inline-flex items-center rounded-md p-1 text-sm font-medium text-primary-600 transition-colors duration-200 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label={`View details for order ${order.id}`}
      >
        View Order Details
        <ChevronRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  );
};

export default OrderCard;
