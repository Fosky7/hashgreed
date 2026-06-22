// src/lib/blockchain/kross/purchase.ts
//
// Purchase transaction module (WRITE) for the Kross Marketplace dApp on RIDE v6.
// -----------------------------------------------------------------------------
// This module is a thin, hardened wrapper around the shared `invokeMarketplace`
// write primitive (src/lib/blockchain/kross/assets.ts). It encodes the EXACT
// rules enforced by `buyNFT(assetId)` in contracts/kross-marketplace.ride so the
// transaction settles in one atomic step instead of being rejected on-chain
// (which would still cost the invoke fee).
//
// Contract guards we mirror client-side (fail fast, before broadcast):
//   * Exactly ONE payment attached.
//   * Payment MUST be native KSS  -> assetId === null  (RIDE `unit`).
//   * Payment amount MUST EQUAL the listed price exactly.
//   * Buyer MUST NOT be the seller.
// On success the contract atomically pays the seller (escrow settlement) and
// ScriptTransfers the escrowed NFT (amount 1) to the buyer.
import './polyfills';
import { KROSS_CONFIG, toWavelets } from './config';
import { MARKETPLACE_CONFIG } from './deployed.config';
import { invokeMarketplace } from './assets';
import { isValidKrossAddress } from './sdk';
import { getStoredAddress } from './wallet-store';

export interface BuyResult {
  txId: string;
  explorerUrl: string;
}

export interface BuyParams {
  /** Base58 assetId of the listed NFT (must be currently listed on-chain). */
  assetId: string;
  /** Exact listed price in KSS. Must match the on-chain listing price. */
  priceKSS: number;
  /**
   * Optional seller address. When provided we enforce the contract's
   * "cannot buy your own NFT" rule client-side to fail fast.
   */
  seller?: string;
  /** Optional password for a one-off unlock; otherwise the session seed is used. */
  password?: string;
}

/**
 * Resolve the active buyer (wallet) address for the self-purchase guard.
 * Returns null when no wallet address is available (guard is then skipped
 * client-side and left to the contract).
 */
function getBuyerAddress(): string | null {
  try {
    return getStoredAddress();
  } catch {
    return null;
  }
}

/**
 * Invoke the marketplace `buyNFT(assetId)` function with the correct native-KSS
 * payment attachment. Escrow settlement (seller payout) and asset delivery
 * (NFT -> buyer) are performed atomically on-chain by the RIDE v6 contract.
 *
 * @throws if the marketplace dApp is not configured, the assetId/price are
 *         invalid, or the buyer is the seller.
 */
export async function buyListedNFT(params: BuyParams): Promise<BuyResult> {
  const { assetId, priceKSS, seller, password } = params;

  const dApp = MARKETPLACE_CONFIG.dAppAddress;
  if (!dApp || !isValidKrossAddress(dApp)) {
    throw new Error(
      'Marketplace dApp address is not configured. Deploy the marketplace contract and set VITE_KROSS_MARKETPLACE_DAPP.'
    );
  }
  if (!assetId || !assetId.trim()) {
    throw new Error('A listing assetId is required to buy.');
  }
  if (!(priceKSS > 0)) {
    throw new Error('Listing price must be greater than 0 KSS.');
  }

  // Contract guard: buyer cannot be the seller. Enforced here to fail fast.
  if (seller) {
    const buyer = getBuyerAddress();
    if (buyer && buyer === seller) {
      throw new Error('You cannot buy your own listing.');
    }
  }

  // buyNFT(assetId: String) — single string arg.
  // Payment MUST be native KSS == null assetId (RIDE `unit`), amount == price.
  // We pass the exact price; invokeMarketplace converts KSS -> wavelets and
  // attaches a single payment with the native asset (null).
  return invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.buy, // 'buyNFT'
    args: [{ type: 'string', value: assetId }],
    paymentKSS: priceKSS,
    paymentAssetId: MARKETPLACE_CONFIG.nativeAssetId, // null -> native KSS (unit)
    password,
  });
}

/**
 * Convenience: the exact payment amount (in wavelets) that buyNFT requires.
 * Useful for pre-flight balance checks in the UI before invoking.
 */
export function buyPaymentWavelets(priceKSS: number): number {
  return toWavelets(priceKSS);
}

/**
 * Poll the node until the buy transaction is recorded (escrow settled and NFT
 * delivered). Mirrors the polling pattern used by transfer.ts.
 *
 * @returns true if the tx was found within the timeout window.
 */
export async function waitForBuySettlement(
  txId: string,
  timeoutMs = 60000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${KROSS_CONFIG.nodeUrl}/transactions/info/${txId}`);
    if (res.ok) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}
