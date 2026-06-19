// src/components/wallet/CreateWallet.tsx
import { useState } from 'react';
import { createWallet, KrossWallet } from '@/lib/blockchain/kross/sdk';
import { saveWallet } from '@/lib/blockchain/kross/wallet-store';

type Step = 'intro' | 'reveal' | 'confirm' | 'done';

export function CreateWallet({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [wallet, setWallet] = useState<KrossWallet | null>(null);
  const [password, setPassword] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const handleGenerate = async () => {
    const w = await createWallet();
    setWallet(w);
    setStep('reveal');
  };

  const handleConfirm = async () => {
    setError('');
    if (!wallet) return;
    if (confirmInput.trim().replace(/\s+/g, ' ') !== wallet.seedPhrase) {
      setError('Seed phrase does not match. Please re-enter exactly.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    await saveWallet(wallet, password);
    setStep('done');
    onComplete?.();
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl border bg-white shadow-sm">
      {step === 'intro' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Create Kross Wallet</h2>
          <p className="text-sm text-gray-600">
            A new 15-word recovery phrase will be generated for your KSS wallet.
            Store it securely — it is the only way to recover your funds.
          </p>
          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
          >
            Generate Wallet
          </button>
        </div>
      )}

      {step === 'reveal' && wallet && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Recovery Phrase</h2>
          <div className="grid grid-cols-3 gap-2">
            {wallet.seedPhrase.split(' ').map((word, i) => (
              <div
                key={i}
                className="px-2 py-2 rounded-lg bg-gray-100 text-sm text-center"
              >
                <span className="text-gray-400 mr-1">{i + 1}.</span>
                {word}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600">
            Write these 15 words down. Never share them. We cannot recover them.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            I have safely saved my recovery phrase
          </label>
          <button
            disabled={!acknowledged}
            onClick={() => setStep('confirm')}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Confirm Your Phrase</h2>
          <textarea
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Re-enter your 15-word phrase"
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
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
          >
            Create Wallet
          </button>
        </div>
      )}

      {step === 'done' && wallet && (
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-bold text-green-600">Wallet Created</h2>
          <p className="text-sm text-gray-600 break-all">{wallet.address}</p>
          <p className="text-xs text-gray-400">Your KSS wallet is ready.</p>
        </div>
      )}
    </div>
  );
}
