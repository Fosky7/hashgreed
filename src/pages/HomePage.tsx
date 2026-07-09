import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import RestaurantCard from '../components/RestaurantCard';
import HeroBanner from '../components/HeroBanner';
import CategoryChips from '../components/CategoryChips';
import FeaturedRestaurants from '../components/FeaturedRestaurants';
import RestaurantCardSkeleton from '../components/RestaurantCardSkeleton';
import HomeStatStrip from '../components/home/HomeStatStrip';
import HowItWorks from '../components/home/HowItWorks';
import CuisineSpotlight from '../components/home/CuisineSpotlight';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import { Restaurant } from '../types/Restaurant';

import jollofSpotImage from '../assets/jollof-spot.png';
import suyaKingImage from '../assets/suya-king.png';
import poundedYamPalaceImage from '../assets/pounded-yam-palace.png';
import amalaConnectImage from '../assets/amala-connect.png';
import pepperSoupHubImage from '../assets/pepper-soup-hub.png';
import mamaPutKitchenImage from '../assets/mama-put-kitchen.png';

const SKELETON_COUNT = 6;
const gridClasses = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';

const MOCK_RESTAURANTS: Restaurant[] = [
  { id: '1', name: 'Jollof Spot', cuisine: 'Nigerian', imageUrl: jollofSpotImage, rating: 4.5, deliveryTime: 30 },
  { id: '2', name: 'Suya King', cuisine: 'Suya', imageUrl: suyaKingImage, rating: 4.8, deliveryTime: 25 },
  { id: '3', name: 'Pounded Yam Palace', cuisine: 'Nigerian', imageUrl: poundedYamPalaceImage, rating: 4.2, deliveryTime: 35 },
  { id: '4', name: 'Amala Connect', cuisine: 'Nigerian', imageUrl: amalaConnectImage, rating: 4.0, deliveryTime: 40 },
  { id: '5', name: 'Pepper Soup Hub', cuisine: 'Nigerian', imageUrl: pepperSoupHubImage, rating: 4.7, deliveryTime: 20 },
  { id: '6', name: 'Mama Put Kitchen', cuisine: 'Nigerian', imageUrl: mamaPutKitchenImage, rating: 4.3, deliveryTime: 30 },
];

const HomePage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const exploreRef = useRef<HTMLElement | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setRestaurants(MOCK_RESTAURANTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const scrollToExplore = useCallback(() => {
    exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCategory(null);
    setSearchQuery('');
  }, []);

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesCategory = selectedCategory
        ? restaurant.cuisine.toLowerCase() === selectedCategory.toLowerCase()
        : true;

      const searchableText = `${restaurant.name} ${restaurant.cuisine}`.toLowerCase();
      const matchesSearch = normalizedQuery ? searchableText.includes(normalizedQuery) : true;

      return matchesCategory && matchesSearch;
    });
  }, [restaurants, searchQuery, selectedCategory]);

  const hasActiveFilters = Boolean(selectedCategory || searchQuery.trim());

  const emptyDescription = restaurants.length === 0
    ? 'No restaurants are available right now. Please check back soon for freshly onboarded kitchens.'
    : `No restaurants match${searchQuery.trim() ? ` “${searchQuery.trim()}”` : ''}${selectedCategory ? ` in ${selectedCategory}` : ''}. Try another search or clear your filters.`;

  return (
    <div className="overflow-hidden">
      <HeroBanner
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={scrollToExplore}
        onPrimaryCtaClick={scrollToExplore}
        onSecondaryCtaClick={() => {
          setSelectedCategory(null);
          setSearchQuery('Suya');
          scrollToExplore();
        }}
      />

      <HomeStatStrip />

      <main className="bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          {error ? (
            <EmptyState
              icon={ExclamationTriangleIcon}
              title="We couldn’t load restaurants"
              description={error}
              actionLabel="Try again"
              onAction={fetchRestaurants}
            />
          ) : loading ? (
            <section aria-labelledby="loading-restaurants-heading">
              <SectionHeader
                id="loading-restaurants-heading"
                eyebrow="Explore"
                title="Finding the best kitchens near you"
                subtitle="Loading trusted restaurants and fresh local favourites."
              />
              <div className={gridClasses}>
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <RestaurantCardSkeleton key={index} />
                ))}
              </div>
            </section>
          ) : (
            <>
              <section aria-labelledby="discover-heading" className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-card sm:p-6 lg:p-8">
                <SectionHeader
                  id="discover-heading"
                  eyebrow="Discover"
                  title="Filter by cuisine"
                  subtitle="Choose a cuisine lane or search above to refine restaurants instantly."
                  className="mb-5"
                />
                <CategoryChips restaurants={restaurants} selected={selectedCategory} onSelect={setSelectedCategory} />
              </section>

              {!hasActiveFilters && <FeaturedRestaurants restaurants={restaurants} />}

              <CuisineSpotlight
                onSelectCategory={setSelectedCategory}
                onSearch={setSearchQuery}
                onExplore={scrollToExplore}
              />

              <HowItWorks />

              <section ref={exploreRef} id="explore-restaurants" aria-labelledby="explore-restaurants-heading" className="scroll-mt-28 pt-16">
                <SectionHeader
                  id="explore-restaurants-heading"
                  eyebrow="Explore restaurants"
                  title={hasActiveFilters ? 'Restaurants matching your taste' : 'All restaurants'}
                  subtitle={hasActiveFilters ? 'Results update as you search or change cuisine filters.' : 'Browse trusted kitchens serving fresh African meals today.'}
                />

                {filteredRestaurants.length === 0 ? (
                  <EmptyState
                    icon={MagnifyingGlassIcon}
                    title={restaurants.length === 0 ? 'No restaurants yet' : 'No matching restaurants'}
                    description={emptyDescription}
                    actionLabel={restaurants.length > 0 && hasActiveFilters ? 'Clear filters' : undefined}
                    onAction={restaurants.length > 0 && hasActiveFilters ? resetFilters : undefined}
                  />
                ) : (
                  <div className={gridClasses}>
                    {filteredRestaurants.map((restaurant) => (
                      <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
