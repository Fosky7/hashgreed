import React from 'react';
import SectionHeader from '../ui/SectionHeader';

interface CuisineSpotlightProps {
  onSelectCategory: (category: string | null) => void;
  onSearch: (query: string) => void;
  onExplore?: () => void;
}

const cuisines = [
  { name: 'Jollof', description: 'Smoky party rice, chicken and plantain.', searchQuery: 'Jollof', emoji: '🍚', accent: 'from-orange-500 to-red-600' },
  { name: 'Suya', description: 'Spicy grilled skewers with yaji heat.', category: 'Suya', emoji: '🔥', accent: 'from-amber-500 to-orange-700' },
  { name: 'Swallows', description: 'Pounded yam, amala, eba and soups.', category: 'Nigerian', emoji: '🥣', accent: 'from-emerald-500 to-lime-700' },
  { name: 'Pepper Soup', description: 'Hot, aromatic comfort bowls.', searchQuery: 'Pepper Soup', emoji: '🌶️', accent: 'from-red-500 to-rose-700' },
  { name: 'Mama Put', description: 'Everyday local plates with big flavour.', searchQuery: 'Mama Put', emoji: '🍛', accent: 'from-slate-700 to-gray-950' },
];

const CuisineSpotlight: React.FC<CuisineSpotlightProps> = ({ onSelectCategory, onSearch, onExplore }) => {
  const handleSelect = (cuisine: (typeof cuisines)[number]) => {
    if ('category' in cuisine && cuisine.category) {
      onSearch('');
      onSelectCategory(cuisine.category);
    } else if ('searchQuery' in cuisine && cuisine.searchQuery) {
      onSelectCategory(null);
      onSearch(cuisine.searchQuery);
    }
    onExplore?.();
  };

  return (
    <section aria-labelledby="cuisine-spotlight-heading" className="mt-16">
      <SectionHeader
        id="cuisine-spotlight-heading"
        eyebrow="Cuisine spotlight"
        title="Cravings worth exploring"
        subtitle="Tap a flavour lane to instantly discover restaurants serving what you love."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cuisines.map((cuisine) => (
          <button
            key={cuisine.name}
            type="button"
            onClick={() => handleSelect(cuisine)}
            className={`group min-h-48 overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${cuisine.accent} p-5 text-left text-white shadow-card transition hover:-translate-y-1 hover:shadow-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`}
            aria-label={`Explore ${cuisine.name}`}
          >
            <span className="text-4xl" aria-hidden="true">{cuisine.emoji}</span>
            <h3 className="mt-8 text-xl font-black tracking-tight">{cuisine.name}</h3>
            <p className="mt-2 text-sm leading-6 text-white/85">{cuisine.description}</p>
            <span className="mt-5 inline-flex text-sm font-bold text-white/95 transition group-hover:translate-x-1">
              Explore →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CuisineSpotlight;
