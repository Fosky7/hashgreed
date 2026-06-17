// src/pages/ExploreHome.tsx
import { useEffect, useState } from 'react';
import { getCategories } from '@/lib/blockchain/kross/marketplace-queries';

/**
 * Category index — links to each per-category explore page.
 */
export default function ExploreHome() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Explore by Category</h1>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <a
              key={c}
              href={`/explore/${encodeURIComponent(c.toLowerCase())}`}
              className="p-6 rounded-2xl border bg-white hover:shadow-md transition text-center font-medium capitalize"
            >
              {c}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
