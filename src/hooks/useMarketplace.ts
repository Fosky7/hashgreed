// src/hooks/useMarketplace.ts
import { useCallback, useEffect, useState } from 'react';
import type { KrossSigner } from '../lib/blockchain/kross/signer';
import {
  listNFT as sdkListNFT,
  updateNFTPrice as sdkUpdatePrice,
  cancelListing as sdkCancel,
  setRoyalty as sdkSetRoyalty,
  getAllListings,
  getListing,
  type Listing,
} from '../lib/blockchain/kross/marketplace-listings';
import { buyNFT as sdkBuyNFT } from '../lib/blockchain/kross/marketplace-sale';

interface UseMarketplaceOptions {
  /** Managed-wallet signer from your wallet context; null when disconnected. */
  signer: KrossSigner | null;
}

export function useMarketplace({ signer }: UseMarketplaceOptions) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setListings(await getAllListings());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function requireSigner(): KrossSigner {
    if (!signer) throw new Error('Connect a wallet first');
    return signer;
  }

  const withBusy = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setBusy(true);
      setError(null);
      try {
        const r = await fn();
        await refresh();
        return r;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed';
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const list = useCallback(
    (assetId: string, priceKSS: number) =>
      withBusy(() => sdkListNFT(requireSigner(), assetId, priceKSS)),
    [withBusy, signer],
  );

  const updatePrice = useCallback(
    (assetId: string, newPriceKSS: number) =>
      withBusy(() => sdkUpdatePrice(requireSigner(), assetId, newPriceKSS)),
    [withBusy, signer],
  );

  const cancel = useCallback(
    (assetId: string) => withBusy(() => sdkCancel(requireSigner(), assetId)),
    [withBusy, signer],
  );

  const buy = useCallback(
    (assetId: string) => withBusy(() => sdkBuyNFT(requireSigner(), assetId)),
    [withBusy, signer],
  );

  const setRoyalty = useCallback(
    (assetId: string, bps: number) =>
      withBusy(() => sdkSetRoyalty(requireSigner(), assetId, bps)),
    [withBusy, signer],
  );

  return {
    listings,
    loading,
    busy,
    error,
    connected: !!signer,
    address: signer?.address ?? null,
    refresh,
    list,
    updatePrice,
    cancel,
    buy,
    setRoyalty,
    getListing,
  };
}
