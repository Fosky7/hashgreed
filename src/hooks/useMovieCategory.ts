import { useEffect, useMemo, useState } from 'react';
import { Movie, MovieCategory, MovieSortOption } from '../types/movie';
import { movieCategories, getMoviesByCategory } from '../data/movies';

interface UseMovieCategoryOptions {
  search: string;
  genre: string;
  sort: MovieSortOption;
}

interface MovieCategoryStats {
  total: number;
  avgRating: string;
  topRated: string;
  newestYear: string;
}

interface UseMovieCategoryResult {
  isLoading: boolean;
  category: MovieCategory | undefined;
  movies: Movie[];
  genres: string[];
  stats: MovieCategoryStats;
}

const sortMovies = (list: Movie[], sort: MovieSortOption): Movie[] => {
  const copy = [...list];
  switch (sort) {
    case 'rating-asc':
      return copy.sort((a, b) => a.rating - b.rating);
    case 'rating-desc':
      return copy.sort((a, b) => b.rating - a.rating);
    case 'year-asc':
      return copy.sort((a, b) => a.year - b.year);
    case 'year-desc':
      return copy.sort((a, b) => b.year - a.year);
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy;
  }
};

export const useMovieCategory = (
  id: string | undefined,
  options: UseMovieCategoryOptions
): UseMovieCategoryResult => {
  const { search, genre, sort } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<MovieCategory | undefined>(undefined);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching the category + its movies from an API.
    const timer = setTimeout(() => {
      const found = movieCategories.find((c) => c.id === id);
      setCategory(found);
      setAllMovies(found ? getMoviesByCategory(found.id) : []);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    allMovies.forEach((m) => set.add(m.genre));
    return Array.from(set).sort();
  }, [allMovies]);

  const movies = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allMovies.filter((m) => {
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q);
      const matchesGenre = genre === 'All' || m.genre === genre;
      return matchesSearch && matchesGenre;
    });
    return sortMovies(list, sort);
  }, [allMovies, search, genre, sort]);

  const stats = useMemo<MovieCategoryStats>(() => {
    if (allMovies.length === 0) {
      return { total: '0', avgRating: '—', topRated: '—', newestYear: '—' };
    }
    const avg = allMovies.reduce((sum, m) => sum + m.rating, 0) / allMovies.length;
    const top = Math.max(...allMovies.map((m) => m.rating));
    const newest = Math.max(...allMovies.map((m) => m.year));
    return {
      total: String(allMovies.length),
      avgRating: avg.toFixed(1),
      topRated: top.toFixed(1),
      newestYear: String(newest),
    };
  }, [allMovies]);

  return { isLoading, category, movies, genres, stats };
};
