// src/lib/blockchain/kross/marketplace-write.ts
//
// LIST / BUY / CANCEL WRITE MODULE for the Kross Marketplace dApp (RIDE v6).
// -----------------------------------------------------------------------------
// This module is the contract-ACCURATE transaction surface: it builds and
// broadcasts the three core invokeScript calls defined by the *deployed*
// contract (contracts/kross-marketplace.ride):
//
//   list(price: Int)          -- attach EXACTLY ONE NFT payment (amount 1) to escrow
//   delist(assetId: String)    -- no payment; returns the escrowed NFT to the seller
//   buy(assetId: String)       -- attach EXACTLY ONE KSS payment equal to the price
//
// It deliberately REUSES the shared, build-safe invokeScript plumbing in
// ./assets.ts (`invokeMarketplace`), which loads @waves/waves-transactions via
// the runtime loader, resolves the signing seed inside the SDK layer, attaches
// payments and broadcasts. We do NOT re-implement transaction building, seed
// resolution, or broadcasting here.
//
// Every guard below mirrors an on-chain `throw` in the contract so the client
// NEVER broadcasts a guaranteed-revert transaction (which would still cost the
// invoke fee):
//   * list:   price > 0, exactly 1 NFT unit attached, not already listed
//   * buy:    listing exists, exact KSS price attached as the single payment
//   * delist: listing exists, caller is the seller (or owner)
//
// Native currency: KSS == null assetId. NFTs are 0-decimal, single-unit assets
// attached by their base58 assetId with amount 1.
import './polyfills';
import { toWavelets } from './config';
import { MARKETPLACE_CONFIG } from './deployed.config';
import { isValidKrossAddress } from './sdk';
import { invokeMarketplace } from './assets';
import { getListings, invalidateListingsCache } from './marketplace-queries';

/* ------------------------------------------------------------------ *
 * Public types.
 * ------------------------------------------------------------------ */

/** Normalized result of any write (list/buy/cancel). */
export interface MarketplaceWriteResult {
  /** Broadcast transaction id. */
  txId: string;
  /** Direct explorer link to the tx. */
  explorerUrl: string;
}

export type MarketplaceWriteAction = 'list' | 'buy' | 'cancel';

/* ------------------------------------------------------------------ *
 * Entrypoint-name resolution.
 *
 * The deployed contract uses `list` / `delist` / `buy`. Some config maps use
 * the longer aliases (`listNFT` / `cancelListing` / `buyNFT`). We prefer the
 * deployed names but accept any configured alias so this module works against
 * either deployment without a code change.
 * ------------------------------------------------------------------ */
function fnMap(): Record<string, string> {
  return (MARKETPLACE_CONFIG.functions ?? {}) as Record<string, string>;
}

function listFn(): string {
  const f = fnMap();
  return f.list ?? f.listNFT ?? 'list';
}
function cancelFn(): string {
  const f = fnMap();
  return f.delist ?? f.cancel ?? f.cancelListing ?? 'delist';
}
function buyFn(): string {
  const f = fnMap();
  return f.buy ?? f.buyNFT ?? 'buy';
}

/* ------------------------------------------------------------------ *
 * Guards (mirror the contract throws — fail fast BEFORE signing).
 * ------------------------------------------------------------------ */

/** Resolve & validate the deployed marketplace dApp address. */
function requireDApp(): string {
  const dApp = MARKETPLACE_CONFIG.dAppAddress;
  if (!dApp || !isValidKrossAddress(String(dApp))) {
    throw new Error(
      'Marketplace dApp address is not configured. Set VITE_KROSS_MARKETPLACE_DAPP or a "marketplace" entry in deployed.config.'
    );
  }
  return String(dApp);
}

/** Validate a base58 Kross assetId (32-byte issue tx id, base58). */
function assertValidAssetId(assetId: string): void {
  if (!assetId || typeof assetId !== 'string') {
    throw new Error('A valid NFT assetId is required.');
  }
  if (assetId.toUpperCase() === 'KSS' || assetId.toLowerCase() === 'null') {
    throw new Error('Native KSS cannot be used as an NFT assetId.');
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(assetId)) {
    throw new Error('assetId is not a valid base58 asset identifier.');
  }
}

function assertPositivePrice(priceKSS: number, label = 'Price'): void {
  if (!Number.isFinite(priceKSS) || priceKSS <= 0) {
    throw new Error(`${label} must be a positive number of KSS.`);
  }
}

/** Find the live on-chain listing for an asset (or null if none/inactive). */
async function findActiveListing(assetId: string): Promise<{
  assetId: string;
  priceKSS: number;
  priceWavelets: number;
  seller?: string;
} | null> {
  const listings = await getListings();
  const found = listings.find((l) => l.assetId === assetId);
  if (!found || !(found.priceWavelets > 0)) return null;
  return {
    assetId: found.assetId,
    priceKSS: found.priceKSS,
    priceWavelets: found.priceWavelets,
    seller: found.seller,
  };
}

/* ================================================================== *
 * LIST  (NONE -> LISTED)
 * invokeScript -> list(price) with the NFT attached as the single
 * escrow payment (amount 1). The contract derives the assetId from the
 * attached payment, so we pass ONLY the price arg.
 * ================================================================== */
export async function listNFTForSale(params: {
  assetId: string;
  priceKSS: number;
  password?: string;
}): Promise<MarketplaceWriteResult> {
  const { assetId, priceKSS, password } = params;

  assertValidAssetId(assetId);
  assertPositivePrice(priceKSS);
  const dApp = requireDApp();

  // Mirror the contract's "Already listed" guard.
  const existing = await findActiveListing(assetId);
  if (existing) {
    throw new Error('This NFT is already listed for sale.');
  }

  // Contract `list(price: Int)` expects the price in integer wavelets so the
  // on-chain buy() can later require an exact-wavelet KSS payment.
  const priceWavelets = toWavelets(priceKSS);

  const result = await invokeMarketplace({
    dApp,
    fnName: listFn(),
    args: [{ type: 'integer', value: priceWavelets }],
    // Escrow exactly 1 NFT unit as the single payment (NOT native KSS).
    paymentAssetId: assetId,
    paymentAmount: 1,
    password,
  });

  invalidateListingsCache();
  return result;
}

/* ================================================================== *
 * BUY  (LISTED -> SOLD)
 * invokeScript -> buy(assetId) with the EXACT listing price attached as
 * the single native KSS payment. The contract atomically transfers the
 * NFT to the buyer and splits proceeds / fee / royalty.
 *
 * We resolve the live price so the attached amount equals the contract's
 * `pmt.amount != price` check and (optionally) verify it matches the
 * buyer's expected price to guard against a front-run price change.
 * ================================================================== */
export async function buyListedNFT(params: {
  assetId: string;
  /** Optional: the price the buyer agreed to (KSS). Guards against changes. */
  expectedPriceKSS?: number;
  password?: string;
}): Promise<MarketplaceWriteResult> {
  const { assetId, expectedPriceKSS, password } = params;

  assertValidAssetId(assetId);
  if (expectedPriceKSS !== undefined) {
    assertPositivePrice(expectedPriceKSS, 'Expected price');
  }
  const dApp = requireDApp();

  const listing = await findActiveListing(assetId);
  if (!listing) {
    throw new Error('This NFT is not listed for sale (no active listing found).');
  }

  // Guard against a price change between view and buy (front-run protection).
  if (
    expectedPriceKSS !== undefined &&
    toWavelets(expectedPriceKSS) !== listing.priceWavelets
  ) {
    throw new Error(
      `Listing price changed: now ${listing.priceKSS} KSS (you expected ${expectedPriceKSS} KSS). Price changed; please review and try again.`
    );
  }

  const result = await invokeMarketplace({
    dApp,
    fnName: buyFn(),
    args: [{ type: 'string', value: assetId }],
    // Attach the EXACT price in native KSS wavelets (single payment).
    paymentWavelets: listing.priceWavelets,
    password,
  });

  invalidateListingsCache();
  return result;
}

/* ================================================================== *
 * CANCEL  (LISTED -> NONE)
 * invokeScript -> delist(assetId). No payment attached; the contract
 * returns the escrowed NFT to the seller (seller/owner-only on-chain).
 * ================================================================== */
export async function cancelNFTListing(params: {
  assetId: string;
  /** Optional caller address used for a client-side seller pre-check. */
  callerAddress?: string;
  password?: string;
}): Promise<MarketplaceWriteResult> {
  const { assetId, callerAddress, password } = params;

  assertValidAssetId(assetId);
  const dApp = requireDApp();

  const listing = await findActiveListing(assetId);
  if (!listing) {
    throw new Error('This NFT is not currently listed (nothing to cancel).');
  }

  // Mirror the contract's "Only seller or owner can delist" guard when we know
  // who is signing. (The contract still enforces this regardless.)
  if (
    callerAddress &&
    listing.seller &&
    callerAddress !== listing.seller &&
    callerAddress !== MARKETPLACE_CONFIG.dAppAddress
  ) {
    throw new Error('Only the original seller (or contract owner) can cancel this listing.');
  }

  const result = await invokeMarketplace({
    dApp,
    fnName: cancelFn(),
    args: [{ type: 'string', value: assetId }],
    // Explicitly no payment for a cancel/return.
    paymentKSS: 0,
    password,
  });

  invalidateListingsCache();
  return result;
}

/* ------------------------------------------------------------------ *
 * Unified dispatch — single entrypoint for any write transition.
 * ------------------------------------------------------------------ */
export async function executeMarketplaceWrite(
  action: MarketplaceWriteAction,
  params: {
    assetId: string;
    priceKSS?: number;
    expectedPriceKSS?: number;
    callerAddress?: string;
    password?: string;
  }
): Promise<MarketplaceWriteResult> {
  switch (action) {
    case 'list':
      if (params.priceKSS == null) throw new Error('priceKSS is required to list.');
      return listNFTForSale({
        assetId: params.assetId,
        priceKSS: params.priceKSS,
        password: params.password,
      });
    case 'buy':
      return buyListedNFT({
        assetId: params.assetId,
        expectedPriceKSS: params.expectedPriceKSS,
        password: params.password,
      });
    case 'cancel':
      return cancelNFTListing({
        assetId: params.assetId,
        callerAddress: params.callerAddress,
        password: params.password,
      });
    default:
      throw new Error(`Unknown marketplace write action: ${action as string}`);
  }
}

/* ------------------------------------------------------------------ *
 * Convenience namespace for single-import consumers:
 *   import { marketplaceWrite } from '.../marketplace-write';
 *   await marketplaceWrite.listNFTForSale({ assetId, priceKSS });
 * ------------------------------------------------------------------ */
export const marketplaceWrite = {
  listNFTForSale,
  buyListedNFT,
  cancelNFTListing,
  executeMarketplaceWrite,
} as const;
