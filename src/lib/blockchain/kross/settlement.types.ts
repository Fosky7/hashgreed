// src/lib/blockchain/kross/settlement.types.ts
//
// Type definitions for the Royalty & Sale Settlement service.
// Amounts are kept in BOTH integer wavelets (exact, on-chain) and human KSS
// (display) so the UI never re-derives money math.

/** The computed payment split for a single sale, in integer wavelets. */
export interface SettlementSplit {
  /** Total sale price (wavelets). */
  priceWavelets: number;
  /** Amount paid to the seller (wavelets) = price - royalty - fee. */
  sellerWavelets: number;
  /** Amount paid to the NFT creator as royalty (wavelets). */
  royaltyWavelets: number;
  /** Platform fee (wavelets). */
  feeWavelets: number;
  /** Platform fee basis points used. */
  feeBp: number;
  /** Effective royalty basis points used (0 when royalty not applied). */
  royaltyBp: number;
  /** Whether a creator royalty was actually applied to this sale. */
  royaltyApplied: boolean;
}

/** The same split rendered in human-readable KSS for the UI. */
export interface SettlementSplitKSS {
  priceKSS: number;
  sellerKSS: number;
  royaltyKSS: number;
  feeKSS: number;
}

/** Full pre-sign quote: who gets paid what, and where. */
export interface SettlementQuote {
  assetId: string;
  /** Current owner / seller receiving the proceeds. */
  seller: string;
  /** Resolved NFT creator (asset issuer) address, or null if unresolved. */
  creator: string | null;
  /** Wallet that receives the platform fee. */
  feeWallet: string;
  split: SettlementSplit;
  splitKSS: SettlementSplitKSS;
}

/** Result of triggering an on-chain settlement. */
export interface SettlementResult {
  txId: string;
  explorerUrl: string;
  quote: SettlementQuote;
}

/** Convert a wavelet split into a display KSS split. */
export function splitToKSS(
  split: SettlementSplit,
  fromWavelets: (w: number) => number
): SettlementSplitKSS {
  return {
    priceKSS: fromWavelets(split.priceWavelets),
    sellerKSS: fromWavelets(split.sellerWavelets),
    royaltyKSS: fromWavelets(split.royaltyWavelets),
    feeKSS: fromWavelets(split.feeWavelets),
  };
}
