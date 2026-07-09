// src/pages/NFTDetail.tsx
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import BuyNowButton from '@/components/marketplace/BuyNowButton';
import OwnerListingActions from '@/components/marketplace/OwnerListingActions';
import { parsePriceAmount } from '@/lib/nftDisplay';
import { allNfts } from '@/data/mockNfts';
import type { NFT } from '@/types/nft';

function shortAddress(value?: string): string {
  if (!value) return 'Unknown';
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export default function NFTDetail() {
  const params = useParams();
  const id = params.assetId || params.id || '';
  const nft = allNfts.find((item) => item.id === id) || allNfts[0];
  const priceKss = parsePriceAmount(nft.price);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <BackButton to="/marketplace" label="Back to Marketplace" />

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <section className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl">
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="aspect-square w-full object-cover"
            />
          </section>

          <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-xl sm:p-8">
            {nft.category && (
              <span className="inline-flex rounded-full bg-[var(--hover-bg)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                {nft.category}
              </span>
            )}

            <h1 className="mt-4 text-3xl font-black sm:text-4xl">
              {nft.name}
            </h1>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Created by{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {nft.creator}
              </span>
            </p>

            <p className="mt-6 leading-7 text-[var(--text-secondary)]">
              {nft.description || 'No description provided for this NFT.'}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                  Price
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--color-primary)]">
                  {nft.price}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                  Owner
                </p>
                <p className="mt-2 font-mono text-sm font-semibold">
                  {shortAddress(nft.owner)}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {priceKss > 0 && (
                <BuyNowButton assetId={nft.id} priceKss={priceKss} fullWidth />
              )}

              <OwnerListingActions
                assetId={nft.id}
                sellerAddress={nft.owner}
                isListed={priceKss > 0}
              />

              <Link
                to="/marketplace"
                className="block rounded-2xl border border-[var(--border-color)] px-4 py-3 text-center text-sm font-bold text-[var(--text-secondary)] transition hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
              >
                Browse more NFTs
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                Asset ID
              </p>
              <p className="mt-2 break-all font-mono text-xs text-[var(--text-secondary)]">
                {nft.id}
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
