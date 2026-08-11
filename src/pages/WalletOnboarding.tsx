// src/pages/WalletOnboarding.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { CreateWallet } from '@/components/wallet/CreateWallet';
import { ImportWallet } from '@/components/wallet/ImportWallet';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { getStoredAddress, hasWallet } from '@/lib/blockchain/kross/wallet-store';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

type Mode = 'choose' | 'create' | 'import"|unlock";

function nativeSymbol(): string {
  const coin = (KROSS_CONFIG as any).nativeCoin;
  if (typeof coin === 'string') return coin;
  return coin?.symbol ?? 'KSS';
}

function shortAddress(address?: string | null): string {
  if (!address) return 'No wallet yet';
  return `${address.slice(0, 7)}…${address.slice(-5)}`;
}

function FeaturePill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/65">
      {children}
    </span>
  );
}

function WalletOptionCard({
  icon,
  title,
  description,
  action,
  active,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full overflow-hidden rounded-[2rem] border p-5 text-left transition duration-300 ${
        active
          ? 'border-indigo-300/45 bg-indigo-400/15 shadow-2xl shadow-indigo-950/30'
          : 'border-white/10 bg-white/[0.045] shadow-xl shadow-black/15 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg shadow-black/20">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-white/55">{description}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-indigo-200">
            {action}
            <span className="transition group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function UnlockExistingWallet({
  onUnlocked,
}: {
  onUnlocked: () => void;
}) {
  const { unlock, busy, error } = useKrossSession();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    const ok = await unlock(password);
    if (ok) {
      setPassword('');
      setShowPassword(false);
      onUnlocked();
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/25 sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-2xl">
          🔓
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Unlock wallet</h2>
          <p className="mt-1 text-sm leading-6 text-white/55">
            Enter your local wallet password. Your Kross seed stays encrypted and is only
            used inside the managed wallet signer.
          </p>
        </div>
      </div>

      <label htmlFor="wallet-password" className="mb-2 block text-sm font-bold text-white/80">
        Wallet password
      </label>
      <div className="relative">
        <input
          id="wallet-password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && password.length >= 8 && !busy) {
              void submit();
            }
          }}
          placeholder="Enter password"
          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-white/45 transition hover:text-white/80"
        >
          {showPassword ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={busy || password.length < 8}
        onClick={submit}
        className="mt-5 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[#080A14] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busy ? 'Unlocking…' : 'Unlock Wallet'}
      </button>
    </section>
  );
}

export default function WalletOnboarding() {
  const navigate = useNavigate();
  const wallet = useKrossWallet();
  const session = useKrossSession();
  const [mode, setMode] = useState<Mode>('choose');

  const storedAddress = useMemo(() => getStoredAddress(), [wallet.address, session.unlocked]);
  const walletExists = hasWallet();
  const symbol = nativeSymbol();

  useEffect(() => {
    if (walletExists && !session.unlocked) {
      setMode('unlock');
    }
  }, [walletExists, session.unlocked]);

  const finishWalletSetup = async () => {
    await wallet.refresh();
    navigate('/wallet');
  };

  const cardTitle =
    mode === 'create'
      ? 'Create a new Kross wallet'
      : mode === 'import'
        ? 'Import an existing wallet'
        : mode === 'unlock'
          ? 'Welcome back'
          : 'Set up your Kross wallet';

  const cardDescription =
    mode === 'create'
      ? 'Generate a new encrypted wallet for KSS and Kross-based NFTs.'
      : mode === 'import'
        ? 'Bring in your existing 15-word Kross seed and encrypt it locally.'
        : mode === 'unlock'
          ? 'Unlock your encrypted wallet to continue minting, sending, and managing NFTs.'
          : `Create or import a wallet to manage ${symbol}, mint NFTs, and list assets on Kross.`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#080A14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-20%] top-[-15%] h-[32rem] w-[32rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-[-25%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/14 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[25%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <BackButton to="/" label="Back to Home" className="mb-8 text-white/55 hover:text-white" />

        <section className="grid flex-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-100/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              Kross wallet
            </div>

            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Your gateway to{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  KSS and NFTs.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/58 sm:text-lg">
                Securely create, import, unlock, and manage your Kross wallet directly inside
                the app. Designed for minting, marketplace actions, and native KSS transfers.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <FeaturePill>Encrypted locally</FeaturePill>
              <FeaturePill>15-word Kross seeds</FeaturePill>
              <FeaturePill>Native {symbol}</FeaturePill>
              <FeaturePill>3K addresses</FeaturePill>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  {walletExists ? '✅' : '✨'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white/45">Current wallet</p>
                  <p className="mt-1 font-mono text-lg font-black text-white">
                    {shortAddress(storedAddress || wallet.address)}
                  </p>
                </div>
              </div>
              {walletExists && (
                <Link
                  to="/wallet"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/80 transition hover:bg-white/7 hover:text-white"
                >
                  Open Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
            <div className="mb-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/35">
                Wallet setup
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">{cardTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">{cardDescription}</p>
            </div>

            {mode === 'choose' && (
              <div className="space-y-4">
                <WalletOptionCard
                  icon="🪄"
                  title="Create New Wallet"
                  description="Generate a fresh Kross wallet, protect it with a password, and start collecting or minting."
                  action="Create wallet"
                  onClick={() => setMode('create')}
                />
                <WalletOptionCard
                  icon="📥"
                  title="Import Existing Wallet"
                  description="Already have a Kross seed phrase? Import it and encrypt it locally on this device."
                  action="Import wallet"
                  onClick={() => setMode('import')}
                />
                {walletExists && (
                  <WalletOptionCard
                    icon="🔓"
                    title="Unlock Stored Wallet"
                    description="A wallet is already saved on this device. Unlock it to continue using the app."
                    action="Unlock wallet"
                    onClick={() => setMode('unlock')}
                  />
                )}
              </div>
            )}

            {mode === 'unlock' && (
              <div className="space-y-4">
                <UnlockExistingWallet onUnlocked={finishWalletSetup} />
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="w-full rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/62 transition hover:bg-white/5 hover:text-white"
                >
                  Use a different wallet
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-white"
                >
                  ← Back to options
                </button>
                <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 sm:p-5">
                  <CreateWallet onComplete={finishWalletSetup} />
                </div>
              </div>
            )}

            {mode === 'import' && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-white"
                >
                  ← Back to options
                </button>
                <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 sm:p-5">
                  <ImportWallet onComplete={finishWalletSetup} />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
