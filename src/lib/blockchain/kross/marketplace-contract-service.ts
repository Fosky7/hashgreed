// src/lib/blockchain/kross/marketplace-contract-service.ts
//
// MARKETPLACE CONTRACT SERVICE (business logic) for the rewritten Kross
// Marketplace contract (RIDE v6). Single, intention-revealing entrypoint that
// models the contract's rules as explicit state transitions:
//
//   NONE  --list(price)-->  LISTED  --buy()-->  SOLD
//                              \--delist()-->  NONE
//
// It REUSES existing shared units (does not re-implement tx building):
//   * invokeMarketplace            (./assets.ts)              -> build-safe write
//   * computeSplit / quoteSettlement (./settlement.ts)        -> fee+royalty math
//   * recordSale                   (./marketplace-sale.ts)    -> atomic buy
//   * getListings / invalidateListingsCache (./marketplace-queries.ts)
//   * MARKETPLACE_CONFIG / MARKETPLACE_PARAMS (./deployed.config.ts)
//   * toWavelets / fromWavelets    (./config.ts)
//
// All guards mirror the contract's on-chain `throw`s so the client never
// broadcasts a guaranteed-revert transaction (which would still cost a fee).
import './polyfills';
import { toWavelets, fromWavelets } from './config';
import { MARKETPLACE_CONFIG, MARKETPLACE_PARAMS } from './deployed.config';
import { isValidKrossAddress } from './sdk';
import { invokeMarketplace } from './assets';
import { getListings, invalidateListingsCache } from './marketplace-queries';
import { quoteSettlement } from './settlement';
import { recordSale } from './marketplace-sale';

/* ------------------------------------------------------------------ *
 * Contract state machine.
 * ------------------------------------------------------------------ */
export enum ContractState {
  /** No active listing for this asset. */
  NONE = 'NONE',
  /** Asset is escrowed in the dApp with a price + seller. */
  LISTED = 'LISTED',
  /** Asset was bought and settled (transient result of a buy). */
  SOLD = 'SOLD',
}

export type ContractAction = 'list' | 'delist' | 'buy';

export interface TransitionResult {
  action: ContractAction;
  fromState: ContractState;
  toState: ContractState;
  assetId: string;
  txId: string;
  explorerUrl: string;
}

export interface ContractQuote {
  assetId: string;
  priceKSS: number;
  priceWavelets: number;
  feeKSS: number;
  royaltyKSS: number;
  sellerProceedsKSS: number;
  feeBasisPoints: number;
  royaltyBasisPoints: number;
  creator: string | null;
  feeWallet: string;
}

/* ------------------------------------------------------------------ *
 * Guards (mirror the contract throws).
 * ------------------------------------------------------------------ */
function isPlaceholder(addr: string | undefined | null): boolean {
  if (!addr || typeof addr !== 'string') return true;
  const a = addr.trim();
  return a === '' || a.startsWith('<') || a.includes('BASE58') || a.includes('ReplaceMe');
}

function assertConfigured(): string {
  const dApp = MARKETPLACE_CONFIG.dAppAddress;
  if (isPlaceholder(dApp) || !isValidKrossAddress(String(dApp))) {
    throw new Error('Marketplace dApp address is not configured (still a placeholder).');
  }
  if (isPlaceholder(MARKETPLACE_PARAMS.feeWalletAddress)) {
    throw new Error('Fee wallet address is still a placeholder — set the real Kross 3K… address.');
  }
  return String(dApp);
}

function assertAssetId(assetId: string): void {
  if (!assetId || typeof assetId !== 'string') throw new Error('A valid NFT assetId is required.');
  if (assetId.toUpperCase() === 'KSS' || assetId.toLowerCase() === 'null') {
    throw new Error('Native KSS is not an NFT.');
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(assetId)) {
    throw new Error('assetId is not a valid base58 asset identifier.');
  }
}

function assertPrice(priceKSS: number): void {
  if (!Number.isFinite(priceKSS) || priceKSS <= 0) {
    throw new Error('Price must be a positive number of KSS.');
  }
}

/* ------------------------------------------------------------------ *
 * State inspection (order-matching support).
 * ------------------------------------------------------------------ */

/** Resolve the current on-chain state of a listing for an asset. */
export async function getContractState(assetId: string): Promise<{
  state: ContractState;
  priceKSS?: number;
  priceWavelets?: number;
  seller?: string;
}> {
  assertAssetId(assetId);
  const listings = await getListings();
  const found = listings.find((l) => l.assetId === assetId);
  if (!found || !(found.priceWavelets > 0)) return { state: ContractState.NONE };
  return {
    state: ContractState.LISTED,
    priceKSS: found.priceKSS,
    priceWavelets: found.priceWavelets,
    seller: found.seller,
  };
}

/* ------------------------------------------------------------------ *
 * Quote — fee + royalty + seller split BEFORE signing.
 * ------------------------------------------------------------------ */
export async function quoteContractSale(params: {
  assetId: string;
  priceKSS: number;
  seller: string;
}): Promise<ContractQuote> {
  const { assetId, priceKSS, seller } = params;
  assertAssetId(assetId);
  assertPrice(priceKSS);
  const q = await quoteSettlement({ assetId, priceKSS, seller });
  return {
    assetId,
    priceKSS,
    priceWavelets: q.split.priceWavelets,
    feeKSS: fromWavelets(q.split.feeWavelets),
    royaltyKSS: fromWavelets(q.split.royaltyWavelets),
    sellerProceedsKSS: fromWavelets(q.split.sellerWavelets),
    feeBasisPoints: q.split.feeBp,
    royaltyBasisPoints: q.split.royaltyBp,
    creator: q.creator,
    feeWallet: q.feeWallet,
  };
}

/* ------------------------------------------------------------------ *
 * Transition: LIST (NONE -> LISTED). Escrows exactly 1 NFT unit.
 * ------------------------------------------------------------------ */
export async function listAsset(params: {
  assetId: string;
  priceKSS: number;
  password?: string;
}): Promise<TransitionResult> {
  const { assetId, priceKSS, password } = params;
  const dApp = assertConfigured();
  assertAssetId(assetId);
  assertPrice(priceKSS);

  const current = await getContractState(assetId);
  if (current.state === ContractState.LISTED) {
    throw new Error('Asset is already listed.');
  }

  const tx = await invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.list ?? 'list',
    args: [{ type: 'integer', value: toWavelets(priceKSS) }],
    // Escrow exactly 1 NFT unit as the single payment.
    paymentWavelets: 1,
    paymentAssetId: assetId,
    password,
  });

  invalidateListingsCache();
  return {
    action: 'list',
    fromState: ContractState.NONE,
    toState: ContractState.LISTED,
    assetId,
    txId: tx.txId,
    explorerUrl: tx.explorerUrl,
  };
}

/* ------------------------------------------------------------------ *
 * Transition: DELIST (LISTED -> NONE). Returns escrowed NFT to seller.
 * ------------------------------------------------------------------ */
export async function delistAsset(params: {
  assetId: string;
  password?: string;
}): Promise<TransitionResult> {
  const { assetId, password } = params;
  const dApp = assertConfigured();
  assertAssetId(assetId);

  const current = await getContractState(assetId);
  if (current.state !== ContractState.LISTED) {
    throw new Error('Asset is not currently listed.');
  }

  const tx = await invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.delist ?? 'delist',
    args: [{ type: 'string', value: assetId }],
    password,
  });

  invalidateListingsCache();
  return {
    action: 'delist',
    fromState: ContractState.LISTED,
    toState: ContractState.NONE,
    assetId,
    txId: tx.txId,
    explorerUrl: tx.explorerUrl,
  };
}

/* ------------------------------------------------------------------ *
 * Transition: BUY (LISTED -> SOLD). Atomic settlement via recordSale.
 * Order matching: resolves the live listing and verifies the expected price.
 * ------------------------------------------------------------------ */
export async function buyAsset(params: {
  assetId: string;
  expectedPriceKSS?: number;
  password?: string;
}): Promise<TransitionResult> {
  const { assetId, expectedPriceKSS, password } = params;
  assertConfigured();
  assertAssetId(assetId);

  const current = await getContractState(assetId);
  if (current.state !== ContractState.LISTED) {
    throw new Error('Asset is not listed for sale.');
  }

  // Delegate atomic settlement (NFT -> buyer, proceeds -> seller,
  // fee -> fee wallet, royalty -> creator) to the existing sale unit.
  const sale = await recordSale({ assetId, expectedPriceKSS, password });

  return {
    action: 'buy',
    fromState: ContractState.LISTED,
    toState: ContractState.SOLD,
    assetId,
    txId: sale.txId,
    explorerUrl: sale.explorerUrl,
  };
}

/* ------------------------------------------------------------------ *
 * Unified dispatch — single entrypoint for any contract transition.
 * ------------------------------------------------------------------ */
export async function executeTransition(
  action: ContractAction,
  params: { assetId: string; priceKSS?: number; expectedPriceKSS?: number; password?: string }
): Promise<TransitionResult> {
  switch (action) {
    case 'list':
      if (params.priceKSS == null) throw new Error('priceKSS is required to list.');
      return listAsset({ assetId: params.assetId, priceKSS: params.priceKSS, password: params.password });
    case 'delist':
      return delistAsset({ assetId: params.assetId, password: params.password });
    case 'buy':
      return buyAsset({
        assetId: params.assetId,
        expectedPriceKSS: params.expectedPriceKSS,
        password: params.password,
      });
    default:
      throw new Error(`Unknown contract action: ${action as string}`);
  }
}
