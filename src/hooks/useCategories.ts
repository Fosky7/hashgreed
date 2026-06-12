import { useEffect, useState } from 'react';
import { Category } from '../types/category';

const MOCK_CATEGORIES: Category[] = [
  { id: 'art', name: 'Art', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-art.png', itemCount: 12840, floorPrice: '0.45 ETH', trending: true },
  { id: 'music', name: 'Music', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-music.png', itemCount: 5230, floorPrice: '0.18 ETH', trending: true },
  { id: 'photography', name: 'Photography', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-photography.png', itemCount: 8710, floorPrice: '0.32 ETH', trending: false },
  { id: 'gaming', name: 'Gaming', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-gaming.png', itemCount: 21450, floorPrice: '0.6 ETH', trending: true },
  { id: 'collectibles', name: 'Collectibles', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-collectibles.png', itemCount: 16320, floorPrice: '0.9 ETH', trending: false },
  { id: 'virtual-worlds', name: 'Virtual Worlds', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-virtual-worlds.png', itemCount: 4120, floorPrice: '1.2 ETH', trending: false },
  { id: 'sports', name: 'Sports', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-art.png', itemCount: 6980, floorPrice: '0.25 ETH', trending: false },
  { id: 'pfps', name: 'PFPs & Avatars', coverImage: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/category-collectibles.png', itemCount: 19870, floorPrice: '0.75 ETH', trending: true },
];

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Provides NFT category data. Simulates an async fetch so the UI can
 * exercise loading and error states. Replace the timeout with a real
 * API call when a backend is available.
 */
export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      if (!isMounted) return;
      try {
        setCategories(MOCK_CATEGORIES);
      } catch (e) {
        setError('Unable to load categories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { categories, isLoading, error };
};
