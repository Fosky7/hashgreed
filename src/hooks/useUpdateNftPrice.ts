import { useState } from 'react';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { resolveSeed } from '@/lib/blockchain/kross/resolve-seed';
import { updateNFTPrice, waitForTx } from '@/lib/blockchain/kross/marketplace';

type Status = 'idle' | 'updating' | 'confirming' | 'done' | 'error';

interface UpdatePriceParams {
  assetId: string;
  newPriceKSS: number;
}

export function useUpdateNftPrice() {
  const { unlocked } = useKrossSession();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [txUrl, setTxUrl] = useState<string>('');

  const execute = async (params: UpdatePriceParams) => {
    setError('');
    setTxUrl('');
    if (!unlocked) {
      setError('Wallet is locked. Please unlock before updating price.');
      setStatus('error');
      return;
    }
    try {
      setStatus('updating');
      const seed = await resolveSeed();
      const result = await updateNFTPrice({
        assetId: params.assetId,
        newPriceKSS: params.newPriceKSS,
        password: seed, // seed acts as the wallet password for automatic signing
      });
      setTxUrl(result.explorerUrl);
      setStatus('confirming');
      await waitForTx(result.id);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Price update failed.');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError('');
    setTxUrl('');
  };

  return { execute, status, error, txUrl, reset };
}
