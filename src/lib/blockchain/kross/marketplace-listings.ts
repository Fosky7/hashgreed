// src/lib/blockchain/kross/marketplace-listings.ts
import { MARKETPLACE_CONFIG, KROSS_CONFIG } from './marketplace.config';

const NODE_URL = KROSS_CONFIG.nodeUrl as string;

export interface Listing {
  assetId: string;
  seller: string;
  priceWavelets: number;
  priceKSS: number;
  listedAt: number;
}

/**
 * Query the marketplace dApp's data store for active listings.
 * Listings are assumed to be stored as data entries with key `listing_{assetId}`
 * and value = JSON `{ seller, price, listedAt }`.
 */
export async function getListings(): Promise<Listing[]> {
  const url = `${NODE_URL}/addresses/data/${MARKETPLACE_CONFIG.dAppAddress}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch listings (${res.status})`);
  const entries: any[] = await res.json();

  const listingEntries = entries.filter(
    (e: any) => typeof e?.key === 'string' && e.key.startsWith('listing_'),
  );

  return listingEntries
    .map((e: any) => {
      try {
        const data = JSON.parse(e.value);
        return {
          assetId: e.key.slice('listing_'.length),
          seller: data.seller || '',
          priceWavelets: Number(data.price) || 0,
          priceKSS: Number(data.price) / 1e8,
          listedAt: Number(data.listedAt) || 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Listing[];
}

/** Fetch a single listing by assetId. */
export async function getListing(assetId: string): Promise<Listing | null> {
  const url = `${NODE_URL}/addresses/data/${MARKETPLACE_CONFIG.dAppAddress}/${encodeURIComponent(`listing_${assetId}`)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  try {
    const entry = await res.json();
    const data = JSON.parse(entry.value);
    return {
      assetId,
      seller: data.seller,
      priceWavelets: Number(data.price),
      priceKSS: Number(data.price) / 1e8,
      listedAt: Number(data.listedAt),
    };
  } catch {
    return null;
  }
}
