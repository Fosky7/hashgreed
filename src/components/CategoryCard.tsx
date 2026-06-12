import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types/category';

interface CategoryCardProps {
  category: Category;
}

const formatItemCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  }
  return count.toString();
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { id, name, coverImage, itemCount, floorPrice, trending } = category;

  return (
    <Link
      to={`/explore?category=${id}`}
      aria-label={`Browse ${name} category`}
      className="group block rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    >
      <div className="relative">
        <img
          src={coverImage}
          alt={`${name} category cover`}
          loading="lazy"
          className="w-full h-44 object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
        {trending && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-md">
            🔥 Trending
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{name}</h3>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Items</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{formatItemCount(itemCount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Floor</p>
            <p className="text-sm font-bold text-[var(--color-primary)]">{floorPrice}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
