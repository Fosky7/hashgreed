// src/hooks/useMarketplace.ts
import { useState, useEffect, useCallback } from 'react';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { resolveSeed } from '@/lib/blockchain/kross/resolve-seed';
import {
  getListings,
  type Listing,
} from '@/lib/blockchain/kross/marketplace-listings';
import { buyNft } from '@/lib/blockchain/kross/buyNft';
import { delistNft } from '@/lib/blockchain/kross/delistNft';
import { updateNFTPrice } from '@/lib/blockchain/kross/updateNftPrice';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';

export function useMarketplace() {
  const { address } = useKrossWallet();
  const { unlocked } = useKrossSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getListings();
      setListings(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const buy = useCallback(
    async (assetId: string) => {
      if (!unlocked) {
        setError('Wallet locked. Unlock first.');
        return;
      }
      const listing = listings.find((l) => l.assetId === assetId);
      if (!listing) {
        setError('Listing not found');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const seed = await resolveSeed();
        await buyNft(assetId, listing, seed);
        await refresh();
      } catch (e: any) {
        setError(e.message || 'Purchase failed');
      } finally {
        setBusy(false);
      }
    },
    [unlocked, listings, refresh],
  );

  const cancel = useCallback(
    async (assetId: string) => {
      if (!unlocked) {
        setError('Wallet locked');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const seed = await resolveSeed();
        await delistNft(assetId, seed);
        await refresh();
      } catch (e: any) {
        setError(e.message || 'Delisting failed');
      } finally {
        setBusy(false);
      }
    },
    [unlocked, refresh],
  );

  const updatePrice = useCallback(
    async (assetId: string, newPriceKSS: number) => {
      if (!unlocked) {
        setError('Wallet locked');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const seed = await resolveSeed();
        await updateNFTPrice({
          assetId,
          newPriceKSS,
          password: seed,
        });
        await refresh();
      } catch (e: any) {
        setError(e.message || 'Price update failed');
      } finally {
        setBusy(false);
      }
    },
    [unlocked, refresh],
  );

  return {
    listings,
    loading,
    error,
    busy,
    address,
    connected: !!address,
    refresh,
    buy,
    cancel,
    updatePrice,
  };
}
