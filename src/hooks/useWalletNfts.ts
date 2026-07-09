// src/hooks/useWalletNfts.ts
import { useEffect, useState, useRef } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

// Expected shape from the Kross node’s assets/balance endpoint
interface NodeAsset {
  assetId: string;
  issueTransaction: {
    id?: string;
    name?: string;
    description?: string;
    /** true if the asset is an NFT (supply = 1, decimals = 0) */
    isNFT?: boolean;
  } | null;
  balance: number;
}

export interface WalletNft {
  assetId: string;
  name: string;
  description?: string;
  /** When available, a known IPFS or image URL from the asset’s metadata */
  image?: string;
}

const NODE_URL = KROSS_CONFIG.nodeUrl;

async function fetchOwnedNfts(address: string): Promise<WalletNft[]> {
  const url = `${NODE_URL}/assets/balance/${address}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch assets (${res.status})`);
  }
  const data = await res.json();

  // The node returns { address, balances: NodeAsset[] }
  const balances: NodeAsset[] = data.balances ?? [];

  // Keep only NFTs (supply=1, decimals=0 & isNFT flag) with a positive balance
  const nftAssets = balances.filter(
    (a) =>
      a.balance > 0 &&
      a.issueTransaction &&
      a.issueTransaction.isNFT &&
      a.issueTransaction.name
  );

  // Map to a consistent shape for the UI
  return nftAssets.map((a) => ({
    assetId: a.assetId,
    name: a.issueTransaction?.name ?? 'Unnamed NFT',
    description: a.issueTransaction?.description ?? '',
    // Image resolution is out of scope for now – later a metadata fetch can derive it
    image: undefined,
  }));
}

/**
 * Returns the list of NFTs owned by the currently connected Kross wallet.
 * Automatically refetches when the address changes.
 */
export function useWalletNfts() {
  const { address } = useKrossWallet();
  const [nfts, setNfts] = useState<WalletNft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!address) {
      setNfts([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchOwnedNfts(address);
        if (!cancelled && mounted.current) {
          setNfts(items);
        }
      } catch (e: any) {
        if (!cancelled && mounted.current) {
          setError(e.message);
          setNfts([]);
        }
      } finally {
        if (!cancelled && mounted.current) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [address]);

  return { nfts, loading, error };
}
