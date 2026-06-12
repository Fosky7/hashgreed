import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NftGrid from '../components/NftGrid';
import { allNfts } from './NFTDetail';
import { categories } from '../data/categories';

type SortOption = 'recent' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 8;

const parsePrice = (price: string): number => parseFloat(price) || 0;

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);

  const category = categories.find((c) => c.id === id);

  const categoryNfts = useMemo(() => {
    if (!category) return [];
    return allNfts.filter((nft) => category.nftIds.includes(nft.id));
  }, [category]);

  const filteredSorted = useMemo(() => {
    let list = categoryNfts.filter((nft) =>
      nft.name.toLowerCase().includes(search.toLowerCase()) ||
      nft.creator.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === 'price-asc') list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sort === 'price-desc') list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    return list;
  }, [categoryNfts, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Category not found</h2>
          <p className="text-[var(--text-secondary)] mb-8">The category you are looking for does not exist.</p>
          <Link to="/explore">
            <button className="px-6 py-3 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold">
              Back to Explore
            </button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold text-sm"
          aria-label="Go back"
        >
          &larr; Back
        </button>

        {/* Banner */}
        <section className="relative rounded-2xl overflow-hidden shadow-xl border border-[var(--border-color)] mb-8">
          <img
            src={category.bannerUrl}
            alt={`${category.name} banner`}
            className="w-full h-48 md:h-64 lg:h-72 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">{category.name}</h1>
            <p className="text-white/80 mt-1 text-sm md:text-base">Curated by {category.curator}</p>
          </div>
        </section>

        {/* Description */}
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-3xl mb-8">{category.description}</p>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10" aria-label="Category statistics">
          {[
            { label: 'Volume', value: category.stats.volume },
            { label: 'Floor Price', value: category.stats.floorPrice },
            { label: 'Owners', value: category.stats.owners },
            { label: 'Items', value: String(categoryNfts.length) },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] shadow-md text-center">
              <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-primary)] mt-1">{stat.value}</p>
            </div>
          ))}
        </section>

        {/* Filter / Sort controls */}
        <section className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search items in this category..."
            aria-label="Search items"
            className="w-full sm:w-80 p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-[var(--text-secondary)]">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
              className="p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
            >
              <option value="recent">Recently Added</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </section>

        {/* Grid */}
        <NftGrid nfts={pageItems} />

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-2 mt-10" aria-label="Pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                className={`px-4 py-2 rounded-md border border-[var(--border-color)] transition-colors duration-300 ${
                  p === currentPage
                    ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
                    : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300"
            >
              Next
            </button>
          </nav>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryDetail;
