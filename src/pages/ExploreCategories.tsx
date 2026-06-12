import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CategoryCard from '../components/CategoryCard';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../types/category';

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'items', label: 'Most Items' },
  { value: 'floor-asc', label: 'Floor: Low to High' },
  { value: 'floor-desc', label: 'Floor: High to Low' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const floorToNumber = (floor: string): number => parseFloat(floor.replace(/[^0-9.]/g, '')) || 0;

const ExploreCategoriesPage: React.FC = () => {
  const { categories, isLoading, error } = useCategories();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortValue>('trending');

  const trending = useMemo(
    () => categories.filter((c) => c.trending),
    [categories]
  );

  const visibleCategories = useMemo(() => {
    const filtered = categories.filter((c) =>
      c.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'items':
          return b.itemCount - a.itemCount;
        case 'floor-asc':
          return floorToNumber(a.floorPrice) - floorToNumber(b.floorPrice);
        case 'floor-desc':
          return floorToNumber(b.floorPrice) - floorToNumber(a.floorPrice);
        case 'trending':
        default:
          return Number(b.trending) - Number(a.trending);
      }
    });
    return sorted;
  }, [categories, query, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Page heading */}
        <section className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 drop-shadow-lg">
            Explore NFT Categories
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
            Browse curated collections across art, music, photography, gaming and more.
            Find your next favorite digital collectible.
          </p>
        </section>

        {/* Search + Sort controls */}
        <section
          className="mb-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
          aria-label="Category search and sorting"
        >
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories..."
              aria-label="Search categories"
              className="w-full pl-10 pr-4 py-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Trending strip */}
        {!isLoading && !error && trending.length > 0 && (
          <section className="mb-10" aria-label="Trending categories">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span aria-hidden="true">🔥</span> Trending Now
            </h2>
            <div className="flex flex-wrap gap-3">
              {trending.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setQuery(c.name)}
                  className="px-4 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--color-primary)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-sm"
                >
                  {c.name} · {c.floorPrice}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Error state */}
        {error && (
          <p className="text-center text-red-500 py-12" role="alert">
            {error}
          </p>
        )}

        {/* Loading skeletons */}
        {isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label="Loading categories">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] animate-pulse"
              >
                <div className="w-full h-44 bg-[var(--hover-bg)]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 rounded bg-[var(--hover-bg)]" />
                  <div className="h-3 w-1/2 rounded bg-[var(--hover-bg)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category grid */}
        {!isLoading && !error && (
          <section aria-label="All categories">
            {visibleCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleCategories.map((category: Category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--text-secondary)] py-12">
                No categories match &ldquo;{query}&rdquo;.
              </p>
            )}
          </section>
        )}

        {/* CTA */}
        <section className="mt-16 text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl py-12 px-6 shadow-xl">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
            Ready to start your collection?
          </h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-xl mx-auto">
            Dive into the full marketplace or mint your own unique NFT in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/explore">
              <button className="px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Browse Marketplace
              </button>
            </Link>
            <Link to="/create">
              <button className="px-8 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Create an NFT
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ExploreCategoriesPage;
