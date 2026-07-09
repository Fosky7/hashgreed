// src/pages/UpdateNFTPrice.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { useUpdateNftPrice } from '@/hooks/useUpdateNftPrice';
import {
  getListing,
  Listing,
} from '@/lib/blockchain/kross/marketplace-queries';

export default function UpdateNFTPrice() {
  const { assetId = '' } = useParams();
  const { address, balance, refresh } = useKrossWallet();
  const { update, status, error, txUrl, reset } = useUpdateNftPrice();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [listingError, setListingError] = useState('');

  const [newPrice, setNewPrice] = useState('');
  const [password, setPassword] = useState('');
  const [successAcknowledged, setSuccessAcknowledged] = useState(false);

  const fee = KROSS_CONFIG.fees.updateNFTPrice;
  const newPriceNum = parseFloat(newPrice) || 0;

  // Load the current listing on mount (and when asset/config changes).
  useEffect(() => {
    if (!KROSS_CONFIG.marketplaceDApp) {
      setListingError('Marketplace is not configured.');
      setLoadingListing(false);
      return;
    }
    let active = true;
    setLoadingListing(true);
    setListingError('');
    getListing(assetId)
      .then((l) => {
        if (!active) return;
        if (!l || !l.active) {
          setListingError('Listing not found or no longer active.');
        } else {
          setListing(l);
          setNewPrice(String(l.price));
        }
      })
      .catch((e) =>
        active &&
        setListingError(
          e instanceof Error ? e.message : 'Failed to load listing.'
        )
      )
      .finally(() => active && setLoadingListing(false));
    return () => {
      active = false;
    };
  }, [assetId]);

  const isLister =
    !!address && !!listing && address === listing.seller;
  const insufficient = fee > balance;
  const unchanged = !!listing && newPriceNum === listing.price;

  const isBusy = status === 'pending' || status === 'confirming';

  const canSubmit =
    isLister &&
    newPriceNum > 0 &&
    !unchanged &&
    !insufficient &&
    password.length >= 8 &&
    !isBusy &&
    !successAcknowledged;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await update({ assetId, newPriceKSS: newPriceNum, password });
  };

  // Refresh balance and reset success flag when transaction succeeds
  useEffect(() => {
    if (status === 'success' && !successAcknowledged) {
      refresh();
      setSuccessAcknowledged(true);
    }
  }, [status, successAcknowledged, refresh]);

  // Reset hook state on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Let user start a new update after success
  const handleNewUpdate = useCallback(() => {
    setSuccessAcknowledged(false);
    reset();
    setPassword('');
  }, [reset]);

  // --- Success state ---
  if (status === 'success' && successAcknowledged) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/20">
          <svg className="h-8 w-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-success)]">Price Updated!</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          New price: {newPriceNum} {KROSS_CONFIG.nativeCoin}
        </p>
        {txUrl ? (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium underline"
            style={{ color: 'var(--color-primary)' }}
          >
            View on Explorer ↗
          </a>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">Transaction link not available.</p>
        )}
        <Link
          to={`/marketplace/explore/${encodeURIComponent(
            (listing?.category || '').toLowerCase()
          )}`}
          className="block w-full py-3 rounded-xl font-semibold"
          style={{
            backgroundColor: 'var(--button-primary-bg)',
            color: 'var(--button-primary-text)',
          }}
        >
          Back to listing
        </Link>
        <button
          onClick={handleNewUpdate}
          className="text-sm underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Update price again
        </button>
      </div>
    );
  }

  // --- Loading / error guards ---
  if (loadingListing) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-[var(--text-secondary)]" aria-busy="true">
        Loading listing…
      </div>
    );
  }

  if (listingError || !listing) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Update Price</h1>
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {listingError || 'Listing not found.'}
        </p>
        <Link to="/explore" className="inline-block text-sm underline" style={{ color: 'var(--color-primary)' }}>
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Update NFT Price</h1>
      <p className="text-xs text-[var(--text-secondary)] break-all">{assetId}</p>

      <div className="rounded-xl bg-[var(--hover-bg)] p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Current Price</span>
          <span className="text-[var(--text-primary)]">
            {listing.price} {KROSS_CONFIG.nativeCoin}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Category</span>
          <span className="capitalize text-[var(--text-primary)]">{listing.category || '—'}</span>
        </div>
      </div>

      {!isLister && (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          Only the lister can update this price. Connect with the seller wallet
          ({listing.seller.slice(0, 8)}…{listing.seller.slice(-6)}).
        </p>
      )}

      <div>
        <label htmlFor="update-price" className="text-sm font-medium text-[var(--text-primary)]">
          New Price ({KROSS_CONFIG.nativeCoin}) <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="update-price"
          type="number"
          min="0"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="0.0"
          disabled={!isLister || isBusy}
          className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] mt-1 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {newPrice !== '' && newPriceNum <= 0 && (
          <p className="text-xs text-[var(--color-error)] mt-1">
            Price must be greater than zero.
          </p>
        )}
        {unchanged && (
          <p className="text-xs text-[var(--color-warning)] mt-1">
            New price matches the current price.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="update-password" className="text-sm font-medium text-[var(--text-primary)]">
          Wallet Password <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          id="update-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your wallet password"
          disabled={!isLister || isBusy}
          className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] mt-1 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {password.length > 0 && password.length < 8 && (
          <p className="text-xs text-[var(--color-error)] mt-1">Password must be at least 8 characters.</p>
        )}
      </div>

      <div className="rounded-xl bg-[var(--hover-bg)] p-4 text-sm flex justify-between">
        <span className="text-[var(--text-secondary)]">Network Fee</span>
        <span className={insufficient ? 'text-[var(--color-error)]' : 'text-[var(--text-primary)]'}>
          {fee} {KROSS_CONFIG.nativeCoin}
        </span>
      </div>
      {insufficient && (
        <p className="text-xs text-[var(--color-error)]">Insufficient balance to cover the fee.</p>
      )}

      {error && <p className="text-sm text-[var(--color-error)]" role="alert">{error}</p>}

      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        aria-busy={isBusy}
        className="w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--button-primary-bg)',
          color: 'var(--button-primary-text)',
        }}
      >
        {status === 'pending'
          ? 'Signing...'
          : status === 'confirming'
          ? 'Confirming...'
          : 'Update Price'}
      </button>
      {isBusy && (
        <p className="text-xs text-center text-[var(--text-secondary)]">
          Transaction in progress, please wait...
        </p>
      )}
    </div>
  );
}
