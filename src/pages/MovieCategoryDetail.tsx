import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MoviePosterCard from '../components/MoviePosterCard';
import { useMovieCategory } from '../hooks/useMovieCategory';
import { MovieSortOption } from '../types/movie';

const SORT_OPTIONS: { value: MovieSortOption; label: string }[] = [
  { value: 'rating-desc', label: 'Top Rated' },
  { value: 'rating-asc', label: 'Lowest Rated' },
  { value: 'year-desc', label: 'Newest First' },
  { value: 'year-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A–Z' },
];

const MovieCategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<string>('All');
  const [sort, setSort] = useState<MovieSortOption>('rating-desc');

  const { isLoading, category, movies, genres, stats } = useMovieCategory(id, {
    search,
    genre,
    sort,
  });

  // Not found (only after loading finished and no category resolved)
  if (!isLoading && !category) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Category not found</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            We couldn&apos;t find a movie category with ID &ldquo;{id}&rdquo;.
          </p>
          <Link to="/categories">
            <button className="px-6 py-3 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold">
              Back to Categories
            </button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold text-sm"
          aria-label="Go back"
        >
          &larr; Back
        </button>

        {/* Banner */}
        {isLoading ? (
          <div className="rounded-2xl overflow-hidden shadow-xl border border-[var(--border-color)] mb-8 animate-pulse">
            <div className="w-full h-48 md:h-64 lg:h-72 bg-[var(--hover-bg)]" />
          </div>
        ) : category ? (
          <section className="relative rounded-2xl overflow-hidden shadow-xl border border-[var(--border-color)] mb-8">
            <img
              src={category.bannerUrl}
              alt={`${category.name} category banner`}
              className="w-full h-48 md:h-64 lg:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <span className="inline-block mb-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-md">
                🎬 Movie Category
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">{category.name}</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">Curated by {category.curator}</p>
            </div>
          </section>
        ) : null}

        {/* Description */}
        {category && (
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-3xl mb-8">
            {category.description}
          </p>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10" aria-label="Category statistics">
          {[
            { label: 'Titles', value: stats.total },
            { label: 'Avg Rating', value: stats.avgRating },
            { label: 'Top Rated', value: stats.topRated },
            { label: 'Newest', value: stats.newestYear },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] shadow-md text-center"
            >
              <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-primary)] mt-1">
                {isLoading ? '—' : stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* Filter / Sort controls */}
        <section className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-8">
          <div className="relative w-full lg:max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies by title or director..."
              aria-label="Search movies"
              className="w-full pl-10 pr-4 py-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="genre" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">Genre</label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out cursor-pointer"
              >
                <option value="All">All genres</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">Sort by</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as MovieSortOption)}
                className="p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-[var(--text-secondary)] mb-4" aria-live="polite">
            Showing {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" aria-busy="true" aria-label="Loading movies">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] animate-pulse">
                <div className="w-full aspect-[2/3] bg-[var(--hover-bg)]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[var(--hover-bg)]" />
                  <div className="h-3 w-1/2 rounded bg-[var(--hover-bg)]" />
                </div>
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MoviePosterCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)] text-lg mb-4">
              No movies match your filters.
            </p>
            <button
              onClick={() => { setSearch(''); setGenre('All'); setSort('rating-desc'); }}
              className="px-6 py-3 rounded-md bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold"
            >
              Reset filters
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MovieCategoryDetail;
