// src/lib/blockchain/kross/marketplace-queries.ts
//
// Read-only marketplace queries against the LIVE Kross mainnet node. These read
// the dApp data keys directly (no signing required).

import { KROSS_CONFIG, fromBaseUnits } from './config';

export interface Listing {
  assetId: string;
  /** Price in whole KSS. */
  price: number;
  /** Price in KSS (alias used by some consumers). */
  priceKSS: number;
  /** Price in wavelets. */
  priceWavelets: number;
  /** Seller / lister address. */
  seller: string;
  /** Category label. */
  category: string;
  /** Whether the listing is currently active. */
  active: boolean;
}

export interface MarketplaceFees {
  commissionBps: number;
  royaltyBps: number;
  feeWallet: string;
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

// Simple in-memory cache for listings.
let _listingsCache: Listing[] | null = null;

/** Drop the cached listings so the next read refetches from the node. */
export function invalidateListingsCache(): void {
  _listingsCache = null;
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

  if (priceRaw == null && seller == null) return null;

  const priceWavelets = priceRaw != null ? Number(priceRaw) : 0;
  return {
    assetId,
    price: priceRaw != null ? fromBaseUnits(priceRaw) : 0,
    priceKSS: priceRaw != null ? fromBaseUnits(priceRaw) : 0,
    priceWavelets,
    seller: seller ?? '',
    category: category ?? '',
    active: active === true,
  };
}

/**
 * Fetch ALL active listings from the dApp. Reads every `listing_*_price` key
 * then assembles full Listing objects. Cached until invalidated.
 */
export async function getListings(): Promise<Listing[]> {
  if (_listingsCache) return _listingsCache;

  const dApp = KROSS_CONFIG.marketplaceDApp;
  if (!dApp) return [];

  try {
    const res = await fetch(
      `${KROSS_CONFIG.nodeUrl}/addresses/data/${dApp}?matches=${encodeURIComponent(
        'listing_.*_price'
      )}`
    );
    if (!res.ok) return [];
    const entries = (await res.json()) as Array<{ key: string; value: number }>;

    const assetIds = entries
      .map((e) => {
        const m = e.key.match(/^listing_(.+)_price$/);
        return m ? m[1] : null;
      })
      .filter((x): x is string => !!x);

    const listings = await Promise.all(assetIds.map((id) => getListing(id)));
    _listingsCache = listings.filter(
      (l): l is Listing => !!l && l.priceWavelets > 0
    );
    return _listingsCache;
  } catch {
    return [];
  }
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

/** Read on-chain fee/royalty params; falls back to zeros when unconfigured. */
export async function getMarketplaceFees(): Promise<MarketplaceFees> {
  const dApp = KROSS_CONFIG.marketplaceDApp;
  if (!dApp) return { commissionBps: 0, royaltyBps: 0, feeWallet: '' };
  const [fee, royalty, wallet] = await Promise.all([
    readKey<number>(dApp, 'feeBps'),
    readKey<number>(dApp, 'royaltyBps'),
    readKey<string>(dApp, 'feeWallet'),
  ]);
  return {
    commissionBps: fee != null ? Number(fee) : 0,
    royaltyBps: royalty != null ? Number(royalty) : 0,
    feeWallet: wallet ?? '',
  };
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
    return listings.filter((l): l is Listing => !!l && l.active);
  } catch {
    return [];
  }
}
