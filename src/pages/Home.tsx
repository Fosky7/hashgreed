import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { buildCategoryGroups } from '../data/categorizedNfts';
import { NFT } from '../types/nft';

// Native Kross asset symbol. Normalize any legacy ETH/KROSS label to KSS.
const normalizeCurrency = (price: string): string =>
  String(price).replace(/\b(ETH|KROSS)\b/gi, 'KSS');

const HERO_IMAGE =
  'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/home-hero-marketplace.png';

interface MarketStat {
  label: string;
  value: string;
}

const MARKET_STATS: MarketStat[] = [
  { label: 'NFTs Minted', value: '48.2k' },
  { label: 'Active Creators', value: '6.1k' },
  { label: 'Floor Volume', value: '12.4k KSS' },
  { label: 'Categories', value: '6' },
];

const HomePage: React.FC = () => {
  // Pull a handful of real, categorized NFTs for the "Featured" strip so the
  // landing page shows genuine catalog content (not placeholders).
  const featured: NFT[] = React.useMemo(() => {
    const items: NFT[] = [];
    for (const group of buildCategoryGroups()) {
      if (group.items[0]) items.push({ ...group.items[0], category: group.id });
    }
    return items.slice(0, 4).map((nft) => ({ ...nft, price: normalizeCurrency(nft.price) }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />

      <main className="flex-grow">
        {/* Hero card */}
        <section className="container mx-auto px-4 pt-8 pb-12">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Copy */}
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <span className="inline-flex items-center gap-2 self-start px-3 py-1 mb-5 rounded-full text-xs font-bold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow">
                  <span aria-hidden="true">⛓️</span> Powered by the Kross Blockchain
                </span>

                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-[var(--text-primary)] mb-4 drop-shadow-lg">
                  Discover, Collect &amp; Create Digital Art NFTs
                </h1>

                <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                  Explore a vibrant marketplace of digital collectibles. Mint your own
                  one-of-a-kind NFTs, trade with creators worldwide, and own a piece of the
                  decentralized future — all secured on the Kross blockchain.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* PRIMARY FIX: this now links to the rich /explore page */}
                  <Link
                    to="/explore"
                    className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Explore Marketplace
                  </Link>
                  <Link
                    to="/create"
                    className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Create Your NFT
                  </Link>
                </div>
              </div>

              {/* Visual */}
              <div className="relative min-h-[18rem] lg:min-h-full">
                <img
                  src={HERO_IMAGE}
                  alt="A curated showcase of vibrant digital art NFTs on the Hashgreed marketplace"
                  loading="eager"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-t lg:bg-gradient-to-l from-black/50 via-transparent to-transparent"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Market stats */}
        <section className="container mx-auto px-4 pb-12" aria-label="Marketplace statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {MARKET_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center shadow-sm"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured NFTs */}
        <section className="container mx-auto px-4 pb-16" aria-label="Featured NFTs">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Featured Collectibles
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                A taste of what&rsquo;s trending across the marketplace.
              </p>
            </div>
            <Link
              to="/explore"
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
            >
              View all →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((nft) => (
                <Link
                  key={nft.id}
                  to={`/nft/${nft.id}`}
                  className="group rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{nft.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mb-2">
                      by {nft.creator}
                    </p>
                    <p className="font-bold text-[var(--color-primary)]">{nft.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--text-secondary)] py-12">
              No featured items available right now.
            </p>
          )}
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-16">
          <div className="text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl py-12 px-6 shadow-xl">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
              Ready to dive in?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-xl mx-auto">
              Browse the full marketplace or mint your own unique NFT in minutes — secured on
              the Kross blockchain.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1"
              >
                Explore Marketplace
              </Link>
              <Link
                to="/create"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1"
              >
                Create an NFT
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
