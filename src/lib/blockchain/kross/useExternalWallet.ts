// src/lib/blockchain/kross/useExternalWallet.ts
import { useCallback, useEffect, useState } from 'react';
import {
  connectKeeper,
  disconnect as disconnectProvider,
  getStoredProvider,
  ProviderKind,
} from './external-wallet';
import { getKssBalance } from './queries';
import { fromWavelets } from './config';

type Status = 'idle' | 'connecting' | 'connected' | 'error';

interface ExternalWalletState {
  provider: ProviderKind | null;
  address: string | null;
  /** Human-readable KSS balance (e.g. "12.5"). */
  balance: string | null;
  status: Status;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

function toKss(raw: number | string | null): string | null {
  if (raw == null) return null;
  try {
    return String(fromWavelets(Number(raw)));
  } catch {
    return String(raw);
  }
}

export function useExternalWallet(): ExternalWalletState {
  const [provider, setProvider] = useState<ProviderKind | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async (addr: string) => {
    try {
      const raw = await getKssBalance(addr);
      setBalance(toKss(raw as any));
    } catch {
      setBalance(null);
    }
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    try {
      const acct = await connectKeeper();
      setProvider('keeper');
      setAddress(acct.address);
      setStatus('connected');
      await loadBalance(acct.address);
    } catch (e: any) {
      setStatus('error');
      setError(e?.message ?? 'Failed to connect wallet.');
    }
  }, [loadBalance]);

  const disconnect = useCallback(async () => {
    await disconnectProvider();
    setProvider(null);
    setAddress(null);
    setBalance(null);
    setStatus('idle');
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (address) await loadBalance(address);
  }, [address, loadBalance]);

  // Surface a previously-used provider so the UI can offer 1-tap reconnect.
  useEffect(() => {
    const stored = getStoredProvider();
    if (stored) setProvider(stored);
  }, []);

  return {
    provider,
    address,
    balance,
    status,
    error,
    connect,
    disconnect,
    refresh,
  };
}
