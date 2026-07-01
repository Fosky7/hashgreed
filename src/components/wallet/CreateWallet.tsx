// src/components/wallet/CreateWallet.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateKrossWallet } from '@/lib/blockchain/kross/generate-wallet';
import { saveWallet } from '@/lib/blockchain/kross/wallet-store';
import { unlock as unlockSession } from '@/lib/blockchain/kross/session';
import { PasswordInput } from './PasswordInput';

type Step = 'password' | 'backup';

/**
 * Create a brand-new Kross wallet:
 *  1. Collect a password.
 *  2. Generate a fresh seed phrase + address (inside the SDK layer).
 *  3. Show the recovery phrase for backup; require explicit confirmation.
 *  4. Encrypt + persist the seed, auto-unlock, and route to the dashboard.
 *
 * Seed material is handled only here and inside the SDK layer.
 */
export function CreateWallet() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [seed, setSeed] = useState('');
  const [address, setAddress] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Independent copy feedback for the phrase and the address.
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const words = seed.length ? seed.split(' ') : [];

  const handleGenerate = async () => {
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
    try {
      const wallet = await generateKrossWallet();
      setSeed(wallet.seed);
      setAddress(wallet.address);
      setStep('backup');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to generate a new wallet.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    setError('');
    if (!confirmed) {
      setError('Please confirm you have backed up your recovery phrase.');
      return;
    }

    setBusy(true);
    try {
      await saveWallet(seed, password);
      await unlockSession(password);
      navigate('/wallet', { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to save your wallet.',
      );
    } finally {
      setBusy(false);
    }
  };

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(seed);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  if (step === 'password') {
    return (
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-lg">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black">Create a new wallet</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Choose a password to encrypt your new Kross wallet on this device.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--text-primary)]">
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--text-primary)]">
              Confirm password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Generating…' : 'Create Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-lg">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black">Back up your recovery phrase</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Write these words down in order and keep them somewhere safe. Anyone
            with this phrase can control your wallet. We can't recover it for
            you.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-color)] p-3">
          {words.map((word, i) => (
            <div
              key={`${word}-${i}`}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--page-bg)] px-2.5 py-2"
            >
              <span className="text-xs text-[var(--text-secondary)]">
                {i + 1}.
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {word}
              </span>
            </div>
          ))}
        </div>

        {/* Recovery phrase: raw string + copy control */}
        <div className="flex items-stretch gap-2">
          <code className="flex-1 break-all rounded-lg border border-[var(--border-color)] bg-[var(--page-bg)] p-3 font-mono text-sm text-[var(--text-primary)]">
            {seed}
          </code>
          <button
            type="button"
            onClick={copyPhrase}
            className="shrink-0 rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--hover-bg)]"
          >
            {copiedPhrase ? 'Copied!' : 'Copy phrase'}
          </button>
        </div>

        {/* Wallet address: shown + copyable */}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Wallet address
          </label>
          <div className="flex items-stretch gap-2">
            <code className="flex-1 break-all rounded-lg border border-[var(--border-color)] bg-[var(--page-bg)] p-3 font-mono text-sm text-[var(--text-primary)]">
              {address}
            </code>
            <button
              type="button"
              onClick={copyAddress}
              aria-label="Copy wallet address"
              className="shrink-0 rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--hover-bg)]"
            >
              {copiedAddress ? 'Copied!' : 'Copy address'}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>I have safely backed up my recovery phrase.</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleFinish}
          disabled={busy || !confirmed}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default CreateWallet;
