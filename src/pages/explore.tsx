import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NftGrid from '../components/NftGrid';
import CategoryTabs from '../components/CategoryTabs';
import { allNfts } from './NFTDetail'; // Import allNfts from NFTDetail
import { NFT_CATEGORIES, NFTCategory } from '../types/nft';

const ExplorePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<NFTCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts per category (plus 'All') for the tab badges.
  const counts = useMemo(() => {
    const result: Record<string, number> = { All: allNfts.length };
    for (const cat of NFT_CATEGORIES) {
      result[cat.id] = allNfts.filter((nft) => nft.category === cat.id).length;
    }
    return result;
  }, []);

  // Derive the visible NFTs from the active category + search query.
  const filteredNfts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allNfts.filter((nft) => {
      const matchesCategory =
        activeCategory === 'All' || nft.category === activeCategory;
      const matchesSearch =
        query === '' ||
        nft.name.toLowerCase().includes(query) ||
        nft.creator.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-2 text-[var(--text-primary)] text-center drop-shadow-lg">Explore NFT Categories</h2>
        <p className="text-center text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
          Discover digital collectibles across every category. Pick a category or search to refine your hunt.
        </p>

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

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[var(--text-secondary)] text-sm">
            Showing <span className="font-semibold text-[var(--text-primary)]">{filteredNfts.length}</span>
            {activeCategory !== 'All' && (
              <> in <span className="font-semibold text-[var(--color-primary)]">{activeCategory}</span></>
            )}
          </p>
          {(activeCategory !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
              }}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredNfts.length > 0 ? (
          <NftGrid nfts={filteredNfts} />
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
