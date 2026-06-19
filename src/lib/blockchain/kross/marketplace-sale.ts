// src/lib/blockchain/kross/marketplace-sale.ts
//
// MARKETPLACE SALE API (WRITE) for the Kross Marketplace dApp (RIDE v6).
// -----------------------------------------------------------------------------
// This is the "sale endpoint" unit: it INITIATES and RECORDS a marketplace sale
// by invoking the deployed contract's settlement entrypoint `buyNFT(assetId)`.
// The contract atomically:
//   * transfers the NFT to the buyer,
//   * pays the seller their proceeds,
//   * routes the 2.5% marketplace fee to the fee wallet, and
//   * pays the 2.5% creator royalty to the NFT issuer (assetInfo().issuer).
//
// There is NO server runtime — settlement happens on-chain. This module is the
// thin, hardened client service the UI calls. It REUSES the shared, build-safe
// invokeScript plumbing in ./assets.ts and the resilient READ layer in
// ./marketplace-queries.ts. We do NOT re-implement transaction building.
import './polyfills';
import { fromWavelets } from './config';
import { MARKETPLACE_CONFIG, MARKETPLACE_PARAMS } from './deployed.config';
import { isValidKrossAddress } from './sdk';
import { invokeMarketplace } from './assets';
import { getListings, invalidateListingsCache } from './marketplace-queries';

/** Breakdown of how a sale's KSS is split, in whole KSS. */
export interface SaleSplit {
  priceKSS: number;
  feeKSS: number;        // marketplace fee (2.5%)
  royaltyKSS: number;    // creator royalty (2.5%)
  sellerProceedsKSS: number;
  feeBasisPoints: number;
  royaltyBasisPoints: number;
}

/** Structured status returned by the sale endpoint. */
export interface SaleTransactionStatus {
  status: 'broadcast';
  txId: string;
  explorerUrl: string;
  assetId: string;
  seller: string;
  split: SaleSplit;
}

/** Address is still a deployment placeholder (e.g. "<OWNER_ADDRESS_BASE58>"). */
export function isPlaceholder(addr: string | undefined | null): boolean {
  if (!addr || typeof addr !== 'string') return true;
  const a = addr.trim();
  return a === '' || a.startsWith('<') || /_BASE58>?$/.test(a) || a.includes('BASE58');
}

/** True only when an address is a real, configured Kross base58 address. */
export function isConfiguredAddress(addr: string | undefined | null): boolean {
  return !isPlaceholder(addr) && isValidKrossAddress(String(addr));
}

/**
 * CONFIG GUARD
 * ------------
 * Fail fast (BEFORE signing/broadcast) unless the marketplace dApp, contract
 * owner and fee-wallet addresses are all real Kross base58 (3K…) addresses and
 * NOT the deployment placeholders. This is the core requirement of this unit.
 */
export function assertSaleConfig(): void {
  const dApp = MARKETPLACE_CONFIG.dAppAddress;
  if (!isConfiguredAddress(dApp)) {
    throw new Error(
      'Marketplace dApp address is not configured. Set VITE_KROSS_MARKETPLACE_DAPP or a "marketplace" entry in deployed.config.'
    );
  }
  if (!isConfiguredAddress(MARKETPLACE_PARAMS.ownerAddress)) {
    throw new Error(
      'Contract owner address is still a placeholder. Replace MARKETPLACE_PARAMS.ownerAddress with the real Kross 3K… address before processing sales.'
    );
  }
  if (!isConfiguredAddress(MARKETPLACE_PARAMS.feeWalletAddress)) {
    throw new Error(
      'Fee wallet address is still a placeholder. Replace MARKETPLACE_PARAMS.feeWalletAddress with the real Kross 3K… address before processing sales.'
    );
  }
}

/** Validate a base58 Kross assetId; reject the native-KSS sentinel. */
function assertValidAssetId(assetId: string): void {
  if (!assetId || typeof assetId !== 'string') {
    throw new Error('A valid NFT assetId is required.');
  }
  if (assetId.toUpperCase() === 'KSS' || assetId.toLowerCase() === 'null') {
    throw new Error('Native KSS cannot be bought as an NFT.');
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(assetId)) {
    throw new Error('assetId is not a valid base58 asset identifier.');
  }
}

/** Compute the 2.5% fee / 2.5% royalty / seller split from a price (wavelets). */
function computeSplit(priceWavelets: number): SaleSplit {
  const feeBp = MARKETPLACE_PARAMS.feeBasisPoints;
  const royBp = MARKETPLACE_PARAMS.royaltyBasisPoints;
  const feeW = Math.floor((priceWavelets * feeBp) / 10000);
  const royW = Math.floor((priceWavelets * royBp) / 10000);
  const sellerW = priceWavelets - feeW - royW;
  return {
    priceKSS: fromWavelets(priceWavelets),
    feeKSS: fromWavelets(feeW),
    royaltyKSS: fromWavelets(royW),
    sellerProceedsKSS: fromWavelets(sellerW),
    feeBasisPoints: feeBp,
    royaltyBasisPoints: royBp,
  };
}

/** Resolve a live listing so we attach the EXACT on-chain price (wavelets). */
async function resolveListing(assetId: string): Promise<Listing> {
  const listings = await getListings();
  const found = listings.find((l) => l.assetId === assetId);
  if (!found) {
    throw new Error('Listing not found or no longer active for this asset.');
  }
  if (!(found.priceWavelets > 0)) {
    throw new Error('Listing has an invalid price.');
  }
  return found;
}

/**
 * RECORD SALE (initiate + settle)
 * -------------------------------
 * Invokes buyNFT(assetId), attaching the EXACT listing price in KSS as the
 * single payment so the contract settles atomically (NFT -> buyer; proceeds ->
 * seller; 2.5% fee -> fee wallet; 2.5% royalty -> creator). Returns the
 * transaction status with the full fund split.
 *
 * @param params.assetId  base58 NFT id being purchased
 * @param params.expectedPriceKSS optional client-side guard; if provided it must
 *        match the on-chain listing price (prevents buying at a changed price)
 * @param params.password optional one-off password; otherwise the session seed
 */
export async function recordSale(params: {
  assetId: string;
  expectedPriceKSS?: number;
  password?: string;
}): Promise<SaleTransactionStatus> {
  const { assetId, expectedPriceKSS, password } = params;

  // 1) Config + input validation BEFORE any signing/broadcast.
  assertSaleConfig();
  assertValidAssetId(assetId);

  // 2) Resolve the live price so the payment matches the contract guard exactly.
  const listing = await resolveListing(assetId);
  if (
    typeof expectedPriceKSS === 'number' &&
    Number.isFinite(expectedPriceKSS) &&
    Math.abs(expectedPriceKSS - listing.priceKSS) > 1e-9
  ) {
    throw new Error(
      `Listing price changed (now ${listing.priceKSS} KSS). Refresh and confirm before buying.`
    );
  }

  const split = computeSplit(listing.priceWavelets);

  // 3) Invoke buyNFT(assetId) with the EXACT price as the single KSS payment.
  const dApp = MARKETPLACE_CONFIG.dAppAddress as string;
  const result = await invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.buy, // 'buyNFT'
    args: [{ type: 'string', value: assetId }],
    // Native KSS payment (paymentAssetId omitted => KSS), exact wavelets.
    paymentWavelets: listing.priceWavelets,
    password,
  });

  // 4) Ownership changed — reads should reflect the removed listing.
  invalidateListingsCache();

  return {
    status: 'broadcast',
    txId: result.txId,
    explorerUrl: result.explorerUrl,
    assetId,
    seller: listing.seller,
    split,
  };
}
