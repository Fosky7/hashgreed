// src/components/NFTCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import BuyNowButton from './marketplace/BuyNowButton';
import { parsePriceAmount } from '../lib/nftDisplay';

interface NFTCardProps {
  id: string;
  imageUrl: string;
  name: string;
  creator: string;
  price: string;
  /** When true, this card represents a live, buyable listing. */
  listed?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({
  id,
  imageUrl,
  name,
  creator,
  price,
  listed = true,
}) => {
  // Derive a numeric KSS price from the display string for the buy payment.
  const priceKss = parsePriceAmount(price);

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out bg-[var(--card-bg)] transform hover:-translate-y-1 hover:scale-105 duration-300 ease-in-out">
      <Link to={`/nft/${id}`} className="block">
        <img src={imageUrl} alt={name} className="w-full h-64 object-cover" />
      </Link>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 text-[var(--text-primary)]">
          {name}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">By {creator}</p>

        <div className="flex justify-between items-center mt-3">
          <p className="text-lg font-bold text-[var(--color-primary)]">
            {price}
          </p>
          <Link to={`/nft/${id}`}>
            <button className="px-3 py-1 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out text-sm shadow-md">
              View Details
            </button>
          </Link>
        </div>

        {/* Buy Now — invokes the marketplace buyNFT call with KSS payment. */}
        {listed && priceKss > 0 && (
          <BuyNowButton
            assetId={id}
            priceKss={priceKss}
            className="mt-3"
          />
        )}
      </div>
    </div>
  );
};

export default NFTCard;
