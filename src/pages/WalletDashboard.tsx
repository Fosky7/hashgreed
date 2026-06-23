// src/pages/WalletDashboard.tsx
import { useEffect, useState } from "react";
import { useSession } from "@/lib/blockchain/kross/useSession";
import { RecentTransactions } from "@/components/wallet/RecentTransactions";

const KROSS_NODE = "https://nodes.krossexplorer.com";

/* Inline icons (replacing lucide-react to avoid an extra dependency) */
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

export default function WalletDashboard() {
  const { address, isConnected } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;
    fetch(`${KROSS_NODE}/addresses/balance/${address}`)
      .then((r) => r.json())
      .then((d) => setBalance((d.balance ?? 0) / 1e8))
      .catch(() => setBalance(null));
  }, [address]);

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/60">
        Connect your wallet to view your dashboard.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-violet-600/20 to-fuchsia-600/20 p-6 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <WalletIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/70">Kross Wallet</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">
              <ShieldIcon className="h-3 w-3" /> Secured
            </div>
          </div>

          <p className="text-xs uppercase tracking-wider text-white/50">Total Balance</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-white">
              {balance === null ? "—" : balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
            <span className="text-lg font-medium text-white/60">KSS</span>
          </div>

          <button
            onClick={copy}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/20"
          >
            <span className="font-mono">
              {address?.slice(0, 8)}…{address?.slice(-6)}
            </span>
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <RecentTransactions address={address} />
    </div>
  );
}
