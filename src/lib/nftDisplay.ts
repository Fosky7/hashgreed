;

/**
 * Centralized display helpers for the Hashgreed marketplace UI.
 *
 * These keep currency + category labeling consistent across the Explore page,
 * Home page, NFT detail and wallet surfaces WITHOUT mutating source data. All
 * normalization happens at render time so legacy/cached data (e.g. prices that
 * still say "ETH"/"KROSS", or a "Metaverse" category) is corrected on screen.
 */

/** The Kross blockchain native asset symbol. */
export const NATIVE_ASSET = 'KSS';

/**
 * Normalize any price string to use the KSS native asset symbol.
 * Maps legacy ETH / KROSS labels to KSS, preserving the numeric amount.
 * Examples: "0.45 ETH" -> "0.45 KSS", "1.2 KROSS" -> "1.2 KSS".
 */
export function normalizePrice(price: string | undefined | null): string {
  if (!price) return `0 ${NATIVE_ASSET}`;
  return price
    .replace(/\bKROSS\b/gi, NATIVE_ASSET)
    .replace(/\bETH\b/gi, NATIVE_ASSET)
    .trim();
}

/**
 * Parse the numeric portion of a price string for sorting/aggregation.
 * Returns 0 when no number can be found.
 */
export function parsePriceAmount(price: string | undefined | null): number {
  if (!price) return 0;
  const match = price.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Format a numeric KSS amount back into a display string.
 */
export function formatPrice(amount: number): string {
  const rounded = Number.isInteger(amount) ? amount : Number(amount.toFixed(4));
  return `${rounded} ${NATIVE_ASSET}`;
}

/**
 * Normalize a category label so the legacy "Metaverse" value always renders as
 * "Movies" in the UI. Accepts the canonical NFTCategory union or a free string.
 */
export function normalizeCategoryLabel(
  category: string | NFTCategory | undefined | null,
): string {
  if (!category) return '';
  return /metaverse/i.test(String(category)) ? 'Movies' : String(category);
}

/**
 * Compact count formatter used for category badges (e.g. 12840 -> "12.8k").
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1)}k`;
  }
  return String(count);
}
