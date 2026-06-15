import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NftGrid from '../components/NftGrid';
import CategoryTabs from '../components/CategoryTabs';
import { allNfts } from './NFTDetail'; // Import allNfts from NFTDetail
import { NFT_CATEGORIES, NFTCategory } from '../types/nft';
import { buildCategoryGroups } from '../data/categorizedNfts';

type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'name-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

// Native Kross asset symbol. Any legacy ETH/KROSS label is shown as KSS.
const normalizeCurrency = (price: string): string =>
  String(price).replace(/\b(ETH|KROSS)\b/gi, 'KSS');

// Parse a price string like "0.45 KROSS" / "1.2 ETH" into a comparable number.
const parsePrice = (price: string): number => {
  const match = String(price).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

// Safety net: normalize any legacy 'Metaverse' label to 'Movies' so stale
// data or cached values can never resurface the old category name in the UI.
const normalizeCategoryLabel = (label: string): string =>
  label === 'Metaverse' || label === 'metaverse' ? 'Movies' : label;

// Normalize the Kross marketplace currency: any legacy ETH amount is shown as KROSS.
const normalizePrice = (price: string): string =>
  String(price).replace(/\bETH\b/gi, 'KROSS');

// Normalize a category value coming from NFT data so 'Metaverse' is mapped to
// 'Movies' before any comparison or display happens.
const normalizeCategory = (category?: string): string =>
  category ? normalizeCategoryLabel(category) : 'Uncategorized';

const ExplorePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<NFTCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // ---------------------------------------------------------------------------
  // Single source of truth for the catalog.
  //
  // BUG FIX: The category cards previously counted `allNfts.filter(category === id)`,
  // but most `allNfts` entries do not carry a category matching the canonical
  // NFT_CATEGORIES slugs, so every category resolved to 0 ("0 items").
  //
  // `buildCategoryGroups()` guarantees 10-15 correctly-tagged items per category,
  // so we derive BOTH the counts and the grid from it. Any legacy `allNfts`
  // entries that already have a valid category are merged in (de-duped by id) so
  // nothing is lost.
  // ---------------------------------------------------------------------------
  const catalog = useMemo(() => {
    const validIds = new Set<string>(NFT_CATEGORIES.map((c) => c.id));
    const byId = new Map<string, typeof allNfts[number]>();

    // 1) Seed with the guaranteed-populated categorized catalog.
    for (const group of buildCategoryGroups()) {
      for (const item of group.items) {
        byId.set(item.id, { ...item, category: group.id });
      }
    }

    // 2) Merge in any hand-authored NFTs that already have a real category.
    for (const nft of allNfts) {
      if (nft.category && validIds.has(nft.category) && !byId.has(nft.id)) {
        byId.set(nft.id, nft);
      }
    }

    return Array.from(byId.values());
  }, []);

  // Counts per category (plus 'All') for the tab badges and category cards.
  const counts = useMemo(() => {
    const result: Record<string, number> = { All: catalog.length };
    for (const cat of NFT_CATEGORIES) {
      result[cat.id] = catalog.filter((nft) => nft.category === cat.id).length;
    }
    return result;
  }, [catalog]);

  // Derive the visible NFTs from the active category + search query, then sort.
  const filteredNfts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = catalog.filter((nft) => {
      const matchesCategory =
        activeCategory === 'All' || nft.category === activeCategory;
      const matchesSearch =
        query === '' ||
        nft.name.toLowerCase().includes(query) ||
        nft.creator.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    const sorted = [...result];
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
      case 'recent':
      default:
        break;
    }
    return sorted;
  }, [catalog, activeCategory, searchQuery, sortBy]);

  // Normalize the displayed currency without mutating the source data.
  const displayNfts = useMemo(
    () => filteredNfts.map((nft) => ({ ...nft, price: normalizeCurrency(nft.price) })),
    [filteredNfts]
  );

  // Three highest-priced items act as the spotlight for the page banner.
  const spotlight = useMemo(
    () =>
      [...catalog]
        .sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
        .slice(0, 3)
        .map((nft) => ({ ...nft, price: normalizeCurrency(nft.price) })),
    [catalog]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-2 text-[var(--text-primary)] text-center drop-shadow-lg">Explore NFTs</h2>
        <p className="text-center text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
          Discover digital collectibles across every category on the Kross Blockchain. Pick a category or search to refine your hunt.
        </p>

        {/* Featured spotlight banner */}
        {spotlight.length > 0 && (
          <section
            className="mb-12 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl"
            aria-label="Featured NFTs spotlight"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative min-h-[18rem]">
                <img
                  src="https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/explore-spotlight.png"
                  alt="Featured digital art collection on the Kross marketplace"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow">
                  ✦ Curated Spotlight
                </span>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Today&rsquo;s Top Picks</h3>
                <p className="text-[var(--text-secondary)] mb-5 text-sm">
                  The highest-valued drops trending across the marketplace right now.
                </p>
                <ul className="space-y-3">
                  {spotlight.map((nft, i) => (
                    <li key={nft.id}>
                      <Link
                        to={`/nft/${nft.id}`}
                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-sm font-bold shrink-0" aria-hidden="true">
                          {i + 1}
                        </span>
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          loading="lazy"
                          className="w-12 h-12 rounded-md object-cover shrink-0"
                        />
                        <span className="min-w-0 flex-grow">
                          <span className="block font-semibold text-[var(--text-primary)] truncate">{nft.name}</span>
                          <span className="block text-xs text-[var(--text-secondary)] truncate">by {nft.creator}</span>
                        </span>
                        <span className="font-bold text-[var(--color-primary)] whitespace-nowrap">{nft.price}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Browse by Category card grid */}
        <section className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {NFT_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? 'All' : cat.id)}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all duration-300 ease-in-out shadow-sm transform hover:-translate-y-1 ${
                    isActive
                      ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] border-transparent shadow-lg'
                      : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  <span className="text-3xl mb-2" aria-hidden="true">{cat.icon}</span>
                  <span className="font-semibold text-sm">{cat.label}</span>
                  <span className={`text-xs mt-1 ${isActive ? 'text-[var(--button-primary-text)]/80' : 'text-[var(--text-secondary)]'}`}>
                    {counts[cat.id] ?? 0} items
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search bar */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or creator..."
            aria-label="Search NFTs"
            className="w-full sm:w-96 p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
          />
        </div>

        {/* Category tabs */}
        <CategoryTabs active={activeCategory} onChange={setActiveCategory} counts={counts} />

        {/* Results toolbar: count + sort + clear */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <p className="text-[var(--text-secondary)] text-sm" aria-live="polite">
            Showing <span className="font-semibold text-[var(--text-primary)]">{displayNfts.length}</span>
            {' '}item{displayNfts.length === 1 ? '' : 's'}
            {activeCategory !== 'All' && (
              <> in <span className="font-semibold text-[var(--color-primary)]">{activeCategory}</span></>
            )}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="explore-sort" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
              Sort by
            </label>
            <select
              id="explore-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="p-2 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {(activeCategory !== 'All' || searchQuery || sortBy !== 'recent') && (
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                  setSortBy('recent');
                }}
                className="text-sm font-semibold text-[var(--color-primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {displayNfts.length > 0 ? (
          <NftGrid nfts={displayNfts} />
        ) : (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">No NFTs found</p>
            <p>Try a different category or search term.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ExplorePage;
