// src/pages/WalletDashboard.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { UnlockGate } from '@/components/wallet/UnlockGate';
import { LockButton } from '@/components/wallet/LockButton';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

function nativeSymbol(): string {
  const coin = (KROSS_CONFIG as any).nativeCoin;
  if (typeof coin === 'string') return coin;
  return coin?.symbol ?? 'KSS';
}

function shortAddress(address?: string | null): string {
  if (!address) return 'No wallet';
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
  });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-white/45">{hint}</p>
    </div>
  );
}

function ActionLink({
  to,
  icon,
  title,
  description,
  primary,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group rounded-[1.5rem] border p-5 transition ${
        primary
          ? 'border-indigo-300/40 bg-indigo-400/15 hover:bg-indigo-400/20'
          : 'border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg shadow-black/20">
          {icon}
        </div>
        <div>
          <p className="font-black text-white">{title}</p>
          <p className="mt-1 text-sm leading-5 text-white/48">{description}</p>
          <p className="mt-3 text-sm font-black text-indigo-200">
            Continue <span className="inline-block transition group-hover:translate-x-1">→</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function WalletDashboard() {
  const { address, balance, assets, transactions, loading, error, refresh } = useKrossWallet();
  const symbol = nativeSymbol();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!address && !loading) {
    return (
      <main className="min-h-screen bg-[#080A14] px-4 py-8 text-white">
        <div className="mx-auto max-w-xl">
          <BackButton to="/" label="Back to Home" className="mb-8 text-white/55 hover:text-white" />
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 text-center shadow-2xl shadow-black/25">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              👛
            </div>
            <h1 className="text-3xl font-black">No wallet connected</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Create or import a Kross wallet to manage {symbol}, mint NFTs, and use the marketplace.
            </p>
            <Link
              to="/wallet/onboarding"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90"
            >
              Set Up Wallet
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <UnlockGate>
      <main className="min-h-screen overflow-hidden bg-[#080A14] text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-22%] top-[-18%] h-[34rem] w-[34rem] rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute right-[-20%] top-[5%] h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-[-25%] left-[25%] h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <BackButton to="/" label="Back to Home" className="text-white/55 hover:text-white" />
            <LockButton />
          </div>

          <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.12),transparent_28%)]" />
              <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-100/75">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                    Wallet active
                  </div>

                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                    Kross Wallet
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                    Manage your native {symbol}, Kross assets, NFTs, marketplace actions,
                    and recent transaction activity.
                  </p>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                      Wallet address
                    </p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="break-all font-mono text-sm text-white/80">{address}</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (address) void navigator.clipboard.writeText(address);
                        }}
                        className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#080A14] transition hover:bg-white/90"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6">
                  <p className="text-sm font-bold text-white/45">Available balance</p>
                  <p className="mt-2 text-5xl font-black tracking-tight text-white">
                    {loading ? '…' : formatNumber(balance)}
                  </p>
                  <p className="mt-1 text-lg font-black text-indigo-200">{symbol}</p>
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading}
                    className="mt-5 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Refreshing…' : 'Refresh Wallet'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-3xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
              {error}
            </div>
          )}

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tokens"
              value={String(assets.filter((asset) => !asset.isNFT).length)}
              hint="Fungible assets held"
            />
            <StatCard
              label="NFTs"
              value={String(assets.filter((asset) => asset.isNFT).length)}
              hint="Collectibles in wallet"
            />
            <StatCard
              label="Transactions"
              value={String(transactions.length)}
              hint="Recent activity loaded"
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <ActionLink
              to="/wallet/send"
              icon="↗️"
              title={`Send ${symbol}`}
              description="Transfer native KSS to another Kross address."
              primary
            />
            <ActionLink
              to="/wallet/receive"
              icon="📥"
              title={`Receive ${symbol}`}
              description="Show your wallet address and QR code."
            />
            <ActionLink
              to="/create"
              icon="🎨"
              title="Create NFT"
              description="Mint a new NFT and optionally list it for sale."
            />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/15 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Assets</h2>
                  <p className="mt-1 text-sm text-white/45">Tokens and NFTs held by this wallet.</p>
                </div>
              </div>

              {assets.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    ✦
                  </div>
                  <p className="font-black text-white">No assets yet</p>
                  <p className="mt-1 text-sm text-white/45">
                    Receive {symbol} or mint your first NFT to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.slice(0, 8).map((asset) => (
                    <div
                      key={asset.assetId}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black text-white">{asset.name || 'Unnamed Asset'}</p>
                        <p className="mt-1 truncate font-mono text-xs text-white/35">{asset.assetId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black uppercase tracking-wider text-white/35">
                          {asset.isNFT ? 'NFT' : 'Token'}
                        </p>
                        <p className="mt-1 font-black text-white/80">{asset.balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/15 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Recent Activity</h2>
                  <p className="mt-1 text-sm text-white/45">Latest wallet transactions on Kross.</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    🧾
                  </div>
                  <p className="font-black text-white">No transactions yet</p>
                  <p className="mt-1 text-sm text-white/45">
                    Activity appears here after you send, receive, mint, or buy.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 8).map((tx) => (
                    <a
                      key={tx.id}
                      href={`${KROSS_CONFIG.explorerUrl}/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black capitalize text-white">
                            {tx.direction === 'in'
                              ? 'Received'
                              : tx.direction === 'out'
                                ? 'Sent'
                                : 'Wallet action'}
                          </p>
                          <p className="mt-1 truncate font-mono text-xs text-white/35">{tx.id}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-black ${
                              tx.direction === 'in'
                                ? 'text-emerald-300'
                                : tx.direction === 'out'
                                  ? 'text-rose-300'
                                  : 'text-white/75'
                            }`}
                          >
                            {tx.direction === 'in' ? '+' : tx.direction === 'out' ? '-' : ''}
                            {tx.amount} {symbol}
                          </p>
                          <p className="mt-1 text-xs text-white/35">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </UnlockGate>
  );
}
