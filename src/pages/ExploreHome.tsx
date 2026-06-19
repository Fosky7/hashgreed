// src/pages/ExploreHome.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCategories } from '@/lib/blockchain/kross/marketplace-queries';

/**
 * On-chain Kross category index — links to each per-category listings page.
 *
 * Hardened so it NEVER renders a stark blank white page: it always shows the
 * app shell (Header/Footer + themed background) plus a loading or empty state
 * even when the marketplace dApp address is unconfigured and `getCategories()`
 * returns an empty list.
 */
export default function ExploreHome() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((c) => active && setCategories(Array.isArray(c) ? c : []))
      .catch(() => active && setCategories([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-[var(--text-primary)] text-center drop-shadow-lg">
          Explore On-Chain Listings
        </h1>
        <p className="text-center text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
          Browse live Kross marketplace listings grouped by category. Prices are
          shown in KSS.
        </p>

        {loading ? (
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            aria-busy="true"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-10 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] animate-pulse"
              />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link
                key={c}
                to={`/marketplace/explore/${encodeURIComponent(
                  c.toLowerCase()
                )}`}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:shadow-md transition text-center font-medium capitalize"
              >
                {c}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <p className="text-5xl mb-4" aria-hidden="true">🛒</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              No on-chain listings yet
            </p>
            <p className="mb-6">
              Once NFTs are listed on the Kross marketplace they will appear here
              grouped by category.
            </p>
            <Link
              to="/explore"
              className="inline-block px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold"
            >
              Browse the marketplace
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
