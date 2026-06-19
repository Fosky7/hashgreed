// src/components/wallet/UnlockScreen.tsx
import { useState } from 'react';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';

/**
 * Renders an unlock prompt when the wallet is locked.
 * Wrap signing-dependent pages with <UnlockGate>.
 */
export function UnlockScreen() {
  const { unlock, error, busy } = useKrossSession();
  const [password, setPassword] = useState('');

  const handle = async () => {
    await unlock(password);
    setPassword('');
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">Wallet Locked</h1>
      <p className="text-sm text-gray-500 text-center">
        Enter your password to unlock your Kross wallet for this session.
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handle()}
        placeholder="Wallet password"
        className="w-full p-3 rounded-xl border text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={busy || password.length < 8}
        onClick={handle}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
      >
        {busy ? 'Unlocking...' : 'Unlock'}
      </button>
    </div>
  );
}
