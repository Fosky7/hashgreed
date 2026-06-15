import React from 'react';
import { Link } from 'react-router-dom';
import { MovieCategory } from '../types/movie';

interface MovieCategoryCardProps {
  category: MovieCategory;
}

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(count);
};

const MovieCategoryCard: React.FC<MovieCategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/category/${category.id}`}
      aria-label={`Explore ${category.name} movies, ${category.itemCount} titles`}
      className="group block rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out transform hover:-translate-y-1"
    >
      <div className="relative w-full h-44 overflow-hidden">
        <img
          src={category.coverImage}
          alt={`${category.name} category cover`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
        {category.trending && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow">
            🔥 Trending
          </span>
        )}
        <span className="absolute text-2xl bottom-3 left-3" aria-hidden="true">
          {category.icon}
        </span>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{category.name}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{formatCount(category.itemCount)} titles</p>
        </div>
        <span className="text-[var(--color-primary)] font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">
          Explore →
        </span>
      </div>
    </Link>
  );
};

export default MovieCategoryCard;
