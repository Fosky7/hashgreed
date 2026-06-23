// src/lib/blockchain/kross/config.ts
import DEPLOYED_CONFIG from './deployed.config';

export const KSS_DECIMALS = 8;
export const KSS_FACTOR = 100_000_000; // 10^8 wavelets per KSS

const deployedMarketplaceAddress =
  (DEPLOYED_CONFIG.contracts as ReadonlyArray<{ name?: string; address?: string }>)
    .find((c) => c?.name?.toLowerCase().includes('marketplace'))?.address ??
  (DEPLOYED_CONFIG as unknown as { dAppAddress?: string }).dAppAddress ??
  '';

export const KROSS_CONFIG = {
  chain: 'kross',
  chainId: 'N',
  nodeUrl: 'https://nodes.krossexplorer.com',
  nodeUrls: ['https://nodes.krossexplorer.com', 'https://nodes2.krossexplorer.com', 'https://nodes3.krossexplorer.com'],
  explorerUrl: 'https://krossexplorer.com',
  apiUrl: 'https://krossexplorer.com/api',
  addressPrefix: '3K',
  nativeCoin: 'KSS',
  nativeCoinInfo: { name: 'Kross', symbol: 'KSS', decimals: KSS_DECIMALS },
  unit: KSS_FACTOR,
  language: 'RIDE',
  marketplaceDApp: deployedMarketplaceAddress,
  fees: {
    transfer: 0.001,
    invoke: 0.005,
    updateNFTPrice: 0.005,
    issueNFT: 0.001,
    issueAsset: 1,
  },
} as const;

export const NODE_URL = KROSS_CONFIG.nodeUrl;
export const CHAIN_ID = KROSS_CONFIG.chainId;
export const EXPLORER_URL = KROSS_CONFIG.explorerUrl;
export const API_URL = KROSS_CONFIG.apiUrl;

// Marketplace config — derived from the read-only deployed config.
export const MARKETPLACE_CONFIG = {
  ...KROSS_CONFIG,
  dAppAddress: deployedMarketplaceAddress,
  contracts: DEPLOYED_CONFIG.contracts,
  functions: {
    list: 'listNFT',
    buy: 'buyNFT',
    updateNFTPrice: 'updateNFTPrice',
    cancel: 'cancelListing',
    delist: 'delist',
  },
} as const;

export const FEES = {
  TRANSFER: 100_000,
  MASS_TRANSFER: 700_000,
  ISSUE_ASSET: 100_000_000,
  ISSUE_NFT: 100_000,
  INVOKE_SCRIPT: 500_000,
  SET_SCRIPT: 1_000_000,
} as const;

/** Convert KSS (human units) -> wavelets (integer base units). */
export function toWavelets(amountKSS: number | string): number {
  const n = typeof amountKSS === 'string' ? Number(amountKSS) : amountKSS;
  if (!Number.isFinite(n)) throw new Error(`Invalid KSS amount: ${amountKSS}`);
  return Math.round(n * KSS_FACTOR);
}

/** Convert wavelets (integer base units) -> KSS (human units). */
export function fromWavelets(wavelets: number | string): number {
  const n = typeof wavelets === 'string' ? Number(wavelets) : wavelets;
  if (!Number.isFinite(n)) throw new Error(`Invalid wavelets amount: ${wavelets}`);
  return n / KSS_FACTOR;
}

// Aliases used across marketplace modules.
export const toBaseUnits = toWavelets;
export const fromBaseUnits = fromWavelets;

/** Format wavelets as a display string, e.g. "1.50000000 KSS". */
export function formatKSS(wavelets: number | string): string {
  return `${fromWavelets(wavelets).toFixed(KSS_DECIMALS)} KSS`;
}

/** Build an explorer URL for a transaction id. */
export function explorerTxUrl(txId: string): string {
  return `${EXPLORER_URL}/transactions/${txId}`;
}

/** Build an explorer URL for an address. */
export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

/** Build an explorer URL for an asset. */
export function explorerAssetUrl(assetId: string): string {
  return `${EXPLORER_URL}/assets/${assetId}`;
}

export { DEPLOYED_CONFIG };
export default KROSS_CONFIG;
