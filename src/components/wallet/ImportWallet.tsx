// src/components/wallet/ImportWallet.tsx
import { useState } from 'react';
import { importWallet, isValidSeedPhrase } from '@/lib/blockchain/kross/sdk';
import { saveWallet } from '@/lib/blockchain/kross/wallet-store';

export function ImportWallet({ onComplete }: { onComplete?: () => void }) {
  const [seedInput, setSeedInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');

  const handleImport = async () => {
    setError('');
    const cleaned = seedInput.trim().replace(/\s+/g, ' ');
    if (!isValidSeedPhrase(cleaned)) {
      setError('Invalid seed phrase. Expected exactly 15 words.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      const wallet = importWallet(cleaned);
      await saveWallet(wallet, password);
      setAddress(wallet.address);
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import wallet.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl border bg-white shadow-sm space-y-4">
      <h2 className="text-xl font-bold">Import Kross Wallet</h2>
      <p className="text-sm text-gray-600">
        Enter your 15-word recovery phrase to restore your KSS wallet.
      </p>
      <textarea
        value={seedInput}
        onChange={(e) => setSeedInput(e.target.value)}
        placeholder="Enter your 15-word recovery phrase"
        rows={3}
        className="w-full p-3 rounded-xl border text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Set a password to encrypt your wallet"
        className="w-full p-3 rounded-xl border text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {address && (
        <p className="text-sm text-green-600 break-all">
          Imported: {address}
        </p>
      )}
      <button
        onClick={handleImport}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
      >
        Import Wallet
      </button>
    </div>
  );
}
