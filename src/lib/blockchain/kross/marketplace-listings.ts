// src/lib/blockchain/kross/marketplace-listings.ts
//
// LIST & MANAGE transaction module (WRITE) for the Kross Marketplace dApp.
//
// This module is the high-level, intention-revealing API the UI calls to
// create / update / cancel listings on the deployed RIDE v6 marketplace
// contract (contracts/kross-marketplace.ride).
//
// It deliberately REUSES the shared, build-safe invokeScript plumbing in
// ./assets.ts (which loads @waves/waves-transactions through the runtime
// loader, resolves the signing seed inside the SDK layer, attaches payments
// and broadcasts). We do NOT re-implement transaction building here.
//
// Contract entrypoints (see kross-marketplace.ride):
//   listNFT(price: Int, category: String)   -- NFT attached as the single payment (amount 1)
//   cancelListing(assetId: String)          -- no payment; returns escrowed NFT
//   buyNFT(assetId: String)                  -- handled by the buy module, not here
//
// Native currency: KSS == null assetId. NFTs are attached by their base58
// assetId with amount 1 (NFTs are 0-decimal, single-unit assets).
import './polyfills';
import { toWavelets } from './config';
import { MARKETPLACE_CONFIG } from './deployed.config';
import { isValidKrossAddress } from './sdk';
import { invokeMarketplace } from './assets';
import { invalidateListingsCache } from './marketplace-queries';

export interface ListingTxResult {
  txId: string;
  explorerUrl: string;
}

/**
 * Resolve & validate the deployed marketplace dApp address up front so we fail
 * fast (before signing) instead of broadcasting a guaranteed-revert tx.
 */
function requireDApp(): string {
  const dApp = MARKETPLACE_CONFIG.dAppAddress;
  if (!dApp || !isValidKrossAddress(dApp)) {
    throw new Error(
      'Marketplace dApp address is not configured. Set VITE_KROSS_MARKETPLACE_DAPP or a "marketplace" contract entry in deployed.config.'
    );
  }
  return dApp;
}

/**
 * Validate a base58 Kross assetId. Asset ids are 32-byte base58 strings (the
 * tx id of the issue). We keep this permissive but reject obvious garbage and
 * the native-KSS sentinel (an NFT cannot be the native coin).
 */
function assertValidAssetId(assetId: string): void {
  if (!assetId || typeof assetId !== 'string') {
    throw new Error('A valid NFT assetId is required.');
  }
  if (assetId.toUpperCase() === 'KSS' || assetId.toLowerCase() === 'null') {
    throw new Error('Native KSS cannot be listed as an NFT.');
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(assetId)) {
    throw new Error('assetId is not a valid base58 asset identifier.');
  }
}

/**
 * CREATE LISTING
 * --------------
 * Invokes listNFT(price, category) and ATTACHES the NFT as the single payment
 * (amount 1) so the contract escrows it. The contract derives the assetId from
 * the attached payment, so we pass only (price, category) as call args.
 *
 * @param assetId  base58 id of the NFT to list (attached as payment)
 * @param priceKSS sale price in whole KSS (converted to wavelets for the Int arg)
 * @param category human-readable category label stored on-chain
 * @param password optional one-off password; otherwise the unlocked session seed is used
 */
export async function createListing(params: {
  assetId: string;
  priceKSS: number;
  category: string;
  password?: string;
}): Promise<ListingTxResult> {
  const { assetId, priceKSS, category, password } = params;

  assertValidAssetId(assetId);
  if (!Number.isFinite(priceKSS) || priceKSS <= 0) {
    throw new Error('Price must be a positive number of KSS.');
  }
  const dApp = requireDApp();

  // price arg is in wavelets (Int) to match RIDE's Int price field.
  const priceWavelets = toWavelets(priceKSS);

  const result = await invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.list, // 'listNFT'
    args: [
      { type: 'integer', value: priceWavelets },
      { type: 'string', value: category ?? '' },
    ],
    // Attach the NFT itself (NOT native KSS) as the single escrow payment.
    paymentAssetId: assetId,
    paymentAmount: 1,
    password,
  });

  // Reads should reflect the new listing on the next fetch.
  invalidateListingsCache();
  return result;
}

/**
 * UPDATE LISTING PRICE (+ optional category)
 * ------------------------------------------
 * The RIDE v6 contract now exposes a single-call, seller-only
 * `updateListing(assetId, newPrice, newCategory)` entrypoint (and a
 * `updatePrice(assetId, newPrice)` alias). This helper PREFERS the single
 * on-chain call — one signature, one broadcast, NO NFT round-trip — because
 * the NFT stays escrowed in the dApp.
 *
 * It only falls back to the legacy two-step cancel + re-list flow when the
 * deployment exposes NEITHER `updateListing` nor `updatePrice`.
 *
 * Returns a discriminated result so the UI can render the right progress:
 *   { mode: 'single', update }           — one tx (preferred)
 *   { mode: 'relist', cancel, relist }    — two txs (legacy fallback)
 */
export async function updateListingPrice(params: {
  assetId: string;
  newPriceKSS: number;
  category: string;
  password?: string;
}): Promise<
  | { mode: 'single'; update: ListingTxResult }
  | { mode: 'relist'; cancel: ListingTxResult; relist: ListingTxResult }
> {
  const { assetId, newPriceKSS, category, password } = params;
  assertValidAssetId(assetId);
  if (!Number.isFinite(newPriceKSS) || newPriceKSS <= 0) {
    throw new Error('New price must be a positive number of KSS.');
  }

  const fns = MARKETPLACE_CONFIG.functions as Record<string, string>;
  const updateListingFn = fns.update;       // 'updateListing'
  const updatePriceFn = fns.updatePrice;     // 'updatePrice'

  // Preferred: single-call updateListing(assetId, newPrice, newCategory).
  if (updateListingFn) {
    const dApp = requireDApp();
    const update = await invokeMarketplace({
      dApp,
      fnName: updateListingFn,
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: toWavelets(newPriceKSS) },
        { type: 'string', value: category ?? '' },
      ],
      // In-place edit — no payment, the NFT remains escrowed.
      paymentKSS: 0,
      password,
    });
    invalidateListingsCache();
    return { mode: 'single', update };
  }

  // Next best: updatePrice(assetId, newPrice) (price-only, keeps category).
  if (updatePriceFn) {
    const dApp = requireDApp();
    const update = await invokeMarketplace({
      dApp,
      fnName: updatePriceFn,
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: toWavelets(newPriceKSS) },
      ],
      paymentKSS: 0,
      password,
    });
    invalidateListingsCache();
    return { mode: 'single', update };
  }

  // Legacy fallback: cancel + re-list (two independent transactions; the
  // seller must hold the NFT between them — wait for `cancel` to confirm).
  const cancel = await cancelListing({ assetId, password });
  const relist = await createListing({
    assetId,
    priceKSS: newPriceKSS,
    category,
    password,
  });
  return { mode: 'relist', cancel, relist };
}

/**
 * UPDATE LISTING PRICE (single call)
 * ----------------------------------
 * Forward-compatible path for deployments whose marketplace contract exposes a
 * dedicated `updatePrice(assetId: String, newPrice: Int)` entrypoint. Throws a
 * descriptive error if that entrypoint is not configured so callers can fall
 * back to the cancel+relist flow above.
 */
export async function updateListingPriceSingleCall(params: {
  assetId: string;
  newPriceKSS: number;
  password?: string;
}): Promise<ListingTxResult> {
  const { assetId, newPriceKSS, password } = params;
  assertValidAssetId(assetId);
  if (!Number.isFinite(newPriceKSS) || newPriceKSS <= 0) {
    throw new Error('New price must be a positive number of KSS.');
  }

  const fns = MARKETPLACE_CONFIG.functions as Record<string, string>;
  const updateFn = fns.updatePrice ?? fns.update;
  if (!updateFn) {
    throw new Error(
      'This marketplace contract has no updatePrice/updateListing entrypoint. Use updateListingPrice() (cancel + re-list) instead.'
    );
  }

  const dApp = requireDApp();
  // updateListing takes (assetId, newPrice, newCategory); updatePrice takes
  // (assetId, newPrice). Send the category arg only for the 3-arg entrypoint.
  const args =
    updateFn === fns.update
      ? [
          { type: 'string', value: assetId },
          { type: 'integer', value: toWavelets(newPriceKSS) },
          { type: 'string', value: '' },
        ]
      : [
          { type: 'string', value: assetId },
          { type: 'integer', value: toWavelets(newPriceKSS) },
        ];

  const result = await invokeMarketplace({
    dApp,
    fnName: updateFn,
    args,
    // No payment for an in-place price update.
    paymentKSS: 0,
    password,
  });
  invalidateListingsCache();
  return result;
}

/**
 * CANCEL LISTING
 * --------------
 * Invokes cancelListing(assetId). No payment is attached; the contract returns
 * the escrowed NFT to the seller (only the original seller may cancel — this
 * is enforced on-chain). We validate the assetId before signing.
 */
export async function cancelListing(params: {
  assetId: string;
  password?: string;
}): Promise<ListingTxResult> {
  const { assetId, password } = params;
  assertValidAssetId(assetId);
  const dApp = requireDApp();

  const result = await invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.cancel, // 'cancelListing'
    args: [{ type: 'string', value: assetId }],
    // Explicitly no payment.
    paymentKSS: 0,
    password,
  });

  // The asset is no longer listed — drop the stale cache.
  invalidateListingsCache();
  return result;
}
