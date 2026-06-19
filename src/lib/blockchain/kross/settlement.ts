// src/lib/blockchain/kross/settlement.ts
//
// ROYALTY & SALE SETTLEMENT SERVICE (business logic, WRITE-capable) for the
// Kross Marketplace dApp on RIDE v6.
// -----------------------------------------------------------------------------
// Responsibilities (this unit only):
//   1. Compute the EXACT payment split for a sale:
//        - 2.5% creator royalty (paid to the NFT issuer, forever)
//        - platform fee (basis points from on-chain/config)
//        - seller payout = price - royalty - fee (the remainder)
//   2. Resolve the creator (asset issuer) address per NFT from on-chain data.
//   3. Validate every amount so we NEVER broadcast a guaranteed-revert tx.
//   4. Trigger the ATOMIC on-chain settlement via buyNFT(assetId).
//
// It deliberately REUSES existing shared code:
//   * invokeMarketplace()  (./assets.ts)            -> build-safe write primitive
//   * MARKETPLACE_CONFIG / MARKETPLACE_PARAMS (./deployed.config.ts)
//   * fromWavelets / toWavelets (./config.ts)
//   * apiFetch-style resilient reads (via getListing/getMarketplaceFees here we
//     re-implement a tiny issuer lookup that mirrors marketplace-queries.ts).
//
// Money math is done ENTIRELY in integer wavelets using the same floor
// semantics as RIDE's `fraction(amount, bp, 10000)` so the client preview can
// never disagree with the contract's settlement.
import './polyfills';
import { fromWavelets, toWavelets } from './config';
import { MARKETPLACE_CONFIG, MARKETPLACE_PARAMS } from './deployed.config';
import { invokeMarketplace } from './assets';
import { invalidateListingsCache, getMarketplaceFees } from './marketplace-queries';
import { splitToKSS, SettlementQuote, SettlementResult } from './settlement.types';

const BPS_DENOMINATOR = 10_000;

/* ------------------------------------------------------------------ *
 * Pure split math — integer wavelets, floor division (matches RIDE).
 * ------------------------------------------------------------------ */

/** RIDE-equivalent fraction(amount, numerator, denominator) with floor. */
function fraction(amount: number, numerator: number, denominator: number): number {
  // Use BigInt to avoid precision loss for large wavelet amounts, then floor.
  const result = (BigInt(amount) * BigInt(numerator)) / BigInt(denominator);
  return Number(result);
}

/**
 * Compute the settlement split in wavelets. The order matters and MUST match
 * the contract: royalty first, then platform fee, then seller remainder. This
 * guarantees the three legs sum to EXACTLY the price (no rounding leak).
 *
 * @param priceWavelets total sale price in wavelets
 * @param feeBp         platform fee basis points (e.g. 250 = 2.5%)
 * @param royaltyBp     creator royalty basis points (e.g. 250 = 2.5%)
 * @param applyRoyalty  when false (self-sale: seller === creator) royalty is 0
 */
export function computeSplit(params: {
  priceWavelets: number;
  feeBp: number;
  royaltyBp: number;
  applyRoyalty: boolean;
}): SettlementSplit {
  const { priceWavelets, feeBp, royaltyBp, applyRoyalty } = params;

  if (!Number.isInteger(priceWavelets) || priceWavelets <= 0) {
    throw new Error('Price (wavelets) must be a positive integer.');
  }
  if (feeBp < 0 || royaltyBp < 0) {
    throw new Error('Fee/royalty basis points cannot be negative.');
  }
  if (feeBp > BPS_DENOMINATOR || royaltyBp > BPS_DENOMINATOR) {
    throw new Error('Fee/royalty basis points exceed 100%.');
  }
  const effectiveRoyaltyBp = applyRoyalty ? royaltyBp : 0;
  if (feeBp + effectiveRoyaltyBp > BPS_DENOMINATOR) {
    throw new Error('Combined fee + royalty exceeds 100% of the sale price.');
  }

  const royaltyWavelets = fraction(priceWavelets, effectiveRoyaltyBp, BPS_DENOMINATOR);
  const feeWavelets = fraction(priceWavelets, feeBp, BPS_DENOMINATOR);
  const sellerWavelets = priceWavelets - royaltyWavelets - feeWavelets;

  // Reconciliation: legs MUST sum to the price exactly before we ever sign.
  const total = sellerWavelets + royaltyWavelets + feeWavelets;
  if (total !== priceWavelets) {
    throw new Error(
      `Settlement reconciliation failed: legs (${total}) != price (${priceWavelets}).`
    );
  }
  if (sellerWavelets < 0) {
    throw new Error('Seller payout would be negative — fee/royalty too high.');
  }

  return {
    priceWavelets,
    sellerWavelets,
    royaltyWavelets,
    feeWavelets,
    feeBp,
    royaltyBp: effectiveRoyaltyBp,
    royaltyApplied: applyRoyalty && royaltyBp > 0,
  };
}

/* ------------------------------------------------------------------ *
 * Creator (asset issuer) resolution from on-chain asset details.
 * The contract uses assetInfo(assetId).issuer on-chain; off-chain we read the
 * same immutable issuer from the indexed asset-details endpoint, with the same
 * API-first / node-failover strategy used elsewhere in the dApp.
 * ------------------------------------------------------------------ */
function readBases(): string[] {
  const cfg = KROSS_CONFIG as unknown as {
    apiUrl?: string;
    explorerUrl?: string;
    nodeUrl?: string;
    nodeUrls?: readonly string[];
  };
  const out: string[] = [];
  if (cfg.apiUrl) out.push(cfg.apiUrl.replace(/\/+$/, ''));
  else if (cfg.explorerUrl) out.push(`${cfg.explorerUrl.replace(/\/+$/, '')}/api`);
  if (Array.isArray(cfg.nodeUrls)) out.push(...cfg.nodeUrls.map((u) => u.replace(/\/+$/, '')));
  if (cfg.nodeUrl) out.push(cfg.nodeUrl.replace(/\/+$/, ''));
  return [...new Set(out.filter(Boolean))];
}

async function resilientFetch(path: string): Promise<Response> {
  const suffix = path.replace(/^\/+/, '');
  let lastError: unknown = null;
  for (const base of readBases()) {
    try {
      const res = await fetch(`${base}/${suffix}`);
      if (res.ok) return res;
      lastError = new Error(`Request failed (${res.status}) at ${base}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All Kross read endpoints failed.');
}

/**
 * Resolve the NFT creator (asset issuer) address. Returns null when it cannot
 * be determined — callers then treat the sale as having no resolvable creator
 * (royalty is skipped on-chain too if the issuer can't be paid).
 */
export async function resolveCreatorAddress(assetId: string): Promise<string | null> {
  assertValidAssetId(assetId);
  try {
    const res = await resilientFetch(`assets/details/${assetId}`);
    const data: Record<string, unknown> = await res.json();
    // Different Kross/Waves explorer builds expose the issuer under slightly
    // different keys — accept the common variants.
    const issuer =
      (data.issuer as string | undefined) ??
      (data['issuer-address'] as string | undefined) ??
      (data.issuerAddress as string | undefined) ??
      null;
    return typeof issuer === 'string' && issuer.length > 0 ? issuer : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Validation helpers.
 * ------------------------------------------------------------------ */
function assertValidAssetId(assetId: string): void {
  if (!assetId || typeof assetId !== 'string') {
    throw new Error('A valid NFT assetId is required.');
  }
  if (assetId.toUpperCase() === 'KSS' || assetId.toLowerCase() === 'null') {
    throw new Error('Native KSS is not an NFT and cannot be settled as one.');
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(assetId)) {
    throw new Error('assetId is not a valid base58 asset identifier.');
  }
}

function requireDApp(): string {
  const dApp = MARKETPLACE_CONFIG.dAppAddress;
  if (!dApp) {
    throw new Error(
      'Marketplace dApp address is not configured. Set the deployed marketplace contract address in deployed.config.'
    );
  }
  return dApp;
}

/** Resolve effective platform fee bps: on-chain config first, then params. */
async function resolveFeeBp(): Promise<number> {
  try {
    const fees = await getMarketplaceFees();
    if (fees.commissionBps > 0) return fees.commissionBps;
  } catch {
    /* fall through to static config */
  }
  return MARKETPLACE_PARAMS.feeBasisPoints;
}

/* ------------------------------------------------------------------ *
 * QUOTE — compute (and validate) the full settlement BEFORE signing so the UI
 * can render the exact split and the user knows where every wavelet goes.
 * ------------------------------------------------------------------ */
export async function quoteSettlement(params: {
  assetId: string;
  priceKSS: number;
  seller: string;
}): Promise<SettlementQuote> {
  const { assetId, priceKSS, seller } = params;
  assertValidAssetId(assetId);
  if (!Number.isFinite(priceKSS) || priceKSS <= 0) {
    throw new Error('Price must be a positive number of KSS.');
  }
  if (!seller || typeof seller !== 'string') {
    throw new Error('Seller address is required to settle a sale.');
  }

  const priceWavelets = toWavelets(priceKSS);
  const [creator, feeBp] = await Promise.all([
    resolveCreatorAddress(assetId),
    resolveFeeBp(),
  ]);
  const royaltyBp = MARKETPLACE_PARAMS.royaltyBasisPoints;

  // Royalty is skipped when there is no resolvable creator, or when the seller
  // IS the creator (primary sale / self-sale) — matching on-chain behavior.
  const applyRoyalty = !!creator && creator !== seller;

  const split = computeSplit({ priceWavelets, feeBp, royaltyBp, applyRoyalty });

  return {
    assetId,
    seller,
    creator,
    feeWallet: MARKETPLACE_PARAMS.feeWalletAddress,
    split,
    splitKSS: splitToKSS(split, fromWavelets),
  };
}

/* ------------------------------------------------------------------ *
 * SETTLE — validate, then trigger the ATOMIC on-chain settlement via
 * buyNFT(assetId). The contract performs the real fund movement (NFT to buyer,
 * proceeds to seller, royalty to creator, fee to fee wallet) in one tx; we only
 * attach the exact price as the single KSS payment and mirror its guards.
 * ------------------------------------------------------------------ */
export async function settleSale(params: {
  assetId: string;
  priceKSS: number;
  seller: string;
  password?: string;
}): Promise<SettlementResult> {
  const { assetId, priceKSS, seller, password } = params;

  // 1. Build + validate the quote (throws on any invalid amount).
  const quote = await quoteSettlement({ assetId, priceKSS, seller });
  const dApp = requireDApp();

  // 2. Trigger atomic on-chain settlement. buyNFT(assetId) expects exactly one
  //    KSS payment equal to the listing price.
  const tx = await invokeMarketplace({
    dApp,
    fnName: MARKETPLACE_CONFIG.functions.buy, // 'buyNFT'
    args: [{ type: 'string', value: assetId }],
    // Attach exact price in KSS (native coin) as the single payment.
    paymentKSS: priceKSS,
    password,
  });

  // 3. The asset has been sold — drop the stale listings cache.
  invalidateListingsCache();

  return {
    txId: tx.txId,
    explorerUrl: tx.explorerUrl,
    quote,
  };
}
