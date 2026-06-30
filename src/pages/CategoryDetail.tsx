// src/pages/CategoryDetail.tsx
import { useParams } from 'react-router-dom';
import { allNfts } from '@/data/mockNfts';
import type { NFT } from '@/types/nft';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import NFTCard from '@/components/NFTCard';

export default function CategoryDetail() {
  const { category } = useParams<{ category: string }>();
  const filtered = allNfts.filter(
    (nft) => nft.category?.toLowerCase() === (category ?? '').toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <BackButton to="/explore" label="All Categories" />
        <h1 className="text-3xl font-bold mt-4">
          {category ?? 'Category'}
        </h1>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {filtered.map((nft) => (
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
          <p className="text-gray-500 mt-8 text-center">
            No NFTs found in this category yet.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
