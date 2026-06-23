// src/components/CategoryFilterBar.tsx
import { NFT_CATEGORIES, type NftCategoryId } from "@/lib/blockchain/kross/categories";

export type CategoryFilter = NftCategoryId | "all";

interface Props {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  /** Optional per-category counts to display as badges. */
  counts?: Record<string, number>;
  /** Total across all categories (for the "All" pill). */
  totalCount?: number;
}

export default function CategoryFilterBar({
  value,
  onChange,
  counts,
  totalCount,
}: Props) {
  const pill = (active: boolean) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
      active
        ? "border-indigo-500/60 bg-indigo-500/15 text-white"
        : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80"
    }`;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={pill(value === "all")}
      >
        <span>All</span>
        {typeof totalCount === "number" && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
            {totalCount}
          </span>
        )}
      </button>

      {NFT_CATEGORIES.map((c) => {
        const active = value === c.id;
        const count = counts?.[c.id];
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={pill(active)}
          >
            <span className="text-sm leading-none">{c.emoji}</span>
            <span>{c.label}</span>
            {typeof count === "number" && (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
