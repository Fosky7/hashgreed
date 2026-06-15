export interface NFT {
  id: string;
  imageUrl: string;
  name: string;
  creator: string;
  price: string;
  description?: string; // Optional description for detail page
  owner?: string; // Optional owner for detail page
  category?: NFTCategory; // Logical category used by the Explore page
}

export type NFTCategory =
  | 'Art'
  | 'Photography'
  | 'Collectibles'
  | 'Gaming'
  | 'Movies'
  | 'Music';

import type { ReactNode } from 'react';
import MoviesNftIcon from '../components/icons/MoviesNftIcon';

export interface NFTCategoryMeta {
  id: NFTCategory;
  label: string;
  /** Emoji fallback rendered when no `iconNode` is supplied. */
  icon: string;
  /** Optional rich React icon node, used in preference to the emoji. */
  iconNode?: ReactNode;
}

export const NFT_CATEGORIES: NFTCategoryMeta[] = [
  { id: 'Art', label: 'Art', icon: '🎨' },
  { id: 'Photography', label: 'Photography', icon: '📷' },
  { id: 'Collectibles', label: 'Collectibles', icon: '🧸' },
  { id: 'Gaming', label: 'Gaming', icon: '🎮' },
  {
    id: 'Movies',
    label: 'Movies',
    icon: '🎬',
    iconNode: MoviesNftIcon({ size: 18, title: 'Movies NFT' }),
  },
  { id: 'Music', label: 'Music', icon: '🎵' },
];
