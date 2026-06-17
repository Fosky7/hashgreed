// src/components/marketplace/ListingCard.tsx
import { Listing } from '@/lib/blockchain/kross/marketplace-queries';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <a
      href={`/marketplace?buy=${listing.assetId}&price=${listing.priceKSS}`}
      className="block rounded-2xl border bg-white overflow-hidden hover:shadow-md transition"
    >
      <div className="aspect-square bg-gray-100">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium truncate">{listing.name}</p>
        <p className="text-xs text-gray-400 mb-1">{listing.category}</p>
        <p className="text-sm font-semibold text-indigo-600">
          {listing.priceKSS} {KROSS_CONFIG.nativeCoin}
        </p>
        <a
          href={`${KROSS_CONFIG.explorerUrl}/assets/${listing.assetId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-gray-400 underline"
        >
          View on explorer
        </a>
      </div>
    </a>
  );
}
