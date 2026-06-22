// src/lib/blockchain/kross/marketplace-queries.ts
//
// Read-only marketplace queries against the LIVE Kross mainnet node. These read
// the dApp data keys directly (no signing required).

import { KROSS_CONFIG, fromBaseUnits } from './config';

export interface Listing {
  assetId: string;
  /** Price in whole KSS. */
  price: number;
  /** Seller / lister address. */
  seller: string;
  /** Category label. */
  category: string;
  /** Whether the listing is currently active. */
  active: boolean;
}

/** Build a data-key fetch URL for the dApp address. */
function dataKeyUrl(dApp: string, key: string): string {
  return `${KROSS_CONFIG.nodeUrl}/addresses/data/${dApp}/${encodeURIComponent(key)}`;
}

async function readKey<T = unknown>(
  dApp: string,
  key: string
): Promise<T | null> {
  try {
    const res = await fetch(dataKeyUrl(dApp, key));
    if (!res.ok) return null;
    const body = (await res.json()) as { value: T };
    return body.value;
  } catch {
    return null;
  }
}

/**
 * Fetch a single listing by assetId so the UI can pre-fill the current price
 * and verify the connected wallet is the lister before allowing an update.
 * Returns null when no (active) listing exists.
 */
export async function getListing(assetId: string): Promise<Listing | null> {
  const dApp = KROSS_CONFIG.marketplaceDApp;
  if (!dApp || !assetId) return null;

  const base = `listing_${assetId}`;
  const [active, priceRaw, seller, category] = await Promise.all([
    readKey<boolean>(dApp, `${base}_active`),
    readKey<number>(dApp, `${base}_price`),
    readKey<string>(dApp, `${base}_seller`),
    readKey<string>(dApp, `${base}_category`),
  ]);

  // No listing data at all -> not found.
  if (priceRaw == null && seller == null) return null;

  return {
    assetId,
    price: priceRaw != null ? fromBaseUnits(priceRaw) : 0,
    seller: seller ?? '',
    category: category ?? '',
    active: active === true,
  };
}

/**
 * List all categories known to the marketplace dApp. Reads the `categories`
 * index key if present; returns an empty array when unconfigured.
 */
export async function getCategories(): Promise<string[]> {
  const dApp = KROSS_CONFIG.marketplaceDApp;
  if (!dApp) return [];
  const raw = await readKey<string>(dApp, 'categories');
  if (!raw) return [];
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Fetch all listings for a given category. Uses the node's data regex search to
 * collect matching keys, then assembles Listing objects.
 */
export async function getListingsByCategory(
  category: string
): Promise<Listing[]> {
  const dApp = KROSS_CONFIG.marketplaceDApp;
  if (!dApp || !category) return [];

  try {
    // Pull all `listing_*_category` entries and match the requested category.
    const res = await fetch(
      `${KROSS_CONFIG.nodeUrl}/addresses/data/${dApp}?matches=${encodeURIComponent(
        'listing_.*_category'
      )}`
    );
    if (!res.ok) return [];
    const entries = (await res.json()) as Array<{ key: string; value: string }>;

    const wanted = category.toLowerCase();
    const assetIds = entries
      .filter((e) => (e.value ?? '').toLowerCase() === wanted)
      .map((e) => {
        const m = e.key.match(/^listing_(.+)_category$/);
        return m ? m[1] : null;
      })
      .filter((x): x is string => !!x);

    const listings = await Promise.all(assetIds.map((id) => getListing(id)));
    return listings.filter(
      (l): l is Listing => !!l && l.active
    );
  } catch {
    return [];
  }
}
