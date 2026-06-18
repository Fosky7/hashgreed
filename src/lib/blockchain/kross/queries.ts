// src/lib/blockchain/kross/queries.ts
//
// READ layer for the Kross chain.
//
// Per the Kross SDK (https://decentralizedafrica.com/sdk), responsibilities are
// split between two kinds of endpoints:
//   - READ  (aggregated/indexed data: balances, asset lists, tx history)
//       -> the indexed Explorer API at https://krossexplorer.com/api
//   - WRITE (transaction broadcast)
//       -> one of the RPC nodes (nodes / nodes2 / nodes3 .krossexplorer.com)
//
// This file performs ONLY reads, so every request below is routed through the
// API base. Write/broadcast paths live in transfer.ts / assets.ts and target
// the RPC nodes — they are intentionally NOT touched here.
import { fromWavelets } from './config';

/**
 * Resolve the read-only API base URL.
 * Prefers the SDK-specified `apiUrl` (Part 1 config). Falls back to deriving
 * it from the explorer URL, then finally to the legacy single node URL so the
 * module keeps working regardless of which config revision is live.
 */
function getApiUrl(): string {
  const cfg = KROSS_CONFIG as unknown as {
    apiUrl?: string;
    explorerUrl?: string;
    nodeUrl?: string;
  };
  if (cfg.apiUrl) return cfg.apiUrl.replace(/\/+$/, '');
  if (cfg.explorerUrl) return `${cfg.explorerUrl.replace(/\/+$/, '')}/api`;
  return (cfg.nodeUrl ?? '').replace(/\/+$/, '');
}

/**
 * Resolve the ordered list of node URLs for read failover.
 * Prefers the SDK-specified `nodeUrls` array (Part 1 config) and falls back to
 * the legacy single `nodeUrl` string.
 */
function getNodeUrls(): string[] {
  const cfg = KROSS_CONFIG as unknown as {
    nodeUrls?: string[];
    nodeUrl?: string;
  };
  if (Array.isArray(cfg.nodeUrls) && cfg.nodeUrls.length > 0) {
    return cfg.nodeUrls.map((u) => u.replace(/\/+$/, ''));
  }
  return cfg.nodeUrl ? [cfg.nodeUrl.replace(/\/+$/, '')] : [];
}

/**
 * Read-only fetch helper.
 *
 * Strategy:
 *   1. Try the indexed API base (SDK-preferred for reads).
 *   2. On network/HTTP failure, fall back across the RPC nodes for the same
 *      read-compatible path so a single endpoint outage doesn't break the UI.
 *
 * `path` must be the endpoint suffix WITHOUT a leading slash, e.g.
 * `addresses/balance/3K...`.
 */
async function apiFetch(path: string): Promise<Response> {
  const suffix = path.replace(/^\/+/, '');
  const bases = [getApiUrl(), ...getNodeUrls()].filter(Boolean);
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/${suffix}`);
      if (res.ok) return res;
      lastError = new Error(`Request failed (${res.status}) at ${base}`);
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All Kross read endpoints failed.');
}

export interface KrossAsset {
  assetId: string;
  name: string;
  balance: number;       // human-readable
  decimals: number;
  isNFT: boolean;
}

export interface KrossTx {
  id: string;
  type: number;
  timestamp: number;
  amount: number;        // human-readable KSS for transfers
  fee: number;
  sender: string;
  recipient?: string;
  direction: 'in' | 'out' | 'self';
}

/**
 * Fetch native KSS balance (converted from wavelets).
 * READ -> indexed API base (with node failover).
 */
export async function getKssBalance(address: string): Promise<number> {
  if (!address) return 0;
  const res = await apiFetch(`addresses/balance/${address}`);
  const data = await res.json().catch(() => ({}));
  const raw = typeof data?.balance === 'number' ? data.balance : 0;
  return fromWavelets(raw);
}

/**
 * Fetch all token/NFT balances held by the address.
 * READ -> indexed API base (with node failover).
 */
export async function getAssets(address: string): Promise<KrossAsset[]> {
  if (!address) return [];
  const res = await apiFetch(`assets/balance/${address}`);
  const data = await res.json().catch(() => ({}));
  const balances = Array.isArray(data?.balances) ? data.balances : [];
  return balances.map((b: any) => {
    const decimals = b.issueTransaction?.decimals ?? 0;
    const quantity = b.issueTransaction?.quantity ?? b.balance;
    const isNFT = decimals === 0 && quantity === 1;
    return {
      assetId: b.assetId,
      name: b.issueTransaction?.name ?? 'Unknown',
      balance: b.balance / Math.pow(10, decimals),
      decimals,
      isNFT,
    };
  });
}

/**
 * Fetch recent transactions for the address.
 * READ -> indexed API base (with node failover).
 */
export async function getTransactions(
  address: string,
  limit = 25
): Promise<KrossTx[]> {
  if (!address) return [];
  const res = await apiFetch(
    `transactions/address/${address}/limit/${limit}`
  );
  const data = await res.json().catch(() => ([] as unknown));
  // The transactions endpoint returns a nested array: [[...txs]].
  const list = Array.isArray((data as any)?.[0])
    ? (data as any)[0]
    : Array.isArray(data)
    ? (data as any)
    : [];
  return list.map((tx: any): KrossTx => {
    const isOut = tx.sender === address;
    const isIn = tx.recipient === address;
    let direction: KrossTx['direction'] = 'self';
    if (isOut && !isIn) direction = 'out';
    else if (isIn && !isOut) direction = 'in';
    return {
      id: tx.id,
      type: tx.type,
      timestamp: tx.timestamp,
      amount: tx.amount ? fromWavelets(tx.amount) : 0,
      fee: fromWavelets(tx.fee ?? 0),
      sender: tx.sender,
      recipient: tx.recipient,
      direction,
    };
  });
}
