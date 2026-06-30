// src/components/wallet/CreateWallet.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateKrossWallet } from '@/lib/blockchain/kross/generate-wallet';
import { saveWallet } from '@/lib/blockchain/kross/wallet-store';
import { unlock as unlockSession } from '@/lib/blockchain/kross/session';

type Step = 'intro' | 'backup' | 'confirm' | 'saving';

/**
 * Full "Generate Wallet" flow:
 *  1. Generate a fresh seed via the Kross SDK.
 *  2. Force the user to back up the seed phrase.
 *  3. Collect a password, encrypt + persist the wallet, auto-unlock,
 *     then route to the dashboard.
 */
export function CreateWallet() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [seed, setSeed] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError('');
    setBusy(true);
    try {
      const wallet = await generateKrossWallet();
      setSeed(wallet.seed);
      setAddress(wallet.address);
      setStep('backup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate wallet.');
    } finally {
      setBusy(false);
    }
  };

  const copySeed = async () => {
    try {
      await navigator.clipboard.writeText(seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const handleSave = async () => {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setStep('saving');
    try {
      // Encrypt + persist the seed under the chosen password.
      await saveWallet(seed, password);
      // Auto-unlock for this session so signing works immediately.
      await unlockSession(password);
      navigate('/wallet', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save wallet.');
      setStep('confirm');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-lg">
      {step === 'intro' && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">
            🔐
          </div>
          <h2 className="text-xl font-black">Generate a new wallet</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            We'll create a brand-new Kross wallet for you. You'll back up a
            secret recovery phrase and set a password to encrypt it on this
            device.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Generating…' : 'Generate Wallet'}
          </button>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black">Back up your recovery phrase</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Write these words down in order and keep them somewhere safe. Anyone
            with this phrase can control your wallet. We can't recover it for you.
          </p>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-3">
            {seed.split(' ').map((word, i) => (
              <div
                key={`${word}-${i}`}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--card-bg)] px-2 py-1.5 text-sm"
              >
                <span className="text-xs text-[var(--text-secondary)]">{i + 1}.</span>
                <span className="font-semibold">{word}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="break-all font-mono text-[var(--text-secondary)]">
              {address}
            </span>
            <button
              onClick={copySeed}
              className="shrink-0 rounded-lg border border-[var(--border-color)] px-3 py-1.5 font-semibold text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            >
              {copied ? 'Copied!' : 'Copy phrase'}
            </button>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5"
            />
            <span>I have safely backed up my recovery phrase.</span>
          </label>

          <button
            onClick={() => setStep('confirm')}
            disabled={!acknowledged}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            Continue
          </button>
        </div>
      )}

      {(step === 'confirm' || step === 'saving') && (
        <div className="space-y-4">
          <h2 className="text-xl font-black">Set a wallet password</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            This password encrypts your recovery phrase on this device. You'll
            use it to unlock your wallet.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] p-3 text-sm"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Confirm password"
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] p-3 text-sm"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSave}
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {step === 'saving' ? 'Securing wallet…' : 'Create Wallet'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CreateWallet;
