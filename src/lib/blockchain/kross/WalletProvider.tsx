// src/lib/blockchain/kross/WalletProvider.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { getStoredAddress, hasWallet } from './wallet-store';
import {
  getKssBalance,
  getAssets,
  getTransactions,
  KrossAsset,
  KrossTx,
} from './queries';

interface WalletState {
  address: string | null;
  balance: number;
  assets: KrossAsset[];
  transactions: KrossTx[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function KrossWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [assets, setAssets] = useState<KrossAsset[]>([]);
  const [transactions, setTransactions] = useState<KrossTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const addr = getStoredAddress();
    if (!addr) {
      setAddress(null);
      return;
    }
    setAddress(addr);
    setLoading(true);
    setError(null);
    try {
      const [bal, ast, txs] = await Promise.all([
        getKssBalance(addr),
        getAssets(addr),
        getTransactions(addr),
      ]);
      setBalance(bal);
      setAssets(ast);
      setTransactions(txs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasWallet()) refresh();
  }, [refresh]);

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        assets,
        transactions,
        loading,
        error,
        isConnected: !!address,
        refresh,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useKrossWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx)
    throw new Error('useKrossWallet must be used within KrossWalletProvider');
  return ctx;
}
