import React from 'react';

const RestaurantCardSkeleton: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-gray-100" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-gray-200" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-gray-100" />
          </div>
          <div className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="h-4 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
};

export default RestaurantCardSkeleton;
