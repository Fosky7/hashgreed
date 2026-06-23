// src/components/MarketplacePage.tsx
import { useMemo, useState } from "react";
import { Store, Loader2, PackageOpen } from "lucide-react";
import CategoryFilterBar, { type CategoryFilter } from "@/components/CategoryFilterBar";
import ListNftModal from "@/components/ListNftModal";
import { useCategories } from "@/lib/blockchain/kross/useCategories";
import { useMarketplace } from "@/lib/blockchain/kross/useMarketplace";
import { categoryLabel, type NftCategoryId } from "@/lib/blockchain/kross/categories";
import type { OwnedNft } from "@/lib/blockchain/kross/fetchNfts";

export default function MarketplacePage() {
  const { listings, loading } = useMarketplace();
  const { getCategory, setCategory } = useCategories();

  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [listingNft, setListingNft] = useState<OwnedNft | null>(null);

  // Per-category counts for the filter badges, derived from local mapping.
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const l of listings) {
      const cat = getCategory(l.assetId);
      if (cat) out[cat] = (out[cat] ?? 0) + 1;
    }
    return out;
  }, [listings, getCategory]);

  // Apply the active filter. "all" shows everything regardless of mapping.
  const visible = useMemo(() => {
    if (filter === "all") return listings;
    return listings.filter((l) => getCategory(l.assetId) === filter);
  }, [listings, filter, getCategory]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-5 flex items-center gap-2">
        <Store className="h-5 w-5 text-indigo-300" />
        <h1 className="text-lg font-semibold text-white">Marketplace</h1>
      </div>

      <div className="mb-5">
        <CategoryFilterBar
          value={filter}
          onChange={setFilter}
          counts={counts}
          totalCount={listings.length}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading listings…</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-white/40">
          <PackageOpen className="h-8 w-8" />
          <p className="text-sm">
            {filter === "all"
              ? "No active listings yet."
              : `No listings in ${categoryLabel(filter)}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((l) => {
            const cat = getCategory(l.assetId);
            return (
              <div
                key={l.assetId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-square bg-black/30">
                  {l.image && (
                    <img
                      src={l.image}
                      alt={l.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {l.name}
                    </p>
                    {cat && (
                      <span className="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
                        {categoryLabel(cat)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-indigo-300">
                    {l.priceKss} KSS
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {listingNft && (
        <ListNftModal
          nft={listingNft}
          onClose={() => setListingNft(null)}
          onListed={(assetId, category: NftCategoryId) => {
            // Persist the front-end-only category mapping on successful listing.
            setCategory(assetId, category);
          }}
        />
      )}
    </div>
  );
}
