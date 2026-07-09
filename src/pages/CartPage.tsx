import React, { useCallback, useContext, useMemo } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../hooks/useCart';
import EmptyState from '../components/ui/EmptyState';
import PageHeading from '../components/ui/PageHeading';
import CartItemRow from '../components/cart/CartItemRow';
import CartSummary from '../components/cart/CartSummary';
import { CartItem } from '../types/CartItem';

const DELIVERY_FEE = 500;

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateItemQuantity, clearCart } = useContext(CartContext);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const deliveryFee = useMemo(
    () => (cartItems.length > 0 ? DELIVERY_FEE : 0),
    [cartItems.length]
  );

  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  const handleStartShopping = useCallback(() => {
    navigate('/#explore-restaurants');
  }, [navigate]);

  const handleIncrease = useCallback(
    (item: CartItem) => {
      updateItemQuantity(item.id, item.quantity + 1);
    },
    [updateItemQuantity]
  );

  const handleDecrease = useCallback(
    (item: CartItem) => {
      updateItemQuantity(item.id, item.quantity - 1);
    },
    [updateItemQuantity]
  );

  const handleRemove = useCallback(
    (item: CartItem) => {
      removeFromCart(item.id);
    },
    [removeFromCart]
  );

  const handleCheckout = useCallback(() => {
    window.alert('Checkout is coming soon. Payment and delivery confirmation will be added in a future update.');
  }, []);

  if (cartItems.length === 0) {
    return (
      <section aria-labelledby="empty-cart-heading">
        <PageHeading subtitle="Build your basket from fresh African meals and local favourites.">
          Your Cart
        </PageHeading>
        <EmptyState
          icon={ShoppingCartIcon}
          title="Your cart is empty"
          description="Looks like you haven’t added anything to your cart yet. Start exploring restaurants to find your next meal."
          actionLabel="Start Shopping"
          onAction={handleStartShopping}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="cart-heading">
      <PageHeading subtitle="Review your meals, adjust quantities, and confirm your order summary.">
        <span id="cart-heading">Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
      </PageHeading>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6 lg:col-span-2" aria-label="Cart items">
          {cartItems.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <CartSummary
            totalItems={totalItems}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </section>
  );
};

export default CartPage;
