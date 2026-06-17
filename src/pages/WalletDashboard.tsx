// src/pages/WalletDashboard.tsx
import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { AssetList } from '@/components/wallet/AssetList';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';

type Tab = 'assets' | 'activity';

export default function WalletDashboard() {
  const { address, balance, assets, transactions, loading, error, refresh } =
    useKrossWallet();
  const [tab, setTab] = useState<Tab>('assets');
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!address) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-gray-600">No wallet found. Create or import one.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-6">
        <p className="text-sm opacity-80">Total Balance</p>
        <h1 className="text-3xl font-bold mt-1">
          {balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
          <span className="text-lg">{KROSS_CONFIG.nativeCoin}</span>
        </h1>
        <button
          onClick={copyAddress}
          className="mt-4 text-xs bg-white/20 px-3 py-1.5 rounded-lg"
        >
          {copied ? 'Copied!' : `${address.slice(0, 8)}...${address.slice(-6)}`}
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <a
          href="/wallet/send"
          className="py-3 rounded-xl bg-indigo-600 text-white text-center text-sm font-semibold"
        >
          Send
        </a>
        <a
          href="/wallet/receive"
          className="py-3 rounded-xl border border-indigo-600 text-indigo-600 text-center text-sm font-semibold"
        >
          Receive
        </a>
        <button
          onClick={refresh}
          className="py-3 rounded-xl border text-gray-600 text-sm font-semibold"
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['assets', 'activity'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'assets' ? (
        <AssetList assets={assets} />
      ) : (
        <TransactionHistory txs={transactions} />
      )}
    </div>
  );
}
