// src/pages/UpdateNFTPrice.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { updateNFTPrice, waitForTx } from '@/lib/blockchain/kross/marketplace';
import {
  getListing,
  Listing,
} from '@/lib/blockchain/kross/marketplace-queries';

type Status = 'idle' | 'updating' | 'confirming' | 'done' | 'error';

export default function UpdateNFTPrice() {
  const { assetId = '' } = useParams();
  const { address, balance, refresh } = useKrossWallet();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [listingError, setListingError] = useState('');

  const [newPrice, setNewPrice] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [txUrl, setTxUrl] = useState('');

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
        active && setListingError(e instanceof Error ? e.message : 'Failed to load listing.')
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

  const canSubmit =
    isLister &&
    newPriceNum > 0 &&
    !unchanged &&
    !insufficient &&
    password.length >= 8 &&
    status !== 'updating' &&
    status !== 'confirming';

  const handleSubmit = async () => {
    setError('');
    setStatus('updating');
    try {
      const result = await updateNFTPrice({
        assetId,
        newPriceKSS: newPriceNum,
        password,
      });
      setTxUrl(result.explorerUrl);
      setStatus('confirming');
      await waitForTx(result.id);
      setStatus('done');
      setPassword('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
      setStatus('error');
    }
  };

  // --- Success state ---
  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-green-600">Price Updated!</h2>
        <p className="text-sm text-gray-600">
          New price: {newPriceNum} {KROSS_CONFIG.nativeCoin}
        </p>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-indigo-600 underline"
        >
          View on Explorer
        </a>
        <Link
          to={`/marketplace/explore/${encodeURIComponent(
            (listing?.category || '').toLowerCase()
          )}`}
          className="block w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          Back to listing
        </Link>
      </div>
    );
  }

  // --- Loading / error guards ---
  if (loadingListing) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-gray-500">
        Loading listing…
      </div>
    );
  }

  if (listingError || !listing) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h1 className="text-xl font-bold">Update Price</h1>
        <p className="text-sm text-red-600">
          {listingError || 'Listing not found.'}
        </p>
        <Link to="/explore" className="inline-block text-sm text-indigo-600 underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Update NFT Price</h1>
      <p className="text-xs text-gray-400 break-all">{assetId}</p>

      <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Current Price</span>
          <span>
            {listing.price} {KROSS_CONFIG.nativeCoin}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Category</span>
          <span className="capitalize">{listing.category || '—'}</span>
        </div>
      </div>

      {!isLister && (
        <p className="text-sm text-red-600">
          Only the lister can update this price. Connect with the seller wallet
          ({listing.seller.slice(0, 8)}…{listing.seller.slice(-6)}).
        </p>
      )}

      <div>
        <label className="text-sm font-medium">
          New Price ({KROSS_CONFIG.nativeCoin})
        </label>
        <input
          type="number"
          min="0"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="0.0"
          disabled={!isLister}
          className="w-full p-3 rounded-xl border text-sm mt-1 disabled:opacity-50"
        />
        {newPrice !== '' && newPriceNum <= 0 && (
          <p className="text-xs text-red-600 mt-1">
            Price must be greater than zero.
          </p>
        )}
        {unchanged && (
          <p className="text-xs text-amber-600 mt-1">
            New price matches the current price.
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Wallet Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password to sign"
          disabled={!isLister}
          className="w-full p-3 rounded-xl border text-sm mt-1 disabled:opacity-50"
        />
      </div>

      <div className="rounded-xl bg-gray-50 p-4 text-sm flex justify-between">
        <span className="text-gray-500">Network Fee</span>
        <span className={insufficient ? 'text-red-600' : ''}>
          {fee} {KROSS_CONFIG.nativeCoin}
        </span>
      </div>
      {insufficient && (
        <p className="text-xs text-red-600">Insufficient balance for the fee.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
      >
        {status === 'updating'
          ? 'Signing...'
          : status === 'confirming'
          ? 'Confirming...'
          : 'Update Price'}
      </button>
    </div>
  );
}
