// src/pages/wallet.tsx
import { useState } from 'react';
import { allNfts } from '@/data/mockNfts';
import type { NFT } from '@/types/nft';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NFTCard from '@/components/NFTCard';

export default function WalletDashboard() {
  // For now, simulate "my" NFTs as a subset of the mock catalog.
  const [myNfts] = useState<NFT[]>(allNfts.slice(0, 4));

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold">My Wallet</h1>
        <p className="text-gray-500 mt-2">
          Manage your Kross assets and collectibles.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myNfts.map((nft) => (
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
