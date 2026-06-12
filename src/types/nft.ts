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
  | 'Metaverse'
  | 'Music';

export const NFT_CATEGORIES: { id: NFTCategory; label: string; icon: string }[] = [
  { id: 'Art', label: 'Art', icon: '🎨' },
  { id: 'Photography', label: 'Photography', icon: '📷' },
  { id: 'Collectibles', label: 'Collectibles', icon: '🧸' },
  { id: 'Gaming', label: 'Gaming', icon: '🎮' },
  { id: 'Metaverse', label: 'Metaverse', icon: '🌐' },
  { id: 'Music', label: 'Music', icon: '🎵' },
];
