import React from 'react';
import { NFT_CATEGORIES, NFTCategory } from '../types/nft';

interface CategoryTabsProps {
  /** Currently selected category, or 'All' for no filter */
  active: NFTCategory | 'All';
  /** Called when the user selects a category */
  onChange: (category: NFTCategory | 'All') => void;
  /** Map of category -> count, used to display badges */
  counts: Record<string, number>;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ active, onChange, counts }) => {
  const tabs: { id: NFTCategory | 'All'; label: string; icon: string }[] = [
    { id: 'All', label: 'All', icon: '✨' },
    ...NFT_CATEGORIES,
  ];

  return (
    <div
      role="tablist"
      aria-label="NFT categories"
      className="flex flex-wrap justify-center gap-3 mb-8"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const count = tab.id === 'All' ? counts.All ?? 0 : counts[tab.id] ?? 0;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ease-in-out shadow-sm transform hover:-translate-y-0.5 ${
              isActive
                ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] border-transparent shadow-md'
                : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-xs ${
                isActive
                  ? 'bg-white/25 text-[var(--button-primary-text)]'
                  : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
