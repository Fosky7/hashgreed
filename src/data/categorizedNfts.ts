import { NFT_CATEGORIES, NFTCategory } from '../types/nft';

export interface CategoryGroup {
  id: NFTCategory;
  label: string;
  icon: React.ReactNode;
  items: NFT[];
}

// Hosted asset URLs already present in the project. We rotate through these to
// give every generated NFT a real image without inventing new file paths.
const BASE = 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets';

const IMAGE_POOL: string[] = [
  `${BASE}/placeholder-nft-1.png`,
  `${BASE}/placeholder-nft-2.png`,
  `${BASE}/placeholder-nft-3.png`,
  `${BASE}/placeholder-nft-4.png`,
  `${BASE}/explore-nft-1.png`,
  `${BASE}/explore-nft-2.png`,
  `${BASE}/explore-nft-3.png`,
  `${BASE}/explore-nft-4.png`,
  `${BASE}/explore-nft-5.png`,
  `${BASE}/explore-nft-6.png`,
  `${BASE}/wallet-nft-1.png`,
  `${BASE}/wallet-nft-2.png`,
  `${BASE}/wallet-nft-3.png`,
];

// Movie categories use poster art so movie NFTs feel on-theme.
const MOVIE_POOL: string[] = [
  `${BASE}/movie-poster-action-1.png`,
  `${BASE}/movie-poster-scifi-1.png`,
  `${BASE}/movie-poster-drama-1.png`,
];

// Deterministic pseudo-random so the gallery is stable across renders.
const seeded = (seed: number): (() => number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const NAME_PARTS: Record<string, string[]> = {
  prefix: ['Neon', 'Cosmic', 'Mystic', 'Pixel', 'Golden', 'Ethereal', 'Crimson', 'Lunar', 'Quantum', 'Velvet', 'Solar', 'Phantom', 'Astral', 'Radiant', 'Frozen'],
  suffix: ['Genesis', 'Dreamscape', 'Horizon', 'Relic', 'Echo', 'Mirage', 'Odyssey', 'Fragment', 'Vision', 'Saga', 'Pulse', 'Aura', 'Realm', 'Spirit', 'Token'],
};

const priceFor = (rand: () => number): string => {
  const value = (0.15 + rand() * 2.85).toFixed(2);
  return `${value} KROSS`;
};

/**
 * Builds groups of NFTs by category. Each category is guaranteed to contain
 * between MIN_PER_CATEGORY (10) and MAX_PER_CATEGORY (15) items.
 */
export const buildCategoryGroups = (): CategoryGroup[] => {
  const MIN_PER_CATEGORY = 10;
  const MAX_PER_CATEGORY = 15;

  return NFT_CATEGORIES.map((cat, catIndex) => {
    const rand = seeded((catIndex + 1) * 7919);
    const range = MAX_PER_CATEGORY - MIN_PER_CATEGORY + 1; // 6 possible counts
    const count = MIN_PER_CATEGORY + Math.floor(rand() * range);
    const isMovies = cat.id === 'movies';
    const pool = isMovies ? [...MOVIE_POOL, ...IMAGE_POOL] : IMAGE_POOL;

    const items: NFT[] = Array.from({ length: count }).map((_, i) => {
      const prefix = NAME_PARTS.prefix[Math.floor(rand() * NAME_PARTS.prefix.length)];
      const suffix = NAME_PARTS.suffix[Math.floor(rand() * NAME_PARTS.suffix.length)];
      const creatorNum = 1000 + Math.floor(rand() * 8999);
      return {
        id: `${cat.id}-${i + 1}`,
        imageUrl: pool[i % pool.length],
        name: `${prefix} ${suffix} #${i + 1}`,
        creator: `0x${creatorNum.toString(16).padStart(4, '0')}…${(catIndex + i).toString(16).padStart(2, '0')}`,
        price: priceFor(rand),
        category: cat.id,
        description: `A ${cat.label.toLowerCase()} NFT minted on the Kross Blockchain.`,
      };
    });

    return {
      id: cat.id,
      label: cat.label,
      icon: cat.iconNode ?? cat.icon,
      items,
    };
  });
};
