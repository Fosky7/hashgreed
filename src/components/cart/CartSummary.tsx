import React from 'react';

interface CartSummaryProps {
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onClearCart: () => void;
  onCheckout: () => void;
}

const formatCurrency = (amount: number): string => `₦${amount.toLocaleString()}`;

const CartSummary: React.FC<CartSummaryProps> = ({
  totalItems,
  subtotal,
  deliveryFee,
  total,
  onClearCart,
  onCheckout,
}) => {
  const itemLabel = `${totalItems} item${totalItems === 1 ? '' : 's'}`;

  return (
    <aside className="h-fit rounded-2xl bg-white p-6 shadow-card lg:sticky lg:top-28" aria-labelledby="cart-summary-heading">
      <h2 id="cart-summary-heading" className="text-xl font-bold tracking-tight text-gray-900">
        Order Summary
      </h2>
      <p className="mt-1 text-sm text-gray-500">Review your basket before checkout.</p>

      <dl className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
          <dt>Subtotal ({itemLabel})</dt>
          <dd className="text-right font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
          <dt>Delivery Fee</dt>
          <dd className="text-right font-medium text-gray-900">{formatCurrency(deliveryFee)}</dd>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
          <dt className="text-base font-bold text-gray-900">Total</dt>
          <dd className="text-right text-lg font-bold text-primary-700">{formatCurrency(total)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onCheckout}
        className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        Proceed to Checkout
      </button>

      <button
        type="button"
        onClick={onClearCart}
        className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        Clear Cart
      </button>
    </aside>
  );
};

export default CartSummary;
