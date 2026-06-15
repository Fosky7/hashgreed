import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NFTCard from '../components/NFTCard';
import { useCategorizedNfts } from '../hooks/useCategorizedNfts';

const ExploreByCategory: React.FC = () => {
  const { groups, totalItems, isLoading, error } = useCategorizedNfts();
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (nft) =>
            nft.name.toLowerCase().includes(q) ||
            nft.creator.toLowerCase().includes(q) ||
            group.label.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const visibleTotal = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero / heading */}
        <section className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 drop-shadow-lg">
            Explore NFTs by Category
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            Browse curated digital collectibles on the Kross Blockchain. Pick a vibe,
            explore the latest drops and start collecting.
          </p>
        </section>

        {/* Prominent total count banner */}
        {!isLoading && !error && (
          <section
            className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
            aria-label="Marketplace totals"
          >
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center shadow-md">
              <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Total Items</p>
              <p className="text-3xl font-extrabold text-[var(--color-primary)] mt-1">
                {totalItems.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center shadow-md">
              <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Categories</p>
              <p className="text-3xl font-extrabold text-[var(--color-primary)] mt-1">
                {groups.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center shadow-md">
              <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Per Category</p>
              <p className="text-3xl font-extrabold text-[var(--color-primary)] mt-1">10-15</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">items in every collection</p>
            </div>
          </section>
        )}

        {/* Search */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search NFTs, creators or categories..."
              aria-label="Search NFTs"
              className="w-full pl-10 pr-4 py-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
            />
          </div>
        </div>

        {/* Category quick-jump chips */}
        {!isLoading && !error && groups.length > 0 && (
          <nav aria-label="Jump to category" className="mb-10 flex flex-wrap justify-center gap-3">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#cat-${group.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-sm"
              >
                <span aria-hidden="true">{group.icon}</span>
                {group.label}
                <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-xs bg-[var(--hover-bg)] text-[var(--text-secondary)]">
                  {group.items.length}
                </span>
              </a>
            ))}
          </nav>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-red-500 py-12" role="alert">{error}</p>
        )}

        {/* Loading skeletons */}
        {isLoading && !error && (
          <div className="space-y-10" aria-busy="true" aria-label="Loading NFTs">
            {Array.from({ length: 3 }).map((_, s) => (
              <div key={s}>
                <div className="h-8 w-48 rounded bg-[var(--hover-bg)] animate-pulse mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((__, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] animate-pulse">
                      <div className="w-full h-48 bg-[var(--hover-bg)]" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 w-2/3 rounded bg-[var(--hover-bg)]" />
                        <div className="h-3 w-1/2 rounded bg-[var(--hover-bg)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visible count summary while searching */}
        {!isLoading && !error && query && (
          <p className="mb-6 text-center text-sm text-[var(--text-secondary)]" aria-live="polite">
            <strong className="text-[var(--color-primary)]">{visibleTotal}</strong> result
            {visibleTotal === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
          </p>
        )}

        {/* Grouped category galleries */}
        {!isLoading && !error && (
          <>
            {filteredGroups.length > 0 ? (
              <div className="space-y-14">
                {filteredGroups.map((group) => (
                  <section
                    key={group.id}
                    id={`cat-${group.id}`}
                    aria-labelledby={`heading-${group.id}`}
                    className="scroll-mt-24"
                  >
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <h2
                        id={`heading-${group.id}`}
                        className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3"
                      >
                        <span aria-hidden="true" className="text-2xl">{group.icon}</span>
                        {group.label}
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow">
                          {group.items.length} items
                        </span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {group.items.map((nft) => (
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
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-[var(--text-secondary)]">
                <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">No NFTs found</p>
                <p>Try a different search term.</p>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <section className="mt-16 text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl py-12 px-6 shadow-xl">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Ready to mint your own?</h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-xl mx-auto">
            Create a unique NFT on the Kross Blockchain in minutes, or keep exploring the full marketplace.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/explore">
              <button className="px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Open Marketplace
              </button>
            </Link>
            <Link to="/create">
              <button className="px-8 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Create an NFT
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ExploreByCategory;
