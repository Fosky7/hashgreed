import { useEffect, useState } from 'react';
import { NFT, NFTCategory } from '../types/nft';
import { buildCategoryGroups } from '../data/categorizedNfts';

export type ListingSource = 'chain' | 'fallback' | 'none';

interface UseMarketplaceListingsResult {
  items: NFT[];
  isLoading: boolean;
  error: string | null;
  /** Where the rendered items came from. 'fallback' = local catalog. */
  source: ListingSource;
}

const CURRENCY = 'KSS';

/** Normalize any legacy currency label to the native KSS symbol. */
const normalizeCurrency = (price: string): string =>
  String(price).replace(/\b(ETH|KROSS)\b/gi, CURRENCY);

/**
 * Build the resilient local catalog from the guaranteed-populated category
 * groups. Each item carries a valid category so the marketplace filters work
 * even when on-chain listings are unavailable.
 */
function buildFallbackCatalog(): NFT[] {
  const byId = new Map<string, NFT>();
  for (const group of buildCategoryGroups()) {
    for (const item of group.items) {
      byId.set(item.id, {
        ...item,
        category: group.id as NFTCategory,
        price: normalizeCurrency(item.price),
      });
    }
  }
  return Array.from(byId.values());
}

/**
 * Loads marketplace listings for the public browse page.
 *
 * Resilience strategy (so the page is NEVER blank):
 *  1. Attempt to read live on-chain listings (best effort, lazy + guarded).
 *  2. If that yields nothing or throws, fall back to the curated local
 *     categorized catalog.
 *  3. Only surface a hard error (source: 'none') if even the fallback is empty.
 */
export function useMarketplaceListings(): UseMarketplaceListingsResult {
  const [items, setItems] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ListingSource>('none');

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      let chainItems: NFT[] = [];
      let chainError: string | null = null;

      // 1) Best-effort on-chain listings. Imported lazily so a failure in the
      //    blockchain layer can never crash the public marketplace page.
      try {
        const mod = await import('../lib/blockchain/kross/marketplace-queries');
        const listings = await mod.getListings();
        chainItems = (listings ?? []).map((l) => ({
          id: l.assetId,
          imageUrl: l.imageUrl,
          name: l.name || 'Untitled',
          creator: l.seller ? `${l.seller.slice(0, 6)}…${l.seller.slice(-4)}` : 'Unknown',
          price: `${l.priceKSS} ${CURRENCY}`,
          description: l.description,
          category: (l.category as NFTCategory) || undefined,
        }));
      } catch (e) {
        chainError = e instanceof Error ? e.message : 'Failed to load on-chain listings.';
      }

      if (!active) return;

      if (chainItems.length > 0) {
        setItems(chainItems);
        setSource('chain');
        setError(null);
        setIsLoading(false);
        return;
      }

      // 2) Fallback to the curated local catalog.
      const fallback = buildFallbackCatalog();
      if (fallback.length > 0) {
        setItems(fallback);
        setSource('fallback');
        // Keep the chain error only as a soft notice (page still renders).
        setError(chainError);
        setIsLoading(false);
        return;
      }

      // 3) Truly nothing to show.
      setItems([]);
      setSource('none');
      setError(chainError ?? 'No marketplace items are available right now.');
      setIsLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { items, isLoading, error, source };
}
