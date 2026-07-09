import React, { useMemo } from 'react';
import { Restaurant } from '../types/Restaurant';
import RestaurantCard from './RestaurantCard';
import SectionHeader from './ui/SectionHeader';

interface FeaturedRestaurantsProps {
  restaurants: Restaurant[];
}

const FeaturedRestaurants: React.FC<FeaturedRestaurantsProps> = ({ restaurants }) => {
  const featuredRestaurants = useMemo(() => {
    return [...restaurants]
      .sort((a, b) => {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (a.deliveryTime ?? Number.MAX_SAFE_INTEGER) - (b.deliveryTime ?? Number.MAX_SAFE_INTEGER);
      })
      .slice(0, 3);
  }, [restaurants]);

  if (featuredRestaurants.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="featured-restaurants-heading" className="mt-12 rounded-[2rem] bg-gray-950 px-4 py-8 text-white shadow-premium sm:px-6 lg:px-8">
      <SectionHeader
        id="featured-restaurants-heading"
        eyebrow="Editor’s picks"
        title="Featured restaurants"
        subtitle="Highly rated kitchens with reliable delivery times and guest-favourite meals."
        className="[&_*]:text-white [&_p:first-child]:text-primary-300 [&_p:last-child]:text-gray-300"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {featuredRestaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedRestaurants;
