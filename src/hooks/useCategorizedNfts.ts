import { useEffect, useState } from 'react';
import { CategoryGroup, buildCategoryGroups } from '../data/categorizedNfts';

interface UseCategorizedNftsResult {
  groups: CategoryGroup[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads NFTs grouped by category. Each category is guaranteed to contain
 * between 10 and 15 items (enforced in buildCategoryGroups). Simulates an
 * async fetch so the UI can exercise loading states.
 */
export const useCategorizedNfts = (): UseCategorizedNftsResult => {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      if (!active) return;
      try {
        setGroups(buildCategoryGroups());
      } catch (e) {
        setError('We could not load the NFT categories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  return { groups, totalItems, isLoading, error };
};
