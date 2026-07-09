import React from 'react';

const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-card sm:p-6" aria-hidden="true">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="w-full max-w-xs">
          <div className="h-5 w-2/3 rounded-full bg-gray-200" />
          <div className="mt-3 h-4 w-1/2 rounded-full bg-gray-100" />
        </div>
        <div className="h-6 w-24 shrink-0 rounded-full bg-gray-200" />
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
        <div>
          <div className="h-3 w-20 rounded-full bg-gray-200" />
          <div className="mt-3 h-4 w-36 rounded-full bg-gray-200" />
        </div>
        <div className="sm:flex sm:flex-col sm:items-end">
          <div className="h-3 w-16 rounded-full bg-gray-200" />
          <div className="mt-3 h-5 w-28 rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="mb-4 h-4 w-16 rounded-full bg-gray-200" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded-full bg-gray-100" />
          <div className="h-4 w-5/6 rounded-full bg-gray-100" />
          <div className="h-4 w-2/3 rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="mt-5 h-5 w-36 rounded-full bg-gray-200" />
    </div>
  );
};

export default OrderCardSkeleton;
