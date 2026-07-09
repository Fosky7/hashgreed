// src/pages/MarketplacePage.tsx
import React from 'react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';

export default function MarketplacePage() {
  const { listings, loading, error, buy, cancel, updatePrice } = useMarketplace();
  const { address } = useKrossWallet();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">NFT Marketplace</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && listings.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-gray-200 h-80" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <p className="text-gray-600">No active listings yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((item) => (
            <ListingCard
              key={item.assetId}
              listing={item}
              currentAddress={address}
              onBuy={() => buy(item.assetId)}
              onCancel={() => cancel(item.assetId)}
              onUpdatePrice={(newPrice) => updatePrice(item.assetId, newPrice)}
              busy={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
