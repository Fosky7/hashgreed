import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, FireIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Restaurant } from '../types/Restaurant';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const rating = typeof restaurant.rating === 'number' ? restaurant.rating : null;
  const deliveryTime = typeof restaurant.deliveryTime === 'number' ? restaurant.deliveryTime : null;
  const isTopRated = rating !== null && rating >= 4.7;
  const isFastDelivery = deliveryTime !== null && deliveryTime <= 25;

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      aria-label={`View ${restaurant.name}, ${restaurant.cuisine} cuisine${rating ? `, rated ${rating}` : ''}`}
      className="group block overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-premium hover:ring-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={restaurant.imageUrl}
          alt={`${restaurant.name} food preview`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-950/55 to-transparent" aria-hidden="true" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {isTopRated && (
            <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-black text-gray-900 shadow-sm backdrop-blur">
              <StarIcon className="mr-1 h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              Top rated
            </span>
          )}
          {isFastDelivery && (
            <span className="inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-black text-white shadow-sm">
              <FireIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Fast
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-tight text-gray-950 transition group-hover:text-primary-700">
              {restaurant.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-500">{restaurant.cuisine} cuisine</p>
          </div>
          {rating !== null && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-700 ring-1 ring-amber-100">
              <StarIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
          <span className="inline-flex items-center font-semibold text-gray-600">
            <ClockIcon className="mr-1.5 h-4 w-4 text-primary-600" aria-hidden="true" />
            {deliveryTime !== null ? `${deliveryTime} min` : 'Time varies'}
          </span>
          <span className="font-bold text-primary-700">Order now</span>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
