// src/pages/MarketplaceBrowse.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryFilterBar, {
  type CategoryFilter,
} from '@/components/CategoryFilterBar';
import BuyNowButton from '@/components/marketplace/BuyNowButton';
import {
  getListings,
  type Listing,
} from '@/lib/blockchain/kross/marketplace-listings';
import { useCategories } from '@/lib/blockchain/kross/useCategories';
import { categoryLabel } from '@/lib/blockchain/kross/categories';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/marketplace.config';
import DEPLOYED_CONFIG from '@/lib/blockchain/kross/deployed.config';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

interface AssetDetails {
  assetId: string;
  name: string;
  description: string;
  issuer?: string;
}

interface MarketplaceItem {
  listing: Listing;
  asset: AssetDetails;
  imageUrl: string | null;
}

const KSS_SYMBOL = DEPLOYED_CONFIG.nativeCoin.symbol;
const NODE_URL = KROSS_CONFIG.nodeUrl || DEPLOYED_CONFIG.nodeUrl;

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest listed' },
  { value: 'oldest', label: 'Oldest listed' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

function formatKss(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
  });
}

function truncate(value: string, left = 8, right = 6): string {
  if (!value) return 'Unknown';
  if (value.length <= left + right + 1) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function ipfsToHttp(value: string): string {
  if (value.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${value.replace('ipfs://', '').replace(/^ipfs\//, '')}`;
  }
  return value;
}

function looksLikeImageUrl(value: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(value);
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function metadataImage(metadata: Record<string, unknown>): string | null {
  const raw =
    metadata.image ??
    metadata.image_url ??
    metadata.imageUrl ??
    metadata.thumbnail ??
    metadata.thumbnailUrl;

  return typeof raw === 'string' && raw.trim()
    ? ipfsToHttp(raw.trim())
    : null;
}

async function resolveImageFromDescription(description: string): Promise<string | null> {
  const value = description?.trim();
  if (!value) return null;

  const parsed = safeJsonParse(value);
  if (parsed) return metadataImage(parsed);

  const normalized = ipfsToHttp(value);
  if (looksLikeImageUrl(normalized)) return normalized;

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const response = await fetch(normalized, {
        headers: { Accept: 'application/json' },
      });
      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) return null;

      if (contentType.includes('application/json')) {
        const metadata = await response.json();
        return metadata && typeof metadata === 'object'
          ? metadataImage(metadata as Record<string, unknown>)
          : null;
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function fetchAssetDetails(assetId: string): Promise<AssetDetails> {
  const response = await fetch(`${NODE_URL}/assets/details/${encodeURIComponent(assetId)}`);

  if (!response.ok) {
    return {
      assetId,
      name: `NFT ${truncate(assetId, 5, 5)}`,
      description: '',
    };
  }

  const data = await response.json();

  return {
    assetId,
    name:
      typeof data?.name === 'string' && data.name.trim()
        ? data.name.trim()
        : `NFT ${truncate(assetId, 5, 5)}`,
    description:
      typeof data?.description === 'string' ? data.description.trim() : '',
    issuer: typeof data?.issuer === 'string' ? data.issuer : undefined,
  };
}

async function enrichListing(listing: Listing): Promise<MarketplaceItem> {
  const asset = await fetchAssetDetails(listing.assetId);
  const imageUrl = await resolveImageFromDescription(asset.description);

  return {
    listing,
    asset,
    imageUrl,
  };
}

function ListingSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl"
        >
          <div className="aspect-square animate-pulse bg-white/[0.06]" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/[0.08]" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/[0.08]" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-white/[0.08]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketplaceCard({
  item,
  category,
  onPurchased,
}: {
  item: MarketplaceItem;
  category?: string;
  onPurchased: () => void;
}) {
  const { listing, asset, imageUrl } = item;
  const detailUrl = `/nft/${listing.assetId}`;
  const explorerAssetUrl = `${DEPLOYED_CONFIG.explorerUrl}/assets/${listing.assetId}`;
  const displayedCategory = category ? categoryLabel(category) : 'Uncategorized';

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.07]">
      <Link to={detailUrl} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/15 to-cyan-500/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={asset.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-4xl">
                  ✦
                </div>
                <p className="text-sm font-bold text-white/70">
                  Kross NFT
                </p>
                <p className="mt-1 break-all font-mono text-xs text-white/35">
                  {truncate(listing.assetId, 7, 7)}
                </p>
              </div>
            </div>
          )}

          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {displayedCategory}
          </div>

          <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#080A14] shadow-lg">
            Listed
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <Link
            to={detailUrl}
            className="line-clamp-1 text-lg font-black text-white transition hover:text-indigo-200"
            title={asset.name}
          >
            {asset.name}
          </Link>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/45">
            <a
              href={explorerAssetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono transition hover:text-white"
              title={listing.assetId}
            >
              {truncate(listing.assetId)}
            </a>
            <span>
              {listing.listedAt
                ? new Date(listing.listedAt).toLocaleDateString()
                : 'Listed'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Price
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatKss(listing.priceKSS)}{' '}
                <span className="text-base text-indigo-200">{KSS_SYMBOL}</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Seller
              </p>
              <a
                href={`${DEPLOYED_CONFIG.explorerUrl}/address/${listing.seller}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-mono text-xs text-white/65 transition hover:text-white"
                title={listing.seller}
              >
                {truncate(listing.seller, 6, 5)}
              </a>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            to={detailUrl}
            className="flex-1 rounded-2xl border border-white/10 px-4 py-2.5 text-center text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Details
          </Link>

          <BuyNowButton
            assetId={listing.assetId}
            priceKss={listing.priceKSS}
            listing={listing}
            seller={listing.seller}
            fullWidth={false}
            className="flex-1"
            onPurchased={onPurchased}
          >
            Buy
          </BuyNowButton>
        </div>
      </div>
    </article>
  );
}

export default function MarketplaceBrowse() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const assetIds = useMemo(
    () => items.map((item) => item.listing.assetId),
    [items],
  );

  const { categories, revalidate } = useCategories(assetIds);

  const loadMarketplace = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);

    setError('');

    try {
      const listings = await getListings();
      const enriched = await Promise.all(listings.map(enrichListing));

      enriched.sort((a, b) => {
        const bTime = b.listing.listedAt || 0;
        const aTime = a.listing.listedAt || 0;
        return bTime - aTime;
      });

      setItems(enriched);
      void revalidate(enriched.map((item) => item.listing.assetId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load marketplace listings.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [revalidate]);

  useEffect(() => {
    void loadMarketplace('initial');
  }, [loadMarketplace]);

  const categoryCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const category = categories[item.listing.assetId];
      if (!category) return acc;
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});
  }, [categories, items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;

    const filtered = items.filter((item) => {
      const itemCategory = categories[item.listing.assetId];

      if (categoryFilter !== 'all' && itemCategory !== categoryFilter) {
        return false;
      }

      if (min !== null && !Number.isNaN(min) && item.listing.priceKSS < min) {
        return false;
      }

      if (max !== null && !Number.isNaN(max) && item.listing.priceKSS > max) {
        return false;
      }

      if (!normalizedQuery) return true;

      const searchable = [
        item.asset.name,
        item.asset.description,
        item.listing.assetId,
        item.listing.seller,
        itemCategory ? categoryLabel(itemCategory) : '',
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (a.listing.listedAt || 0) - (b.listing.listedAt || 0);
        case 'price-asc':
          return a.listing.priceKSS - b.listing.priceKSS;
        case 'price-desc':
          return b.listing.priceKSS - a.listing.priceKSS;
        case 'name-asc':
          return a.asset.name.localeCompare(b.asset.name);
        case 'newest':
        default:
          return (b.listing.listedAt || 0) - (a.listing.listedAt || 0);
      }
    });
  }, [categoryFilter, categories, items, maxPrice, minPrice, query, sort]);

  const totalVolumeKss = useMemo(
    () => items.reduce((sum, item) => sum + item.listing.priceKSS, 0),
    [items],
  );

  const floorPriceKss = useMemo(() => {
    if (!items.length) return 0;
    return Math.min(...items.map((item) => item.listing.priceKSS));
  }, [items]);

  const clearFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.32),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.18),transparent_32%)]" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-indigo-200/80">
                Kross marketplace
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Explore listed NFTs
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
                Browse every active Kross NFT marketplace listing, filter by
                category or price, sort by market activity, and buy securely
                with native {KSS_SYMBOL}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadMarketplace('refresh')}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? 'Refreshing…' : 'Refresh listings'}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Active listings
              </p>
              <p className="mt-2 text-3xl font-black">{items.length}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Floor price
              </p>
              <p className="mt-2 text-3xl font-black">
                {items.length ? formatKss(floorPriceKss) : '—'}{' '}
                <span className="text-base text-indigo-200">{KSS_SYMBOL}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                Listed value
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatKss(totalVolumeKss)}{' '}
                <span className="text-base text-indigo-200">{KSS_SYMBOL}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/20 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr]">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/45">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, asset ID, seller…"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-indigo-400/60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/45">
                Min price
              </span>
              <input
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                inputMode="decimal"
                placeholder={`0 ${KSS_SYMBOL}`}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-indigo-400/60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/45">
                Max price
              </span>
              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                inputMode="decimal"
                placeholder={`Any ${KSS_SYMBOL}`}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-indigo-400/60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/45">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#070A14]">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <CategoryFilterBar
              value={categoryFilter}
              onChange={setCategoryFilter}
              counts={categoryCounts}
              totalCount={items.length}
            />

            <div className="flex items-center justify-between gap-3 text-sm text-white/45 xl:justify-end">
              <span>
                Showing{' '}
                <strong className="text-white">{filteredItems.length}</strong>{' '}
                of <strong className="text-white">{items.length}</strong>
              </span>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {error && (
            <div className="mb-6 rounded-3xl border border-rose-500/25 bg-rose-500/10 p-5 text-rose-100">
              <p className="font-black">Marketplace unavailable</p>
              <p className="mt-1 text-sm text-rose-100/75">{error}</p>
            </div>
          )}

          {loading ? (
            <ListingSkeletonGrid />
          ) : filteredItems.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl">
                🔎
              </div>
              <h2 className="text-2xl font-black">No listings found</h2>
              <p className="mx-auto mt-2 max-w-md text-white/55">
                Try changing your filters, clearing the search term, or
                refreshing the marketplace listings.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredItems.map((item) => (
                <MarketplaceCard
                  key={item.listing.assetId}
                  item={item}
                  category={categories[item.listing.assetId]}
                  onPurchased={() => void loadMarketplace('refresh')}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
