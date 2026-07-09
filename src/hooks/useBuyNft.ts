// src/hooks/useBuyNft.ts
import { useCallback, useState } from 'react';
import { buyNft } from '@/lib/blockchain/kross/buyNft';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';

type BuyStatus = 'idle' | 'buying' | 'success' | 'error';

export interface UseBuyNft {
  status: BuyStatus;
  error: string | null;
  txId: string | null;
  explorerUrl: string | null;
  /** True when the wallet is locked and the user must unlock first. */
  needsUnlock: boolean;
  buy: (assetId: string, priceKss?: number) => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook powering the "Buy Now" action on NFT cards. Verifies the wallet is
 * unlocked, invokes the marketplace buyNFT call, then refreshes wallet data
 * so balances/assets reflect the purchase.
 */
export function useBuyNft(): UseBuyNft {
  const { unlocked } = useKrossSession();
  const { refresh } = useKrossWallet();
  const [status, setStatus] = useState<BuyStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const buy = useCallback(
    async (assetId: string, priceKss?: number): Promise<boolean> => {
      setError(null);

      if (!unlocked) {
        setError('Unlock your wallet to buy this NFT.');
        setStatus('error');
        return false;
      }

      setStatus('buying');
      try {
        const result = await buyNft({ assetId, priceKss });
        setTxId(result.id);
        setExplorerUrl(result.explorerUrl);
        setStatus('success');
        // Refresh balances / owned assets after a successful purchase.
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Purchase failed.');
        setStatus('error');
        return false;
      }
    },
    [unlocked, refresh],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxId(null);
    setExplorerUrl(null);
  }, []);

  return {
    status,
    error,
    txId,
    explorerUrl,
    needsUnlock: !unlocked,
    buy,
    reset,
  };
}

export default useBuyNft;
