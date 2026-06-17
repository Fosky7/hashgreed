// src/lib/blockchain/kross/marketplace-queries.ts
import { KROSS_CONFIG, fromWavelets } from './config';
import { MARKETPLACE_CONFIG } from './deployed.config';

export interface Listing {
  assetId: string;
  name: string;
  imageUrl: string;
  description: string;
  category: string;
  priceKSS: number;
  seller: string;
}

/**
 * Read all active listings from the marketplace dApp data storage.
 * Convention: each listing is stored as keys:
 *   listing_<assetId>_price, _seller, _category
 * and asset metadata is fetched from the asset details endpoint.
 */
export async function getListings(): Promise<Listing[]> {
  if (!MARKETPLACE_CONFIG.dAppAddress) return [];

  const res = await fetch(
    `${KROSS_CONFIG.nodeUrl}/addresses/data/${MARKETPLACE_CONFIG.dAppAddress}`
  );
  if (!res.ok) throw new Error('Failed to fetch listings');
  const entries: Array<{ key: string; value: any }> = await res.json();

  // Group entries by assetId.
  const map = new Map<string, Partial<Listing>>();
  for (const e of entries) {
    const m = e.key.match(/^listing_(.+?)_(price|seller|category)$/);
    if (!m) continue;
    const [, assetId, field] = m;
    const cur = map.get(assetId) ?? { assetId };
    if (field === 'price') cur.priceKSS = fromWavelets(Number(e.value));
    if (field === 'seller') cur.seller = String(e.value);
    if (field === 'category') cur.category = String(e.value);
    map.set(assetId, cur);
  }

  // Enrich with asset metadata (name + image/description from issue tx).
  const listings = await Promise.all(
    [...map.values()].map(async (l) => {
      const meta = await getAssetMetadata(l.assetId!);
      return {
        assetId: l.assetId!,
        name: meta.name,
        imageUrl: meta.image,
        description: meta.description,
        category: l.category ?? 'Uncategorized',
        priceKSS: l.priceKSS ?? 0,
        seller: l.seller ?? '',
      } as Listing;
    })
  );

  return listings.filter((l) => l.priceKSS > 0);
}

async function getAssetMetadata(
  assetId: string
): Promise<{ name: string; image: string; description: string }> {
  try {
    const res = await fetch(`${KROSS_CONFIG.nodeUrl}/assets/details/${assetId}`);
    const data = await res.json();
    let image = '';
    let description = data.description ?? '';
    // NFT metadata stored as JSON in the description field.
    try {
      const parsed = JSON.parse(data.description);
      image = parsed.image ?? '';
      description = parsed.description ?? '';
    } catch {
      /* plain description */
    }
    return { name: data.name ?? 'Unknown', image, description };
  } catch {
    return { name: 'Unknown', image: '', description: '' };
  }
}

export async function getCategories(): Promise<string[]> {
  const listings = await getListings();
  return [...new Set(listings.map((l) => l.category))].sort();
}

export async function getListingsByCategory(
  category: string
): Promise<Listing[]> {
  const listings = await getListings();
  return listings.filter(
    (l) => l.category.toLowerCase() === category.toLowerCase()
  );
}
