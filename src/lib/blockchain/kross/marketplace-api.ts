// src/lib/blockchain/kross/marketplace-api.ts
//
// MARKETPLACE API ENDPOINT (client service facade) for the Kross Marketplace
// dApp (RIDE v6).
// ---------------------------------------------------------------------------
// This unit is the SINGLE, intention-revealing entrypoint the UI/consumers call
// to perform every marketplace contract operation:
//
//   * createListingOrder   -> list/escrow an NFT       (delegates to marketplace-listings)
//   * updateListingOrder    -> change a listing price    (delegates to marketplace-listings)
//   * cancelListingOrder    -> cancel/return escrow      (delegates to marketplace-listings)
//   * placeBuyOrder         -> atomic buy + settlement    (delegates to marketplace-sale)
//   * read passthroughs      -> listings/categories        (delegates to marketplace-queries)
//
// Design rules for THIS unit (and only this unit):
//   1. VALIDATE input first (assetId base58, positive price, configured
//      non-placeholder addresses) so we fail fast BEFORE any signing/broadcast.
//   2. DELEGATE to the already-built contract service modules. We do NOT build
//      transactions, touch the SDK, resolve seeds or re-implement contract
//      logic here. Settlement is atomic ON-CHAIN (there is no server runtime).
//   3. Return a NORMALIZED, API-style envelope so the UI can branch on a
//      single shape with a stable `operation` discriminator + error `code`.
import './polyfills';

import { createListing, updateListingPrice, cancelListing } from './marketplace-listings';

// Contract-accurate list/buy/cancel write module (mirrors the deployed
// kross-marketplace.ride entrypoints: list / delist / buy). Re-exported below
// so consumers can use the exact-contract writes through this same facade.
import { marketplaceWrite } from './marketplace-write';

import { recordSale, assertSaleConfig, isConfiguredAddress } from './marketplace-sale';

import { getListings, getCategories, getListingsByCategory, getMarketplaceFees } from './marketplace-queries';

import { MARKETPLACE_CONFIG } from './deployed.config';

/* ------------------------------------------------------------------ *
 * Public envelope types — the API \"response\" contract.
 * ------------------------------------------------------------------ */

export type MarketplaceOperation =
  | 'create_listing'
  | 'update_listing'
  | 'cancel_listing'
  | 'place_order';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFIG_ERROR'
  | 'NOT_FOUND'
  | 'PRICE_CHANGED'
  | 'CONTRACT_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export type ApiResult<T> =
  | { ok: true; operation: MarketplaceOperation; data: T }
  | { ok: false; operation: MarketplaceOperation; error: ApiError };

/** Result of the create/update/cancel mutating operations. */
export interface ListingOperationResult {
  assetId: string;
  tx: ListingTxResult;
  /** For updates: 'single' on-chain edit, or 'relist' (cancel + re-list). */
  mode?: 'single' | 'relist';
  /** Present only when mode === 'relist'. */
  relist?: { cancel: ListingTxResult; relist: ListingTxResult };
}

export type { Listing, MarketplaceFees, SaleSplit, SaleTransactionStatus };

/* ------------------------------------------------------------------ *
 * Shared validation (fail fast, BEFORE signing/broadcast).
 * ------------------------------------------------------------------ */

const BASE58_ASSET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

class ApiValidationError extends Error {
  code: ApiErrorCode;
  constructor(message: string, code: ApiErrorCode = 'VALIDATION_ERROR') {
    super(message);
    this.code = code;
  }
}

function validateAssetId(assetId: string): void {
  if (!assetId || typeof assetId !== 'string') {
    throw new ApiValidationError('A valid NFT assetId is required.');
  }
  if (assetId.toUpperCase() === 'KSS' || assetId.toLowerCase() === 'null') {
    throw new ApiValidationError('Native KSS cannot be used as an NFT assetId.');
  }
  if (!BASE58_ASSET_RE.test(assetId)) {
    throw new ApiValidationError('assetId is not a valid base58 asset identifier.');
  }
}

function validatePrice(priceKSS: number, label = 'Price'): void {
  if (!Number.isFinite(priceKSS) || priceKSS <= 0) {
    throw new ApiValidationError(`${label} must be a positive number of KSS.`);
  }
}

function validateCategory(category: string): string {
  const c = (category ?? '').trim();
  if (c.length > 64) {
    throw new ApiValidationError('Category must be 64 characters or fewer.');
  }
  return c;
}

/**
 * Guard the deployed marketplace configuration. For mutating LISTING
 * operations we only require a real dApp address (escrow/return target);
 * BUY orders additionally require real owner + fee-wallet addresses (handled
 * by assertSaleConfig in the sale service).
 */
function assertListingConfig(): void {
  if (!isConfiguredAddress(MARKETPLACE_CONFIG.dAppAddress)) {
    throw new ApiValidationError(
      'Marketplace dApp address is not configured. Set VITE_KROSS_MARKETPLACE_DAPP or a \"marketplace\" entry in deployed.config.',
      'CONFIG_ERROR'
    );
  }
}

/** Map any thrown error into a normalized ApiError with a best-effort code. */
function toApiError(e: unknown): ApiError {
  if (e instanceof ApiValidationError) {
    return { code: e.code, message: e.message };
  }
  const message = e instanceof Error ? e.message : 'Unexpected marketplace error.';
  let code: ApiErrorCode = 'CONTRACT_ERROR';
  if (/not configured|placeholder/i.test(message)) code = 'CONFIG_ERROR';
  else if (/not found|no longer active/i.test(message)) code = 'NOT_FOUND';
  else if (/price changed/i.test(message)) code = 'PRICE_CHANGED';
  else if (/required|invalid|must be|valid base58/i.test(message)) code = 'VALIDATION_ERROR';
  return { code, message };
}

function ok<T>(operation: MarketplaceOperation, data: T): ApiResult<T> {
  return { ok: true, operation, data };
}
function fail<T>(operation: MarketplaceOperation, e: unknown): ApiResult<T> {
  return { ok: false, operation, error: toApiError(e) };
}

/* ================================================================== *
 * WRITE OPERATIONS — validate then delegate to the contract service.
 * ================================================================== */

/**
 * CREATE LISTING ORDER
 * Validates input, then delegates to the contract's list/escrow entrypoint.
 */
export async function createListingOrder(input: {
  assetId: string;
  priceKSS: number;
  category?: string;
  password?: string;
}): Promise<ApiResult<ListingOperationResult>> {
  const op: MarketplaceOperation = 'create_listing';
  try {
    validateAssetId(input.assetId);
    validatePrice(input.priceKSS);
    const category = validateCategory(input.category ?? '');
    assertListingConfig();

    const tx = await createListing({
      assetId: input.assetId,
      priceKSS: input.priceKSS,
      category,
      password: input.password,
    });
    return ok(op, { assetId: input.assetId, tx });
  } catch (e) {
    return fail(op, e);
  }
}

/**
 * UPDATE LISTING ORDER
 * Validates input, then delegates to the single-call update (the service
 * transparently falls back to cancel + re-list when the contract lacks a
 * dedicated update entrypoint).
 */
export async function updateListingOrder(input: {
  assetId: string;
  newPriceKSS: number;
  category?: string;
  password?: string;
}): Promise<ApiResult<ListingOperationResult>> {
  const op: MarketplaceOperation = 'update_listing';
  try {
    validateAssetId(input.assetId);
    validatePrice(input.newPriceKSS, 'New price');
    const category = validateCategory(input.category ?? '');
    assertListingConfig();

    const res = await updateListingPrice({
      assetId: input.assetId,
      newPriceKSS: input.newPriceKSS,
      category,
      password: input.password,
    });

    if (res.mode === 'single') {
      return ok(op, { assetId: input.assetId, tx: res.update, mode: 'single' });
    }
    // Legacy two-step path: surface both txs; report the relist tx as primary.
    return ok(op, {
      assetId: input.assetId,
      tx: res.relist,
      mode: 'relist',
      relist: { cancel: res.cancel, relist: res.relist },
    });
  } catch (e) {
    return fail(op, e);
  }
}

/**
 * CANCEL LISTING ORDER
 * Validates input, then delegates to the contract's cancel/return-escrow
 * entrypoint (seller-only enforcement is on-chain).
 */
export async function cancelListingOrder(input: {
  assetId: string;
  password?: string;
}): Promise<ApiResult<ListingOperationResult>> {
  const op: MarketplaceOperation = 'cancel_listing';
  try {
    validateAssetId(input.assetId);
    assertListingConfig();

    const tx = await cancelListing({
      assetId: input.assetId,
      password: input.password,
    });
    return ok(op, { assetId: input.assetId, tx });
  } catch (e) {
    return fail(op, e);
  }
}

/**
 * PLACE BUY ORDER (execute transaction)
 * Validates input + full config, then delegates to the atomic buy settlement.
 * The contract pays seller proceeds, 2.5% marketplace fee and 2.5% creator
 * royalty in one transaction.
 */
export async function placeBuyOrder(input: {
  assetId: string;
  expectedPriceKSS?: number;
  password?: string;
}): Promise<ApiResult<SaleTransactionStatus>> {
  const op: MarketplaceOperation = 'place_order';
  try {
    validateAssetId(input.assetId);
    if (input.expectedPriceKSS !== undefined) {
      validatePrice(input.expectedPriceKSS, 'Expected price');
    }
    // Full config guard (dApp + owner + fee wallet must be real, non-placeholder).
    assertSaleConfig();

    const status = await recordSale({
      assetId: input.assetId,
      expectedPriceKSS: input.expectedPriceKSS,
      password: input.password,
    });
    return ok(op, status);
  } catch (e) {
    return fail(op, e);
  }
}

/** Alias matching transactional naming used by callers/tests. */
export const executeSale = placeBuyOrder;

/* ================================================================== *
 * READ PASSTHROUGHS — delegate to the resilient query layer.
 * These never throw for transient endpoint failures (queries layer guards).
 * ================================================================== */

export async function listMarketplace(): Promise<Listing[]> {
  return getListings();
}

export async function getMarketplaceListing(
  assetId: string
): Promise<Listing | null> {
  try {
    validateAssetId(assetId);
  } catch {
    return null;
  }
  const all = await getListings();
  return all.find((l) => l.assetId === assetId) ?? null;
}

export async function getMarketplaceCategories(): Promise<string[]> {
  return getCategories();
}

export async function getMarketplaceListingsByCategory(
  category: string
): Promise<Listing[]> {
  return getListingsByCategory(category);
}

export async function getMarketplaceFeeParams(): Promise<MarketplaceFees> {
  return getMarketplaceFees();
}

/* ------------------------------------------------------------------ *
 * Convenience namespace so consumers can import a single object:
 *   import { marketplaceApi } from '.../marketplace-api';
 *   await marketplaceApi.placeBuyOrder({ assetId });
 * ------------------------------------------------------------------ */
export const marketplaceApi = {
  createListingOrder,
  updateListingOrder,
  cancelListingOrder,
  placeBuyOrder,
  executeSale,
  // Contract-accurate write module (list/delist/buy as deployed on-chain).
  write: marketplaceWrite,
  listMarketplace,
  getMarketplaceListing,
  getMarketplaceCategories,
  getMarketplaceListingsByCategory,
  getMarketplaceFeeParams,
} as const;
