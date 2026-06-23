// src/lib/blockchain/kross/categories.ts
/**
 * Supported NFT marketplace categories.
 *
 * NOTE: Categories are FRONT-END MANAGED ONLY. They are never sent to or stored
 * by the marketplace contract. This file is the single source of truth used by
 * the listing modal and any browse/filter UI.
 */
export const NFT_CATEGORIES = [
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "photography", label: "Photography", emoji: "📷" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "digital-ip", label: "Digital IP", emoji: "💡" },
] as const;

export type NftCategoryId = (typeof NFT_CATEGORIES)[number]["id"];

export const VALID_CATEGORY_IDS: ReadonlySet<string> = new Set(
  NFT_CATEGORIES.map((c) => c.id)
);

export function isValidCategory(id: string): id is NftCategoryId {
  return VALID_CATEGORY_IDS.has(id);
}

export function categoryLabel(id: string): string {
  return NFT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
