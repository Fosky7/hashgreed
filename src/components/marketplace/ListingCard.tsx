// src/components/marketplace/ListingCard.tsx
import { useState } from 'react';
import { EXPLORER_URL, formatKSS } from '@/lib/blockchain/kross/config';

export interface ListingCardListing {
  assetId: string;
  name?: string;
  image?: string;
  seller?: string;
  priceWavelets: number;
  category?: string;
}

interface Props {
  listing: ListingCardListing;
  currentAddress?: string | null;
  busy?: boolean;
  onBuy?: () => void;
  onCancel?: () => void;
  onUpdatePrice?: (priceWavelets: number) => void;
}

export function ListingCard({
  listing,
  currentAddress,
  busy,
  onBuy,
  onCancel,
  onUpdatePrice,
}: Props) {
  const [newPrice, setNewPrice] = useState('');
  const isOwner =
    !!currentAddress && !!listing.seller && currentAddress === listing.seller;

  return (
    <div className="rounded-xl border bg-white overflow-hidden flex flex-col">
      {listing.image && (
        <img
          src={listing.image}
          alt={listing.name ?? listing.assetId}
          className="w-full aspect-square object-cover"
        />
      )}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <p className="font-semibold truncate">
          {listing.name ?? listing.assetId}
        </p>
        <p className="text-sm text-indigo-600 font-bold">
          {formatKSS(listing.priceWavelets)}
        </p>

        <div className="mt-auto space-y-2">
          {isOwner ? (
            <>
              <div className="flex gap-2">
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="New price (KSS)"
                  className="flex-1 min-w-0 p-2 rounded-lg border text-xs"
                />
                <button
                  disabled={busy || !newPrice}
                  onClick={() =>
                    onUpdatePrice?.(Math.round(Number(newPrice) * 1e8))
                  }
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs disabled:opacity-50"
                >
                  Update
                </button>
              </div>
              <button
                disabled={busy}
                onClick={onCancel}
                className="w-full py-2 rounded-lg border text-xs disabled:opacity-50"
              >
                Cancel Listing
              </button>
            </>
          ) : (
            <button
              disabled={busy}
              onClick={onBuy}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              Buy Now
            </button>
          )}
          <a
            href={`${EXPLORER_URL}/assets/${listing.assetId}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-[11px] text-gray-400 hover:text-gray-600"
          >
            View on explorer
          </a>
        </div>
      </div>
    </div>
  );
}
