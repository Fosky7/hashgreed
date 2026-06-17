// src/pages/CategoryExplore.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getListingsByCategory,
  Listing,
} from '@/lib/blockchain/kross/marketplace-queries';
import { ListingCard } from '@/components/marketplace/ListingCard';

/**
 * Per-category explore page. Route: /explore/:category
 */
export default function CategoryExplore() {
  const { category = '' } = useParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getListingsByCategory(category)
      .then((data) => active && setListings(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold capitalize mb-1">{category}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {listings.length} item{listings.length !== 1 ? 's' : ''} listed in KSS
      </p>

      {loading && <p className="text-sm text-gray-400">Loading listings…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && listings.length === 0 && (
        <p className="text-sm text-gray-400">
          No NFTs listed in this category yet.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {listings.map((l) => (
          <ListingCard key={l.assetId} listing={l} />
        ))}
      </div>
    </div>
  );
}
