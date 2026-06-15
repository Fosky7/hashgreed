import { useEffect, useState } from 'react';
import { MovieCategory } from '../types/movie';
import { movieCategories } from '../data/movieCategories';

interface UseMovieCategoriesResult {
  categories: MovieCategory[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads the browsable movie categories. Simulates an async fetch so the UI
 * can render meaningful loading/error states.
 */
export const useMovieCategories = (): UseMovieCategoriesResult => {
  const [categories, setCategories] = useState<MovieCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      if (!active) return;
      try {
        setCategories(movieCategories);
      } catch {
        setError('Failed to load movie categories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return { categories, isLoading, error };
};
