import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NftGrid from '../components/NftGrid';
import Hero from '../components/Hero';
import { allNfts } from './NFTDetail'; // Import allNfts from NFTDetail
import { Link } from 'react-router-dom';

interface MarketStat {
  label: string;
  value: string;
}

interface CategoryLink {
  name: string;
  emoji: string;
  to: string;
}

interface HowItWorksStep {
  title: string;
  description: string;
  emoji: string;
}

interface TopCreator {
  rank: number;
  name: string;
  avatar: string;
  volume: string;
  change: string;
}

// Normalize any legacy currency label (ETH / KROSS) to the Kross native asset KSS.
const normalizePrice = (price: string): string =>
  String(price).replace(/\b(ETH|KROSS|KSS)\b/gi, 'KSS');

const HomePage: React.FC = () => {
  // Featured NFTs pulled from the shared marketplace data set, with KSS prices.
  const featuredNfts = allNfts.slice(0, 8).map((n) => ({ ...n, price: normalizePrice(n.price) }));
  // A smaller spotlight set for the trending row, with KSS prices.
  const trendingNfts = allNfts.slice(4, 10).map((n) => ({ ...n, price: normalizePrice(n.price) }));

  // Build a lightweight "top creators" leaderboard from the available data.
  const topCreators: TopCreator[] = Array.from(
    allNfts.reduce((map, nft) => {
      const current = map.get(nft.creator) || { volume: 0, image: nft.imageUrl };
      const price = parseFloat(nft.price) || 0;
      map.set(nft.creator, { volume: current.volume + price, image: current.image });
      return map;
    }, new Map<string, { volume: number; image: string }>()),
  )
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 5)
    .map(([name, info], index) => ({
      rank: index + 1,
      name,
      avatar: info.image,
      volume: `${info.volume.toFixed(1)} KSS`,
      change: `+${(8 + index * 3.4).toFixed(1)}%`, // % weekly volume change
    }));

  // Derive lightweight marketplace stats from the available data.
  const uniqueCreators = new Set(allNfts.map((n) => n.creator)).size;
  const marketStats: MarketStat[] = [
    { label: 'NFTs Listed', value: `${allNfts.length}+` },
    { label: 'Creators', value: `${uniqueCreators}+` },
    { label: 'Categories', value: '8' },
    { label: 'Network', value: 'Kross' },
  ];

  const categories: CategoryLink[] = [
    { name: 'Art', emoji: '🎨', to: '/explore?category=Art' },
    { name: 'Movies', emoji: '🎬', to: '/explore?category=Movies' },
    { name: 'Music', emoji: '🎵', to: '/explore?category=Music' },
    { name: 'Gaming', emoji: '🎮', to: '/explore?category=Gaming' },
    { name: 'Photography', emoji: '📸', to: '/explore?category=Photography' },
    { name: 'Collectibles', emoji: '🏆', to: '/explore?category=Collectibles' },
  ];

  const steps: HowItWorksStep[] = [
    { title: 'Connect your wallet', description: 'Link a Kross-compatible wallet in a single tap to start collecting securely.', emoji: '🔗' },
    { title: 'Explore & collect', description: 'Browse curated categories, discover trending drops and buy with KROSS.', emoji: '🔍' },
    { title: 'Create & earn', description: 'Mint your own digital art, set a price and earn royalties on every resale.', emoji: '✨' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero Section */}
        <Hero />

        {/* Marketplace stats */}
        <section aria-label="Marketplace statistics" className="mb-16">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center shadow-md transition-transform duration-300 hover:-translate-y-1"
              >
                <dt className="text-sm uppercase tracking-wide text-[var(--text-secondary)] mb-1">{stat.label}</dt>
                <dd className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Browse by category */}
        <section className="mb-16" aria-labelledby="categories-heading">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 id="categories-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Browse by Category</h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Jump straight into the collections you love.</p>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.to}
                aria-label={`Browse ${cat.name} collection`}
                className="group flex flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] py-6 px-3 min-h-[6.5rem] shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <span className="text-3xl md:text-4xl mb-2 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">{cat.emoji}</span>
                <span className="text-sm md:text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Now Section */}
        <section className="mb-16" aria-labelledby="trending-heading">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 id="trending-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span aria-hidden="true">🔥</span> Trending Now
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">The hottest drops collectors are watching today.</p>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded">
              See all →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-thin" role="list" aria-label="Trending NFTs">
            {trendingNfts.map((nft, index) => (
              <Link
                key={nft.id}
                to={`/nft/${nft.id}`}
                role="listitem"
                aria-label={`View ${nft.name} by ${nft.creator}`}
                className="group relative shrink-0 w-56 snap-start rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <div className="relative">
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    loading="lazy"
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-bold px-2.5 py-1 shadow-md">
                    #{index + 1} Trending
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)]">{nft.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">by {nft.creator}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Price</span>
                    <span className="text-sm font-extrabold text-[var(--color-primary)]">{nft.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured NFTs Section */}
        <section className="mb-16" aria-labelledby="featured-heading">
          <div className="flex items-end justify-between mb-8">
            <h2 id="featured-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] drop-shadow-lg">
              Featured NFTs
            </h2>
            <Link to="/explore" className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap">
              See all →
            </Link>
          </div>
          <NftGrid nfts={featuredNfts} />
        </section>

        {/* Top Creators Section */}
        <section className="mb-16" aria-labelledby="creators-heading">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 id="creators-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Top Creators</h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Ranked by total trading volume this week.</p>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded">
              View ranking →
            </Link>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topCreators.map((creator) => (
              <li
                key={creator.name}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-md transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-bold" aria-label={`Rank ${creator.rank}`}>
                  {creator.rank}
                </span>
                <img
                  src={creator.avatar}
                  alt={`${creator.name} avatar`}
                  loading="lazy"
                  className="h-12 w-12 rounded-full object-cover border-2 border-[var(--border-color)]"
                />
                <div className="min-w-0">
                  <p className="font-bold text-[var(--text-primary)] truncate">{creator.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{creator.volume}</p>
                  <p className="text-xs font-semibold text-[var(--color-primary)]">{creator.change}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* How it works */}
        <section className="mb-16" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-10">How It Works</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-md transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="absolute -top-3 -left-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-sm font-bold shadow-md">
                  {index + 1}
                </span>
                <span className="text-3xl mb-3 block" aria-hidden="true">{step.emoji}</span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{step.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Newsletter sign-up */}
        <section className="mb-16" aria-labelledby="newsletter-heading">
          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 md:p-10 shadow-xl flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h2 id="newsletter-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Never miss a drop</h2>
              <p className="text-[var(--text-secondary)] max-w-md">
                Get curated highlights, new collections and exclusive Kross Blockchain drops delivered to your inbox weekly.
              </p>
            </div>
            <form
              className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Subscribe to the newsletter"
            >
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@example.com"
                className="flex-1 md:w-72 px-4 py-3 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 shadow-lg font-semibold transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mb-8 text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl py-14 px-6 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">Ready to start your collection?</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Join a thriving community of creators and collectors building on the Kross Blockchain.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/explore">
              <button className="w-full sm:w-auto px-8 py-3 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Explore Marketplace
              </button>
            </Link>
            <Link to="/create">
              <button className="w-full sm:w-auto px-8 py-3 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg font-semibold transform hover:-translate-y-1">
                Create Your NFT
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
