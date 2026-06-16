// Shared movie & NFT domain types.
// Centralized type definitions used across pages, hooks, components and data modules.

export interface MovieCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  banner?: string;
  thumbnail?: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  poster: string;
  description?: string;
  year?: number;
  priceEth?: number;
  creator?: string;
}

export interface CategorizedNft {
  id: string;
  name: string;
  image: string;
  category: string;
  price?: number;
  creator?: string;
}

export type Nft = CategorizedNft;
