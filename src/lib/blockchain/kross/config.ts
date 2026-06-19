// src/lib/blockchain/kross/config.ts
//
// Source of truth: https://decentralizedafrica.com/sdk (Kross chain).
// This file is the chain/network configuration service for the app.

/**
 * Resilient node endpoints for WRITE / RPC operations (broadcasting,
 * tx info polling). The primary node is listed first; nodes2/nodes3 are
 * backups used for failover. Indexed READ queries should instead use
 * `apiUrl` (see getApiUrl / part 2 query refactor).
 */
export const KROSS_NODE_URLS = [
  'https://nodes.krossexplorer.com',
  'https://nodes2.krossexplorer.com',
  'https://nodes3.krossexplorer.com',
] as const;

export const KROSS_CONFIG = {
  // Resilient node list (primary first, then backups) for RPC/broadcast.
  nodeUrls: KROSS_NODE_URLS,
  // Backward-compatible single-node accessor (primary). Existing callers in
  // queries.ts / transfer.ts / assets.ts / marketplace-queries.ts keep working
  // until they are migrated to nodeUrls/apiUrl in part 2.
  nodeUrl: KROSS_NODE_URLS[0],
  // Dedicated indexed API base for READ queries (balances, txs, listings).
  apiUrl: 'https://krossexplorer.com/api',
  chainId: 'N',
  explorerUrl: 'https://krossexplorer.com',
  nativeCoin: 'KSS',
  decimals: 8,
  addressPrefix: '3K',
  // Strict Kross address format per SDK: '3K' + 33 alphanumeric chars.
  addressRegex: /^3K[a-zA-Z0-9]{33}$/,
  // 1 KSS = 100,000,000 wavelets
  unit: 100_000_000,
  fees: {
    transfer: 0.001,
    massTransfer: 0.007,
    issueAsset: 1,
    issueNFT: 0.001,
    // SDK-specified dApp invocation fee.
    invoke: 0.0065,
    setScript: 0.01,
  },
} as const;

/**
 * Returns the active node URL for WRITE / RPC operations.
 * Acts as the single switch point so failover logic (part 2's resilient
 * broadcast) can iterate KROSS_CONFIG.nodeUrls when a node is unreachable.
 */
export const getActiveNode = (index = 0): string =>
  KROSS_CONFIG.nodeUrls[index] ?? KROSS_CONFIG.nodeUrls[0];

/** Returns the indexed READ API base URL. */
export const getApiUrl = (): string => KROSS_CONFIG.apiUrl;

export const toWavelets = (kss: number): number =>
  Math.round(kss * KROSS_CONFIG.unit);

export const fromWavelets = (wavelets: number): number =>
  wavelets / KROSS_CONFIG.unit;
