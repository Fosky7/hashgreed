// src/lib/blockchain/kross/marketplace.config.ts
// Hand-owned config — NOT auto-generated, safe from pipeline overwrite.
// Single source of truth for all marketplace + Kross chain constants.
import { DEPLOYED_CONFIG } from './deployed.config';

const NATIVE = DEPLOYED_CONFIG.nativeCoin;

/** 1 KSS = 100_000_000 wavelets (8 decimals). */
export const WAVELETS_PER_KSS = 10 ** NATIVE.decimals; // 100_000_000

/** Guard against Int overflow when converting prices to wavelets. */
export const MAX_PRICE_WAVELETS = 9_000_000_000_000_000; // < 2^63 safety bound

/** Deployed marketplace dApp address (set via env or deploy pipeline). */
export const MARKETPLACE_DAPP =
  (import.meta.env?.VITE_KROSS_MARKETPLACE_DAPP as string | undefined) ?? '';

/** Native KSS has no assetId (RIDE `unit`). */
export const NATIVE_ASSET_ID = null;

/** KSS <-> wavelets helpers. */
export function toWavelets(amountKSS: number): number {
  return Math.round(amountKSS * WAVELETS_PER_KSS);
}
export function fromWavelets(wavelets: number): number {
  return wavelets / WAVELETS_PER_KSS;
}

/** Network fees in KSS. */
export const FEES = {
  transfer: 0.001,
  invoke: 0.005,
  issueAsset: 1,
  issueNft: 0.001,
} as const;

/** Core Kross chain config consumed across the app. */
export const KROSS_CONFIG = {
  chain: 'kross',
  chainId: DEPLOYED_CONFIG.chainId,            // 'N'
  nodeUrl: DEPLOYED_CONFIG.nodeUrl,            // https://nodes.krossexplorer.com
  explorerUrl: DEPLOYED_CONFIG.explorerUrl,    // https://krossexplorer.com
  addressPrefix: DEPLOYED_CONFIG.addressPrefix,// '3K'
  nativeCoin: NATIVE.symbol,                   // 'KSS'
  unit: WAVELETS_PER_KSS,
  MARKETPLACE_DAPP,
  fees: FEES,
} as const;

/** Marketplace dApp address + entrypoint name map. */
export const MARKETPLACE_CONFIG = {
  dAppAddress: MARKETPLACE_DAPP,
  nativeAssetId: NATIVE_ASSET_ID,
  functions: {
    list: 'listNFT',
    delist: 'delistNFT',
    cancel: 'delistNFT',
    buy: 'buyNFT',
    updateNFTPrice: 'updateNFTPrice',
  },
} as const;

/** Fee / royalty parameters (basis points). */
export const MARKETPLACE_PARAMS = {
  feeBasisPoints: 250,      // 2.5% platform fee
  royaltyBasisPoints: 250,  // 2.5% creator royalty
  feeWalletAddress:
    (import.meta.env?.VITE_KROSS_FEE_WALLET as string | undefined) ?? '',
} as const;
