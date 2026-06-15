export interface CategoryStats {
  volume: string;
  floorPrice: string;
  owners: string;
}

export interface Category {
  id: string;
  name: string;
  curator: string;
  description: string;
  bannerUrl: string;
  stats: CategoryStats;
  nftIds: string[];
}

export const categories: Category[] = [
  {
    id: 'abstract',
    name: 'Abstract Visions',
    curator: '0xArtist1',
    description:
      'A bold collection of abstract digital works exploring color, geometry, and emotion. Each piece pushes the boundaries of generative and hand-crafted art.',
    bannerUrl: '{{ASSET:category-abstract-banner.jpg}}',
    stats: { volume: '128 ETH', floorPrice: '0.5 ETH', owners: '342' },
    nftIds: ['1', '4', '7'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Realms',
    curator: '0xArtist2',
    description:
      'Neon-soaked cityscapes and futuristic dreamscapes. Dive into dystopian worlds rendered with stunning detail and atmosphere.',
    bannerUrl: '{{ASSET:category-cyberpunk-banner.jpg}}',
    stats: { volume: '256 ETH', floorPrice: '1.2 ETH', owners: '511' },
    nftIds: ['2', '6', '9'],
  },
  {
    id: 'nature',
    name: 'Digital Nature',
    curator: '0xArtist3',
    description:
      'Mystical forests, glitch gardens, and surreal landscapes where the organic meets the digital in harmonious balance.',
    bannerUrl: '{{ASSET:category-nature-banner.jpg}}',
    stats: { volume: '94 ETH', floorPrice: '0.6 ETH', owners: '208' },
    nftIds: ['3', '10', '5'],
  },
  {
    id: 'collectibles',
    name: 'Rare Collectibles',
    curator: 'Hashgreed Official',
    description:
      'Exclusive passes, limited edition collectibles, and unique digital personas reserved for the most dedicated collectors.',
    bannerUrl: '{{ASSET:category-collectibles-banner.jpg}}',
    stats: { volume: '480 ETH', floorPrice: '0.1 ETH', owners: '723' },
    nftIds: ['11', '12', '13', '8'],
  },
];
