// src/components/wallet/ImportWallet.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importKrossWallet } from '@/lib/blockchain/kross/generate-wallet';
import { saveWallet } from '@/lib/blockchain/kross/wallet-store';
import { unlock as unlockSession } from '@/lib/blockchain/kross/session';
import { PasswordInput } from './PasswordInput';

/**
 * Import an existing Kross wallet from a recovery phrase:
 *  1. User pastes their 15-word seed phrase.
 *  2. Derive the address to confirm the phrase is valid.
 *  3. Collect a password, encrypt + persist, auto-unlock, route to dashboard.
 *
 * Seed material is handled only here and inside the SDK layer.
 */
export function ImportWallet() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const normalizedSeed = seed.trim().replace(/\s+/g, ' ');
  const wordCount = normalizedSeed.length ? normalizedSeed.split(' ').length : 0;

  const handleImport = async () => {
    setError('');

    if (wordCount < 12) {
      setError('Please enter your full recovery phrase (usually 15 words).');
      return;
    }
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
      // Validate the phrase and derive the address inside the SDK layer.
      await importKrossWallet(normalizedSeed);
      // Encrypt + persist the seed under the chosen password.
      await saveWallet(normalizedSeed, password);
      // Auto-unlock for this session so signing works immediately.
      const unlocked = await unlockSession(password);
      if (!unlocked) {
        throw new Error('Wallet was imported, but could not be unlocked. Please try your password again.');
      }
      navigate('/wallet', { replace: true });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Failed to import wallet. Check your recovery phrase.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-lg">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black">Import an existing wallet</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Enter your secret recovery phrase to restore your Kross wallet. It
            will be encrypted with a password on this device.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="seed-phrase"
            className="text-sm font-semibold text-[var(--text-primary)]"
          >
            Recovery phrase
          </label>
          <textarea
            id="seed-phrase"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="word1 word2 word3 …"
            rows={3}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] p-3 text-sm font-mono"
          />
          <p className="text-xs text-[var(--text-secondary)]">
            {wordCount > 0 ? `${wordCount} word${wordCount === 1 ? '' : 's'}` : 'Separate words with spaces.'}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-[var(--text-primary)]">
            New password
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
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            placeholder="Confirm password"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleImport}
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Importing…' : 'Import Wallet'}
        </button>
      </div>
    </div>
  );
}

export default ImportWallet;
