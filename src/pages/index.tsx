// src/pages/index.tsx
import { allNfts } from '@/data/mockNfts';
import type { NFT } from '@/types/nft';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NFTCard from '@/components/NFTCard';

export default function Home() {
  const featured = allNfts.slice(0, 6);
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-4xl font-black tracking-tight">
          The Kross NFT marketplace
        </h1>
        <p className="text-gray-500 mt-3">
          Discover, collect, and sell extraordinary digital assets.
        </p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map((nft) => (
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
      </main>
      <Footer />
    </div>
  );
}
