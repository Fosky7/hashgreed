// src/types/movie.ts
export interface MovieCategory {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  banner?: string;
  thumbnail?: string;
  icon?: string;
  coverImage?: string;
  itemCount?: number;
  trending?: boolean;
}

export interface Movie {
  id: string;
  title: string;
  slug?: string;
  categoryId: string;
  poster: string;
  description?: string;
  year: number;
  rating: number;
  genre: string;
  director: string;
  priceEth?: number;
  creator?: string;
}

export type MovieSortOption =
  | 'rating-asc'
  | 'rating-desc'
  | 'year-asc'
  | 'year-desc'
  | 'title-asc';

export interface CategorizedNft {
  id: string;
  name: string;
  image: string;
  category: string;
  price?: number;
  creator?: string;
}

export type Nft = CategorizedNft;
