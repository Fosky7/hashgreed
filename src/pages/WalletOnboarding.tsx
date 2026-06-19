// src/pages/WalletOnboarding.tsx
import { useState } from 'react';
import { CreateWallet } from '@/components/wallet/CreateWallet';
import { ImportWallet } from '@/components/wallet/ImportWallet';

type Mode = 'choose' | 'create' | 'import';

export default function WalletOnboarding() {
  const [mode, setMode] = useState<Mode>('choose');

  if (mode === 'create') return <CreateWallet onComplete={() => {}} />;
  if (mode === 'import') return <ImportWallet onComplete={() => {}} />;

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">Kross Wallet</h1>
      <p className="text-center text-sm text-gray-600">
        Manage your KSS and Kross-based assets.
      </p>
      <button
        onClick={() => setMode('create')}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
      >
        Create New Wallet
      </button>
      <button
        onClick={() => setMode('import')}
        className="w-full py-3 rounded-xl border border-indigo-600 text-indigo-600 font-semibold"
      >
        Import Existing Wallet
      </button>
    </div>
  );
}
