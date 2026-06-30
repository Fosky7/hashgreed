// src/components/marketplace/ListingCard.tsx
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

export interface ListingCardListing {
  assetId: string;
  priceKSS?: number;
  price?: number;
  seller?: string;
  category?: string;
  name?: string;
  image?: string;
}

export interface ListingCardProps {
  listing: ListingCardListing;
  currentAddress?: string | null;
  busy?: boolean;
  onBuy?: () => void;
  onCancel?: () => void;
  onUpdatePrice?: (priceKSS: number) => void;
}

const SYMBOL = KROSS_CONFIG.nativeCoin?.symbol ?? 'KSS';
const EXPLORER = KROSS_CONFIG.explorerUrl ?? KROSS_CONFIG.EXPLORER_URL ?? 'https://krossexplorer.com';

export function ListingCard({
  listing,
  currentAddress,
  busy = false,
  onBuy,
  onCancel,
  onUpdatePrice,
}: ListingCardProps) {
  const price = listing.priceKSS ?? listing.price ?? 0;
  const isOwner =
    !!currentAddress && !!listing.seller && currentAddress === listing.seller;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-black/30">
        {listing.image ? (
          <img
            src={listing.image}
            alt={listing.name ?? listing.assetId}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
            No image
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="truncate text-sm font-semibold text-white">
          {listing.name ?? `${listing.assetId.slice(0, 8)}…`}
        </h3>
        {listing.category && (
          <p className="text-xs text-white/40">{listing.category}</p>
        )}
        <p className="text-sm font-medium text-indigo-300">
          {price} {SYMBOL}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        {isOwner ? (
          <>
            {onUpdatePrice && (
              <button
                disabled={busy}
                onClick={() => {
                  const v = prompt(`New price in ${SYMBOL}`, String(price));
                  const num = v ? parseFloat(v) : NaN;
                  if (num > 0) onUpdatePrice(num);
                }}
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                Update Price
              </button>
            )}
            {onCancel && (
              <button
                disabled={busy}
                onClick={onCancel}
                className="flex-1 rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-medium text-rose-300 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          onBuy && (
            <button
              disabled={busy}
              onClick={onBuy}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Buying…' : 'Buy'}
            </button>
          )
        )}
        <a
          href={`${EXPLORER}/assets/${listing.assetId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60"
        >
          View
        </a>
      </div>
    </div>
  );
}

export default ListingCard;
