import React, { useMemo } from 'react';
import { Restaurant } from '../types/Restaurant';

interface CategoryChipsProps {
  restaurants: Restaurant[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const CategoryChips: React.FC<CategoryChipsProps> = ({ restaurants, selected, onSelect }) => {
  const categories = useMemo(() => {
    const unique = new Set<string>();
    restaurants.forEach((restaurant) => {
      if (restaurant.cuisine.trim()) {
        unique.add(restaurant.cuisine.trim());
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  if (restaurants.length === 0) {
    return null;
  }

  const chips: Array<{ label: string; value: string | null }> = [
    { label: 'All', value: null },
    ...categories.map((category) => ({ label: category, value: category })),
  ];

  return (
    <div aria-label="Filter restaurants by cuisine" className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-2 pb-1">
        {chips.map((chip) => {
          const isActive = selected === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSelect(chip.value)}
              aria-pressed={isActive}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChips;
