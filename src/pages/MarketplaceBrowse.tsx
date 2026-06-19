import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NFTCard from '../components/NFTCard';
import NftGridSkeleton from '../components/NftGridSkeleton';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { NFT_CATEGORIES, NFTCategory } from '../types/nft';

type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'name-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Listed' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

const parsePrice = (price: string): number => {
  const match = String(price).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

/**
 * Public marketplace browse page mounted at /marketplace.
 *
 * Root-cause fix: the old /marketplace route rendered a wallet-only trading
 * form gated by RequireWallet + UnlockGate, so visitors without an unlocked
 * wallet saw a blank/redirected page. This page is fully public and always
 * renders meaningful content (it falls back to the local categorized catalog
 * if on-chain listings can't be loaded), with search, filters, sort, loading
 * skeletons and an inline error fallback.
 */
const MarketplaceBrowse: React.FC = () => {
  const { items, isLoading, error, source } = useMarketplaceListings();
  const [activeCategory, setActiveCategory] = useState<NFTCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Reset to the first page-friendly defaults whenever the dataset reloads.
  useEffect(() => {
    setActiveCategory('All');
  }, [source]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: items.length };
    for (const cat of NFT_CATEGORIES) {
      result[cat.id] = items.filter((nft) => nft.category === cat.id).length;
    }
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((nft) => {
      const matchesCategory =
        activeCategory === 'All' || nft.category === activeCategory;
      const matchesSearch =
        q === '' ||
        nft.name.toLowerCase().includes(q) ||
        nft.creator.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return sorted;
  }, [items, activeCategory, query, sortBy]);

  const hasFilters = activeCategory !== 'All' || query !== '' || sortBy !== 'recent';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero / heading */}
        <section className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow">
            Powered by the Kross Blockchain
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 drop-shadow-lg">
            NFT Marketplace
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            Discover, collect and trade digital art priced in KSS. Browse the
            latest drops across every category, or list your own creation.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/create">
              <button className="px-7 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Create Your NFT
              </button>
            </Link>
            <Link to="/marketplace/trade">
              <button className="px-7 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                List / Buy with Wallet
              </button>
            </Link>
          </div>
        </section>

        {/* Inline non-blocking notice if on-chain listings failed but fallback rendered */}
        {error && source === 'fallback' && (
          <div
            role="status"
            className="mb-6 mx-auto max-w-2xl rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3 text-center text-sm text-[var(--text-secondary)] shadow-sm"
          >
            Showing the curated collection while live on-chain listings are
            unavailable.
          </div>
        )}

        {/* Category filter chips */}
        <section className="mb-6" aria-label="Filter by category">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              aria-pressed={activeCategory === 'All'}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ease-in-out ${
                activeCategory === 'All'
                  ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] border-transparent shadow'
                  : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              All
              <span className="ml-2 text-xs opacity-80">{counts.All}</span>
            </button>
            {NFT_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? 'All' : cat.id)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ease-in-out flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] border-transparent shadow'
                      : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.label}
                  <span className="text-xs opacity-80">{counts[cat.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search + sort toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="relative w-full sm:max-w-md">
            <span
              className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]"
              aria-hidden="true"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or creator..."
              aria-label="Search marketplace"
              className="w-full pl-10 pr-4 py-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
            />
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="market-sort" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
              Sort by
            </label>
            <select
              id="market-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="p-2 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[var(--text-secondary)] text-sm" aria-live="polite">
            Showing{' '}
            <span className="font-semibold text-[var(--text-primary)]">{visible.length}</span>{' '}
            item{visible.length === 1 ? '' : 's'}
            {activeCategory !== 'All' && (
              <> in <span className="font-semibold text-[var(--color-primary)]">{activeCategory}</span></>
            )}
          </p>
          {hasFilters && (
            <button
              onClick={() => {
                setActiveCategory('All');
                setQuery('');
                setSortBy('recent');
              }}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Content: loading -> error (only if no fallback) -> grid -> empty */}
        {isLoading ? (
          <NftGridSkeleton count={8} />
        ) : error && source === 'none' ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4" aria-hidden="true">⚠️</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              We couldn&rsquo;t load the marketplace
            </p>
            <p className="text-[var(--text-secondary)] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] font-semibold shadow-lg"
            >
              Retry
            </button>
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {visible.map((nft) => (
              <NFTCard
                key={nft.id}
                id={nft.id}
                imageUrl={nft.imageUrl}
                name={nft.name}
                creator={nft.creator}
                price={nft.price}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">No items found</p>
            <p>Try a different category or search term.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MarketplaceBrowse;
