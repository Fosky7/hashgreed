export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  rating: number; // out of 10
  year: number;
  genre: string;
  director: string;
  categoryId: string;
  synopsis?: string;
}

export interface MovieCategory {
  id: string;
  name: string;
  curator: string;
  description: string;
  bannerUrl: string;
}

export type MovieSortOption =
  | 'rating-desc'
  | 'rating-asc'
  | 'year-desc'
  | 'year-asc'
  | 'title-asc';
