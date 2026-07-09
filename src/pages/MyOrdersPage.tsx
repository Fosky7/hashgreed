import React, { useCallback, useEffect, useState } from 'react';
import { ExclamationTriangleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import PageHeading from '../components/ui/PageHeading';
import OrderCard from '../components/orders/OrderCard';
import OrderCardSkeleton from '../components/orders/OrderCardSkeleton';
import { Order } from '../types/Order';

const SKELETON_COUNT = 4;

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD001',
    restaurantName: 'Jollof Spot',
    orderDate: '2023-10-26 14:30',
    totalAmount: 5200,
    status: 'Delivered',
    items: [
      { id: 'oi1', name: 'Jollof Rice with Chicken', quantity: 1, price: 2500 },
      { id: 'oi2', name: 'Fried Rice with Turkey', quantity: 1, price: 2700 },
    ],
  },
  {
    id: 'ORD002',
    restaurantName: 'Suya King',
    orderDate: '2023-10-25 19:00',
    totalAmount: 3500,
    status: 'Delivered',
    items: [{ id: 'oi3', name: 'Beef Suya', quantity: 1, price: 3500 }],
  },
  {
    id: 'ORD003',
    restaurantName: 'Amala Connect',
    orderDate: '2023-10-26 12:00',
    totalAmount: 2700,
    status: 'Pending',
    items: [{ id: 'oi4', name: 'Amala and Ewedu', quantity: 1, price: 2700 }],
  },
  {
    id: 'ORD004',
    restaurantName: 'Pepper Soup Hub',
    orderDate: '2023-10-24 18:45',
    totalAmount: 4000,
    status: 'Delivered',
    items: [{ id: 'oi5', name: 'Catfish Pepper Soup', quantity: 1, price: 4000 }],
  },
];

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOrders(MOCK_ORDERS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStartShopping = useCallback(() => {
    navigate('/#explore-restaurants');
  }, [navigate]);

  const handleViewDetails = useCallback((orderId: string) => {
    window.alert(`Order details for ${orderId} will be available soon.`);
  }, []);

  if (loading) {
    return (
      <section aria-labelledby="orders-loading-heading">
        <PageHeading subtitle="Track recent meals, totals, and delivery status in one place.">
          My Orders
        </PageHeading>
        <div className="grid grid-cols-1 gap-6" aria-live="polite" aria-busy="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby="orders-error-heading">
        <PageHeading subtitle="Track recent meals, totals, and delivery status in one place.">
          My Orders
        </PageHeading>
        <EmptyState
          icon={ExclamationTriangleIcon}
          title="We couldn’t load your orders"
          description={error}
          actionLabel="Try again"
          onAction={fetchOrders}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="my-orders-heading">
      <PageHeading subtitle="Track recent meals, totals, and delivery status in one place.">
        <span id="my-orders-heading">My Orders</span>
      </PageHeading>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBagIcon}
          title="You haven’t placed any orders yet"
          description="Start exploring trusted restaurants and your first order will appear here."
          actionLabel="Start Shopping"
          onAction={handleStartShopping}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}
    </section>
  );
};

export default MyOrdersPage;
