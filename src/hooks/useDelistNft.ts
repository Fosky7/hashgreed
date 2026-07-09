// src/hooks/useDelistNft.ts
import { useCallback, useState } from 'react';
import { delistNft } from '@/lib/blockchain/kross/delistNft';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { clearCategory } from '@/lib/blockchain/kross/categoryStore';

type DelistStatus = 'idle' | 'delisting' | 'success' | 'error';

export interface UseDelistNft {
  status: DelistStatus;
  error: string | null;
  txId: string | null;
  explorerUrl: string | null;
  /** True when the wallet is locked and the user must unlock first. */
  needsUnlock: boolean;
  delist: (assetId: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook powering the "Delist" action for an NFT the user owns and has listed.
 * Verifies the wallet is unlocked, invokes the marketplace `delistNFT` call,
 * then refreshes wallet data so the returned NFT reappears in the wallet, and
 * clears the off-chain category mapping (best-effort) since the listing is gone.
 */
export function useDelistNft(): UseDelistNft {
  const { unlocked } = useKrossSession();
  const { refresh } = useKrossWallet();
  const [status, setStatus] = useState<DelistStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const delist = useCallback(
    async (assetId: string): Promise<boolean> => {
      setError(null);

      if (!unlocked) {
        setError('Unlock your wallet to delist this NFT.');
        setStatus('error');
        return false;
      }

      setStatus('delisting');
      try {
        const result = await delistNft({ assetId });
        setTxId(result.id);
        setExplorerUrl(result.explorerUrl);
        setStatus('success');

        // Listing is gone post-delist → clear the off-chain category mapping.
        try {
          await clearCategory(assetId);
        } catch {
          /* non-fatal: category cleanup is cosmetic */
        }

        // Refresh balances / owned assets — escrowed NFT returns to wallet.
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delisting failed.');
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
    delist,
    reset,
  };
}

export default useDelistNft;
