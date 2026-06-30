import { useState, useEffect, useRef } from 'react';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { resolveSeed } from '@/lib/blockchain/kross/resolve-seed';
import { listNft } from '@/lib/blockchain/kross/listNft';
import { waitForTx } from '@/lib/blockchain/kross/transfer';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

type Status = 'idle' | 'listing' | 'confirming' | 'done' | 'error';

export function useListNft() {
  const { unlocked } = useKrossSession();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [txUrl, setTxUrl] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const execute = async ({ assetId, priceKss, royaltyPercent }: {
    assetId: string;
    priceKss: number;
    royaltyPercent: number;
  }) => {
    if (!unlocked) {
      setError('Wallet is locked. Unlock to list.');
      setStatus('error');
      return;
    }
    setError('');
    setTxUrl('');
    setStatus('listing');
    try {
      const seed = await resolveSeed();
      if (!mountedRef.current) return;
      const result = await listNft({ assetId, priceKss, royaltyPercent, seed });
      if (!mountedRef.current) return;
      setTxUrl(`${KROSS_CONFIG.explorerUrl}/tx/${result.id}`);
      setStatus('confirming');
      await waitForTx(result.id);
      if (!mountedRef.current) return;
      setStatus('done');
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Listing failed.');
      setStatus('error');
    }
  };

  return { execute, status, error, txUrl };
}
