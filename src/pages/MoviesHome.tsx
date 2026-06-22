import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MovieCategoryCard from '../components/MovieCategoryCard';
import { useMovieCategories } from '../hooks/useMovieCategories';
import { MovieCategory } from '../types/movie';

const MoviesHome: React.FC = () => {
  const { categories, isLoading, error } = useMovieCategories();
  const [query, setQuery] = useState('');

  const visibleCategories = useMemo<MovieCategory[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero banner */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl border border-[var(--border-color)] mb-10">
          <img
            src="https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movies-hero.png"
            alt="Cinematic collection of movie scenes"
            className="w-full h-64 md:h-80 lg:h-96 object-cover"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/80 via-black/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">
              Discover Movies by Category
            </h1>
            <p className="text-white/85 text-base md:text-lg mb-6 leading-relaxed">
              Browse curated collections across Action, Comedy, Drama, Sci-Fi and more.
              Find your next favorite film to collect and explore.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/explore">
                <button className="px-6 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                  Browse All Movies
                </button>
              </Link>
              <Link to="/create">
                <button className="px-6 py-3 rounded-full bg-white/10 backdrop-blur border-2 border-white text-white hover:bg-white/20 transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                  Add a Movie
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Search bar */}
        <section className="mb-10" aria-label="Search movie categories">
          <div className="relative w-full md:max-w-xl mx-auto">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movie categories..."
              aria-label="Search movie categories"
              className="w-full pl-10 pr-4 py-3 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-sm"
            />
          </div>
        </section>

        {/* Section heading */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Browse Categories</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Pick a genre to start exploring.</p>
          </div>
          <Link to="/explore" className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap">
            View all →
          </Link>
        </div>

        {/* Error state */}
        {error && (
          <p className="text-center text-red-500 py-12" role="alert">{error}</p>
        )}

        {/* Loading skeletons */}
        {isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label="Loading movie categories">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] animate-pulse">
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
          visibleCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleCategories.map((category) => (
                <MovieCategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <p className="text-5xl mb-4" aria-hidden="true">🎬</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">No categories found</p>
              <p>Try a different search term.</p>
            </div>
          )
        )}

        {/* CTA */}
        <section className="mt-16 text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl py-12 px-6 shadow-xl">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Ready to explore the cinema universe?</h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-xl mx-auto">
            Dive into the full movie marketplace or add your own title in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/explore">
              <button className="px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Browse Marketplace
              </button>
            </Link>
            <Link to="/create">
              <button className="px-8 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Add a Movie
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MoviesHome;
