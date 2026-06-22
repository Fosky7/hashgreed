// src/lib/blockchain/kross/useCategories.ts
import { useSyncExternalStore, useCallback, useEffect } from "react";
import {
  subscribe, read, revalidate,
  setCategory as storeSet,
  clearCategory as storeClear,
} from "@/lib/blockchain/kross/categoryStore";
import type { NftCategoryId } from "@/lib/blockchain/kross/categories";

/**
 * Cross-device category access. Reads the cache instantly, then revalidates
 * from Supabase. Pass the currently-visible assetIds to keep refreshes small.
 */
export function useCategories(visibleAssetIds?: string[]) {
  const categories = useSyncExternalStore(subscribe, read, () => ({}));

  // Revalidate when the visible set changes (and on mount).
  const idsKey = visibleAssetIds ? visibleAssetIds.join(",") : "";
  useEffect(() => {
    void revalidate(visibleAssetIds && visibleAssetIds.length ? visibleAssetIds : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const setCategory = useCallback(
    (assetId: string, category: NftCategoryId) => storeSet(assetId, category),
    []
  );
  const clearCategory = useCallback(
    (assetId: string, opts?: { requireAuth?: boolean }) => storeClear(assetId, opts),
    []
  );
  const getCategory = useCallback(
    (assetId: string): NftCategoryId | undefined => categories[assetId],
    [categories]
  );

  return { categories, getCategory, setCategory, clearCategory, revalidate };
}
