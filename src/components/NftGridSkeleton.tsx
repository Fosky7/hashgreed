import React from 'react';

interface NftGridSkeletonProps {
  /** Number of skeleton cards to render. Defaults to 8. */
  count?: number;
}

/**
 * NftGridSkeleton
 * Renders placeholder cards that mirror the real NftGrid layout so the
 * Explore page has a polished loading state instead of a layout shift.
 */
const NftGridSkeleton: React.FC<NftGridSkeletonProps> = ({ count = 8 }) => {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading NFTs"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--card-bg)] animate-pulse"
        >
          <div className="w-full h-64 bg-[var(--hover-bg)]" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-[var(--hover-bg)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--hover-bg)]" />
            <div className="flex justify-between items-center mt-3">
              <div className="h-5 w-16 rounded bg-[var(--hover-bg)]" />
              <div className="h-7 w-24 rounded-md bg-[var(--hover-bg)]" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading NFTs, please wait…</span>
    </div>
  );
};

export default NftGridSkeleton;
