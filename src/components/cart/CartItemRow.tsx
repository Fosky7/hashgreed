import React from 'react';
import { MinusCircleIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CartItem } from '../../types/CartItem';

interface CartItemRowProps {
  item: CartItem;
  onIncrease: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

const formatCurrency = (amount: number): string => `₦${amount.toLocaleString()}`;

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onIncrease, onDecrease, onRemove }) => {
  const lineTotal = item.price * item.quantity;
  const canDecrease = item.quantity > 1;

  return (
    <article className="flex flex-col gap-4 border-b border-gray-200 py-5 last:border-b-0 last:pb-0 sm:flex-row sm:items-center">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-32 w-full flex-shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{item.name}</h2>
          <p className="mt-1 text-sm text-gray-500">Unit price: {formatCurrency(item.price)}</p>
          <p className="mt-2 text-sm font-semibold text-primary-700 md:hidden">
            Line total: {formatCurrency(lineTotal)}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
          <div className="flex items-center" aria-label={`Quantity controls for ${item.name}`}>
            <button
              type="button"
              onClick={() => onDecrease(item)}
              disabled={!canDecrease}
              className="rounded-full text-gray-400 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <MinusCircleIcon className="h-7 w-7" aria-hidden="true" />
            </button>
            <span className="mx-3 min-w-[2rem] rounded-lg bg-gray-50 px-2 py-1 text-center text-base font-semibold text-gray-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease(item)}
              className="rounded-full text-gray-400 transition-colors hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <PlusCircleIcon className="h-7 w-7" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="ml-4 rounded-full text-red-500 transition-colors hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              aria-label={`Remove ${item.name} from cart`}
            >
              <TrashIcon className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>

          <p className="hidden min-w-[7rem] text-right text-base font-bold text-primary-700 md:block">
            {formatCurrency(lineTotal)}
          </p>
        </div>
      </div>
    </article>
  );
};

export default CartItemRow;
