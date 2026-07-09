// src/data/mockNfts.ts
import type { NFT } from '@/types/nft';

const ASSET_BASE =
  'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets';

/**
 * Temporary demo/catalog NFT dataset used by legacy explore, category, home,
 * and wallet pages while the dApp transitions to real on-chain marketplace data.
 * Exported as `allNfts` so existing named imports still resolve without changes
 * to those consuming files (only the import path is updated).
 */
export const allNfts: NFT[] = [
  {
    id: '1',
    imageUrl: `${ASSET_BASE}/explore-nft-1.png`,
    name: 'Neon Genesis',
    creator: 'KrossArtist',
    price: '12 KSS',
    description:
      'A vibrant digital collectible inspired by cyberpunk color fields and Kross-native ownership.',
    owner: '3K9x8v...artist',
    category: 'Art',
  },
  {
    id: '2',
    imageUrl: `${ASSET_BASE}/explore-nft-2.png`,
    name: 'Aurora Frequency',
    creator: 'SoundMint',
    price: '8.5 KSS',
    description:
      'A music-inspired NFT with luminous waveform visuals and collectible metadata.',
    owner: '3K7m2p...sound',
    category: 'Music',
  },
  {
    id: '3',
    imageUrl: `${ASSET_BASE}/explore-nft-3.png`,
    name: 'Pixel Relic',
    creator: 'GameForge',
    price: '5 KSS',
    description:
      'A rare in-game collectible designed for cross-world gaming identity.',
    owner: '3K5q4r...game',
    category: 'Gaming',
  },
  {
    id: '4',
    imageUrl: `${ASSET_BASE}/explore-nft-4.png`,
    name: 'Analog Dream',
    creator: 'PhotoChain',
    price: '6.25 KSS',
    description:
      'A photographic collectible blending analog texture with on-chain provenance.',
    owner: '3K2t1n...photo',
    category: 'Photography',
  },
  {
    id: '5',
    imageUrl: `${ASSET_BASE}/explore-nft-5.png`,
    name: 'Collector Pass',
    creator: 'Hashgreed',
    price: '3.75 KSS',
    description:
      'A limited collectible pass for early Hashgreed marketplace supporters.',
    owner: '3K8z6c...pass',
    category: 'Collectibles',
  },
  {
    id: '6',
    imageUrl: `${ASSET_BASE}/explore-nft-6.png`,
    name: 'Cinema Frame #01',
    creator: 'MovieMint',
    price: '10 KSS',
    description:
      'A cinematic still collectible for movie NFT collectors on Kross.',
    owner: '3K4h9s...film',
    category: 'Movies',
  },
];
