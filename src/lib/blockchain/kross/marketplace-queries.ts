// src/lib/blockchain/kross/marketplace-queries.ts
//
// MARKETPLACE LISTINGS READ MODULE (READ) for the Kross Marketplace dApp.
// -----------------------------------------------------------------------------
// This unit is the chain-query layer the marketplace UI calls to fetch ACTIVE
// listings, prices, sellers and NFT ownership. It is READ-ONLY:
//
//   1. Read every account-data state entry under the marketplace dApp address
//      from the indexed Kross Explorer API (NEVER an RPC write node).
//   2. Parse the per-asset listing keys written by kross-marketplace.ride
//      (`listing_<assetId>_price` / `listing_<assetId>_seller`, or a single
//      packed `listing_<assetId>` value) into a normalized intermediate.
//   3. Enrich each listing with NFT asset metadata (name, image, issuer =
//      creator) via the asset-details endpoint.
//   4. Return a stable `Listing[]` the UI (ListingCard, sale + api modules)
//      already consumes. Transient endpoint failures NEVER throw -> [].
//
// It REUSES the resilient endpoint config in ./config.ts. It does NOT build,
// sign or broadcast anything (that is the WRITE units' job).
import './polyfills';
import { fromWavelets } from './config';
import { MARKETPLACE_CONFIG, MARKETPLACE_PARAMS } from './deployed.config';

/* ------------------------------------------------------------------ *
 * Public types — the read contract the UI depends on.
 * ------------------------------------------------------------------ */

/** A single active marketplace listing, normalized for the UI. */
export interface Listing {
  /** base58 NFT asset id. */
  assetId: string;
  /** Seller (current escrow depositor / owner) base58 address. */
  seller: string;
  /** Exact on-chain price in integer wavelets (money math source of truth). */
  priceWavelets: number;
  /** Human price in whole KSS (display). */
  priceKSS: number;
  /** NFT display name (from asset metadata). */
  name: string;
  /** NFT image URL when resolvable from metadata, else ''. */
  imageUrl: string;
  /** Asset issuer = creator address (royalty recipient). */
  creator: string;
  /** Optional listing category label. */
  category: string;
}

/** Marketplace fee/royalty parameters (basis points). */
export interface MarketplaceFees {
  feeBasisPoints: number;
  royaltyBasisPoints: number;
  feeWalletAddress: string;
}

/* ------------------------------------------------------------------ *
 * Endpoint resolution (indexed READ API, with failover).
 * ------------------------------------------------------------------ */

function apiBases(): string[] {
  const c = KROSS_CONFIG as unknown as Record<string, unknown>;
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v) out.push(v.replace(/\/$/, ''));
  };
  push(c.apiUrl);
  if (Array.isArray(c.apiUrls)) (c.apiUrls as unknown[]).forEach(push);
  if (Array.isArray(c.nodeUrls)) (c.nodeUrls as unknown[]).forEach(push);
  push(c.nodeUrl);
  // Fallback to the known indexed Explorer API base.
  if (out.length === 0) out.push('https://krossexplorer.com/api');
  return Array.from(new Set(out));
}

async function fetchJson<T>(paths: string[]): Promise<T | null> {
  for (const base of apiBases()) {
    for (const path of paths) {
      try {
        const res = await fetch(`${base}${path}`, {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) continue;
        return (await res.json()) as T;
      } catch {
        // try next path / base
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * State-entry reading + parsing.
 * ------------------------------------------------------------------ */

interface DataEntry {
  key: string;
  type?: string;
  value: string | number | boolean;
}

/** Read ALL data entries stored under the marketplace dApp account. */
async function readDataEntries(dApp: string): Promise<DataEntry[]> {
  // Node/Explorer addresses-data shapes vary; try the common ones.
  const raw = await fetchJson<unknown>([
    `/addresses/data/${dApp}`,
    `/v1/addresses/${dApp}/data`,
    `/address/${dApp}/data`,
  ]);
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] }).data)
    ? (raw as { data: unknown[] }).data
    : [];
  return (arr as DataEntry[]).filter(
    (e) => e && typeof e.key === 'string'
  );
}

/** Intermediate listing parsed from raw state, before metadata enrichment. */
interface RawListing {
  assetId: string;
  priceWavelets: number;
  seller: string;
  category: string;
}

/**
 * Parse listing keys written by kross-marketplace.ride. Supports both layouts:
 *   - split:  listing_<assetId>_price (int) + listing_<assetId>_seller (string)
 *   - packed: listing_<assetId> = "<seller>:<priceWavelets>[:<category>]"
 * Only entries with a positive price AND a seller are treated as ACTIVE.
 */
function parseListings(entries: DataEntry[]): RawListing[] {
  const byAsset = new Map<string, RawListing>();
  const ensure = (assetId: string): RawListing => {
    let r = byAsset.get(assetId);
    if (!r) {
      r = { assetId, priceWavelets: 0, seller: '', category: '' };
      byAsset.set(assetId, r);
    }
    return r;
  };

  for (const e of entries) {
    if (!e.key.startsWith('listing_')) continue;
    const rest = e.key.slice('listing_'.length);

    if (rest.endsWith('_price')) {
      const assetId = rest.slice(0, -'_price'.length);
      const n = Number(e.value);
      if (Number.isFinite(n) && n > 0) ensure(assetId).priceWavelets = n;
    } else if (rest.endsWith('_seller')) {
      const assetId = rest.slice(0, -'_seller'.length);
      if (typeof e.value === 'string' && e.value) ensure(assetId).seller = e.value;
    } else if (rest.endsWith('_category')) {
      const assetId = rest.slice(0, -'_category'.length);
      if (typeof e.value === 'string') ensure(assetId).category = e.value;
    } else if (typeof e.value === 'string' && e.value.includes(':')) {
      // packed layout: listing_<assetId> = seller:price[:category]
      const [seller, price, category = ''] = e.value.split(':');
      const n = Number(price);
      if (seller && Number.isFinite(n) && n > 0) {
        const r = ensure(rest);
        r.seller = seller;
        r.priceWavelets = n;
        r.category = category;
      }
    }
  }

  return Array.from(byAsset.values()).filter(
    (r) => r.priceWavelets > 0 && r.seller.length > 0
  );
}

/* ------------------------------------------------------------------ *
 * NFT asset metadata enrichment (name, image, issuer/creator).
 * ------------------------------------------------------------------ */

interface AssetDetails {
  name?: string;
  description?: string;
  issuer?: string;
  // Some indexers expose parsed image/url fields; fall back to description.
  image?: string;
  url?: string;
}

function extractImage(d: AssetDetails): string {
  const candidate = d.image || d.url || '';
  if (candidate && /^(https?:|ipfs:|data:)/i.test(candidate)) return candidate;
  // Try to recover an image URL embedded in the description.
  const m = (d.description || '').match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)/i);
  return m ? m[0] : '';
}

async function fetchAssetDetails(assetId: string): Promise<AssetDetails | null> {
  return fetchJson<AssetDetails>([
    `/assets/details/${assetId}`,
    `/v1/assets/${assetId}`,
    `/asset/${assetId}`,
  ]);
}

async function enrich(raw: RawListing): Promise<Listing> {
  const details = (await fetchAssetDetails(raw.assetId)) || {};
  return {
    assetId: raw.assetId,
    seller: raw.seller,
    priceWavelets: raw.priceWavelets,
    priceKSS: fromWavelets(raw.priceWavelets),
    name: details.name || `NFT ${raw.assetId.slice(0, 6)}…`,
    imageUrl: extractImage(details),
    creator: details.issuer || raw.seller,
    category: raw.category,
  };
}

/* ------------------------------------------------------------------ *
 * In-memory cache (short TTL) so the UI can poll cheaply. Invalidated
 * by the WRITE units after a sale/list/cancel (invalidateListingsCache).
 * ------------------------------------------------------------------ */

const CACHE_TTL_MS = 15_000;
let cache: { at: number; data: Listing[] } | null = null;

/** Drop the cached listings so the next read hits the chain. */
export function invalidateListingsCache(): void {
  cache = null;
}

/* ================================================================== *
 * PUBLIC READ API.
 * ================================================================== */

/**
 * Fetch all ACTIVE marketplace listings with prices, sellers, NFT metadata and
 * ownership. Never throws on transient endpoint failure -> returns []. Results
 * are cached briefly; call invalidateListingsCache() after a mutating tx.
 */
export async function getListings(): Promise<Listing[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const dApp = MARKETPLACE_CONFIG.dAppAddress as string;
  if (!dApp || dApp.startsWith('<') || dApp.includes('BASE58')) {
    return [];
  }

  try {
    const entries = await readDataEntries(dApp);
    const raw = parseListings(entries);
    const data = await Promise.all(raw.map(enrich));
    // Stable order: cheapest first, then by assetId for determinism.
    data.sort((a, b) =>
      a.priceWavelets - b.priceWavelets || a.assetId.localeCompare(b.assetId)
    );
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return cache?.data ?? [];
  }
}

/** Fetch a single active listing by assetId, or null. */
export async function getListing(assetId: string): Promise<Listing | null> {
  const all = await getListings();
  return all.find((l) => l.assetId === assetId) ?? null;
}

/** Distinct, sorted category labels present across active listings. */
export async function getCategories(): Promise<string[]> {
  const all = await getListings();
  const set = new Set<string>();
  for (const l of all) if (l.category) set.add(l.category);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Active listings filtered to one category (case-insensitive). */
export async function getListingsByCategory(category: string): Promise<Listing[]> {
  const want = (category ?? '').trim().toLowerCase();
  const all = await getListings();
  if (!want) return all;
  return all.filter((l) => l.category.toLowerCase() === want);
}

/** Read the marketplace fee/royalty parameters (from deployed config). */
export async function getMarketplaceFees(): Promise<MarketplaceFees> {
  return {
    feeBasisPoints: MARKETPLACE_PARAMS.feeBasisPoints,
    royaltyBasisPoints: MARKETPLACE_PARAMS.royaltyBasisPoints,
    feeWalletAddress: MARKETPLACE_PARAMS.feeWalletAddress,
  };
}
