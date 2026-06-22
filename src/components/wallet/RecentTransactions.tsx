// src/components/wallet/RecentTransactions.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Code2,
  ExternalLink,
  RefreshCw,
  Inbox,
} from "lucide-react";
import {
  fetchRecentTransactions,
  type NormalizedTx,
} from "@/lib/blockchain/kross/transactions";

interface Props {
  address?: string;
  /** Auto-refresh interval in ms (default 30s). Set 0 to disable. */
  pollMs?: number;
  /** Bump this value to force an immediate refetch (e.g. after a send). */
  refreshKey?: number;
}

const EXPLORER = "https://krossexplorer.com";

type Filter = "all" | "sent" | "received" | "invoke";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "received", label: "Received" },
  { key: "invoke", label: "Contracts" },
];

function shorten(s?: string, head = 6, tail = 4) {
  if (!s) return "—";
  return s.length > head + tail ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const META: Record<
  NormalizedTx["kind"],
  { label: string; icon: typeof ArrowDownLeft; ring: string; bg: string; text: string }
> = {
  received: {
    label: "Received",
    icon: ArrowDownLeft,
    ring: "ring-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
  },
  sent: {
    label: "Sent",
    icon: ArrowUpRight,
    ring: "ring-rose-500/20",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
  },
  invoke: {
    label: "Contract Call",
    icon: Code2,
    ring: "ring-violet-500/20",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
  },
  other: {
    label: "Transaction",
    icon: Code2,
    ring: "ring-slate-500/20",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
  },
};

export function RecentTransactions({ address, pollMs = 30000, refreshKey = 0 }: Props) {
  const [txs, setTxs] = useState<NormalizedTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!address) return;
      silent ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const data = await fetchRecentTransactions(address);
        setTxs(data);
        setLastUpdated(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load transactions");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [address]
  );

  // Initial + manual/forced refresh
  useEffect(() => {
    load(false);
  }, [load, refreshKey]);

  // Auto-refresh polling (silent so the list doesn't flash)
  useEffect(() => {
    if (!address || !pollMs) return;
    const id = setInterval(() => {
      if (!document.hidden) load(true);
    }, pollMs);
    return () => clearInterval(id);
  }, [address, pollMs, load]);

  const filtered = useMemo(() => {
    if (filter === "all") return txs;
    if (filter === "invoke") return txs.filter((t) => t.kind === "invoke");
    return txs.filter((t) => t.kind === filter);
  }, [txs, filter]);

  const counts = useMemo(
    () => ({
      all: txs.length,
      sent: txs.filter((t) => t.kind === "sent").length,
      received: txs.filter((t) => t.kind === "received").length,
      invoke: txs.filter((t) => t.kind === "invoke").length,
    }),
    [txs]
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Recent Activity</h3>
          <p className="text-xs text-white/40">
            {lastUpdated
              ? `Updated ${timeAgo(lastUpdated)}`
              : "Latest on-chain transactions"}
            {refreshing && " · syncing…"}
          </p>
        </div>
        <button
          onClick={() => load(false)}
          disabled={loading || !address}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading || refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                filter === f.key
                  ? "bg-white/15 text-white/80"
                  : "bg-white/5 text-white/30"
              }`}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && txs.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-white/5" />
              </div>
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">
          {error}
          <button onClick={() => load(false)} className="ml-2 underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Inbox className="h-6 w-6 text-white/30" />
          </div>
          <p className="text-sm font-medium text-white/60">
            {txs.length === 0 ? "No transactions yet" : "No matching transactions"}
          </p>
          <p className="text-xs text-white/30">
            {txs.length === 0
              ? "Your activity will appear here once you transact."
              : "Try a different filter."}
          </p>
        </div>
      )}

      <ul className="space-y-1.5">
        {filtered.map((tx) => {
          const meta = META[tx.kind];
          const Icon = meta.icon;
          const signed =
            tx.kind === "sent" ? "-" : tx.kind === "received" ? "+" : "";
          return (
            <li key={tx.id}>
              <a
                href={`${EXPLORER}/tx/${tx.id}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${meta.bg} ${meta.ring}`}
                >
                  <Icon className={`h-4.5 w-4.5 ${meta.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-white/90">
                    {tx.functionName ? `${tx.functionName}()` : meta.label}
                  </span>
                  <p className="truncate text-xs text-white/40">
                    {tx.kind === "received"
                      ? "From "
                      : tx.kind === "sent"
                      ? "To "
                      : ""}
                    {shorten(tx.counterparty)} · {timeAgo(tx.timestamp)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  {typeof tx.amountKss === "number" ? (
                    <span className={`text-sm font-semibold ${meta.text}`}>
                      {signed}
                      {tx.amountKss.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}{" "}
                      <span className="text-xs font-normal text-white/40">KSS</span>
                    </span>
                  ) : (
                    <span className="text-xs text-white/40">—</span>
                  )}
                  <ExternalLink className="h-3 w-3 text-white/20 transition group-hover:text-white/50" />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
