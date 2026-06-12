
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { NFT } from '../types/nft';

import nftImage1 from '../assets/placeholder-nft-1.png';
import nftImage2 from '../assets/placeholder-nft-2.png';
import nftImage3 from '../assets/placeholder-nft-3.png';
import nftImage4 from '../assets/placeholder-nft-4.png';
import exploreNft1 from '../assets/explore-nft-1.png';
import exploreNft2 from '../assets/explore-nft-2.png';
import exploreNft3 from '../assets/explore-nft-3.png';
import exploreNft4 from '../assets/explore-nft-4.png';
import exploreNft5 from '../assets/explore-nft-5.png';
import exploreNft6 from '../assets/explore-nft-6.png';
import walletNft1 from '../assets/wallet-nft-1.png';
import walletNft2 from '../assets/wallet-nft-2.png';
import walletNft3 from '../assets/wallet-nft-3.png';

const allNfts: NFT[] = [
  {
    id: '1',
    imageUrl: nftImage1,
    name: 'Abstract Digital Art',
    creator: '0xArtist1',
    price: '0.5 ETH',
    description: 'A vibrant and unique piece of abstract digital art, capturing the essence of modern creativity.',
    owner: '0xCollectorA',
  },
  {
    id: '2',
    imageUrl: nftImage2,
    name: 'Cyberpunk Cityscape',
    creator: '0xArtist2',
    price: '1.2 ETH',
    description: 'An futuristic cityscape bathed in neon lights, depicting a dystopian yet beautiful world.',
    owner: '0xCollectorB',
  },
  {
    id: '3',
    imageUrl: nftImage3,
    name: 'Mystical Forest',
    creator: '0xArtist3',
    price: '0.8 ETH',
    description: 'A serene and magical forest scene, filled with ancient trees and glowing flora.',
    owner: '0xCollectorC',
  },
  {
    id: '4',
    imageUrl: nftImage4,
    name: 'Geometric Abstraction',
    creator: '0xArtist1',
    price: '0.6 ETH',
    description: 'Complex and harmonious geometric patterns forming a captivating visual experience.',
    owner: '0xCollectorA',
  },
  {
    id: '5',
    imageUrl: exploreNft1,
    name: 'Neo Genesis Collection',
    creator: '0xExplorer1',
    price: '0.7 ETH',
    description: 'The inaugural piece from the Neo Genesis Collection, symbolizing new beginnings in the digital realm.',
    owner: '0xCollectorD',
  },
  {
    id: '6',
    imageUrl: exploreNft2,
    name: 'Digital Dreamscape',
    creator: '0xExplorer2',
    price: '2.1 ETH',
    description: 'A surreal landscape where imagination meets technology, creating a boundless digital dream.',
    owner: '0xCollectorE',
  },
  {
    id: '7',
    imageUrl: exploreNft3,
    name: 'Abstract Forms XV',
    creator: '0xExplorer3',
    price: '0.9 ETH',
    description: 'Part of a renowned series, this piece explores the interplay of color, shape, and emotion.',
    owner: '0xCollectorF',
  },
  {
    id: '8',
    imageUrl: exploreNft4,
    name: 'Pixel Realms',
    creator: '0xExplorer1',
    price: '0.45 ETH',
    description: 'A nostalgic journey into the low-resolution worlds of early digital art, reimagined for today.',
    owner: '0xCollectorD',
  },
  {
    id: '9',
    imageUrl: exploreNft5,
    name: 'Cosmic Journeys',
    creator: '0xExplorer4',
    price: '1.5 ETH',
    description: 'An expansive depiction of interstellar travel and cosmic wonders, a true spectacle.',
    owner: '0xCollectorG',
  },
  {
    id: '10',
    imageUrl: exploreNft6,
    name: 'The Glitch Garden',
    creator: '0xExplorer5',
    price: '0.6 ETH',
    description: 'A unique blend of natural beauty distorted by digital glitches, creating a new form of digital flora.',
    owner: '0xCollectorH',
  },
   {
    id: '11',
    imageUrl: walletNft1,
    name: 'My Rare Collectible',
    creator: '0xMine',
    price: '3.0 ETH',
    description: 'A highly sought-after collectible, part of a limited edition series from a renowned artist.',
    owner: '0xMine',
  },
  {
    id: '12',
    imageUrl: walletNft2,
    name: 'Exclusive Hashgreed Pass',
    creator: 'Hashgreed Official',
    price: '0.1 ETH',
    description: 'Grants access to exclusive features and events within the Hashgreed ecosystem.',
    owner: '0xMine',
  },
  {
    id: '13',
    imageUrl: walletNft3,
    name: 'Digital Persona A',
    creator: '0xMine',
    price: '0.95 ETH',
    description: 'A unique digital identity created for the metaverse, embodying individuality and style.',
    owner: '0xMine',
  },
];

export { allNfts }; // Export allNfts for use in other pages

interface BidEntry {
  bidder: string;
  amount: string;
  time: string;
}

interface Trait {
  type: string;
  value: string;
  rarity: string;
}

// Deterministic mock bid history / traits keyed by NFT id so each NFT feels unique.
const getBidHistory = (nft: NFT): BidEntry[] => {
  const base = parseFloat(nft.price) || 0.5;
  return [
    { bidder: '0x7a3F…b21C', amount: `${(base * 0.96).toFixed(2)} ETH`, time: '2 hours ago' },
    { bidder: '0x14De…9F0A', amount: `${(base * 0.91).toFixed(2)} ETH`, time: '8 hours ago' },
    { bidder: '0xC2b8…44E1', amount: `${(base * 0.84).toFixed(2)} ETH`, time: '1 day ago' },
  ];
};

const getTraits = (nft: NFT): Trait[] => [
  { type: 'Style', value: nft.name.split(' ')[0] || 'Abstract', rarity: '12% have this' },
  { type: 'Background', value: 'Gradient Aura', rarity: '24% have this' },
  { type: 'Rarity Tier', value: 'Legendary', rarity: '3% have this' },
  { type: 'Edition', value: '1 of 1', rarity: 'Unique' },
];

const NFTDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = React.useState(true);
  const [nft, setNft] = React.useState<NFT | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [bidAmount, setBidAmount] = React.useState('');
  const [bids, setBids] = React.useState<BidEntry[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    setActionMessage(null);
    // Simulate a fetch from a marketplace API.
    const timer = setTimeout(() => {
      const found = allNfts.find((n) => n.id === id) || null;
      setNft(found);
      setBids(found ? getBidHistory(found) : []);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  const handleBuyNow = async () => {
    if (!nft) return;
    setIsProcessing(true);
    setActionMessage(null);
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessing(false);
    setActionMessage(`Purchase confirmed! You now own "${nft.name}" for ${nft.price}.`);
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nft) return;
    const amount = parseFloat(bidAmount);
    const minBid = parseFloat(nft.price) || 0;
    if (!amount || amount <= 0) {
      setActionMessage('Please enter a valid bid amount.');
      return;
    }
    if (amount < minBid) {
      setActionMessage(`Your bid must be at least ${nft.price}.`);
      return;
    }
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 900));
    setBids((prev) => [
      { bidder: '0xYou…0001', amount: `${amount.toFixed(2)} ETH`, time: 'just now' },
      ...prev,
    ]);
    setBidAmount('');
    setIsProcessing(false);
    setActionMessage(`Your bid of ${amount.toFixed(2)} ETH was placed successfully!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold text-sm"
          aria-label="Go back to previous page"
        >
          &larr; Back
        </button>

        {isLoading ? (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse" aria-busy="true" aria-label="Loading NFT details">
            <div className="w-full aspect-square rounded-lg bg-[var(--border-color)] opacity-40" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 rounded bg-[var(--border-color)] opacity-40" />
              <div className="h-6 w-1/2 rounded bg-[var(--border-color)] opacity-40" />
              <div className="h-24 w-full rounded bg-[var(--border-color)] opacity-40" />
              <div className="h-12 w-full rounded bg-[var(--border-color)] opacity-40" />
            </div>
          </div>
        ) : !nft ? (
          <div className="max-w-xl mx-auto text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl p-10">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">NFT Not Found</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              We couldn&apos;t find an NFT with ID &ldquo;{id}&rdquo;. It may have been removed or never existed.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-3 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Preview */}
              <div>
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden">
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Traits / Attributes */}
                <section aria-labelledby="traits-heading" className="mt-6 bg-[var(--card-bg)] rounded-2xl shadow-md border border-[var(--border-color)] p-5">
                  <h3 id="traits-heading" className="text-lg font-bold text-[var(--text-primary)] mb-4">Traits &amp; Attributes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {getTraits(nft).map((trait) => (
                      <div
                        key={trait.type}
                        className="rounded-xl border border-[var(--border-color)] p-3 text-center bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)]"
                      >
                        <p className="text-xs uppercase tracking-wide text-[var(--color-primary)] font-semibold">{trait.type}</p>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{trait.value}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1">{trait.rarity}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Details */}
              <div className="space-y-6 text-[var(--text-primary)]">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-sm">{nft.name}</h1>
                  <div className="mt-3 flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Creator</p>
                      <p className="font-semibold text-[var(--color-primary)]">{nft.creator}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Owner</p>
                      <p className="font-semibold text-[var(--color-primary)]">{nft.owner || nft.creator}</p>
                    </div>
                  </div>
                </div>

                {/* Price card */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-md">
                  <p className="text-sm text-[var(--text-secondary)]">Current Price</p>
                  <p className="text-3xl font-extrabold text-[var(--color-primary)] mt-1">{nft.price}</p>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleBuyNow}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing…' : 'Buy Now'}
                    </button>
                  </div>

                  <form onSubmit={handlePlaceBid} className="mt-4 flex flex-col sm:flex-row gap-3">
                    <label htmlFor="bidAmount" className="sr-only">Bid amount in ETH</label>
                    <input
                      id="bidAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Min ${nft.price}`}
                      className="flex-1 p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="py-3 px-6 rounded-md bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Place Bid
                    </button>
                  </form>

                  {actionMessage && (
                    <p className="mt-3 text-sm font-medium text-[var(--color-primary)]" role="status">{actionMessage}</p>
                  )}
                </div>

                {/* Description */}
                <section aria-labelledby="desc-heading">
                  <h3 id="desc-heading" className="text-lg font-bold mb-2">Description</h3>
                  <p className="text-md leading-relaxed text-[var(--text-secondary)]">
                    {nft.description || 'No description provided for this NFT.'}
                  </p>
                </section>

                {/* Bid history */}
                <section aria-labelledby="bids-heading" className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-md">
                  <h3 id="bids-heading" className="text-lg font-bold mb-4">Bid History</h3>
                  <ul className="divide-y divide-[var(--border-color)]">
                    {bids.map((bid, idx) => (
                      <li key={`${bid.bidder}-${idx}`} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{bid.bidder}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{bid.time}</p>
                        </div>
                        <p className="font-bold text-[var(--color-primary)]">{bid.amount}</p>
                      </li>
                    ))}
                    {bids.length === 0 && (
                      <li className="py-3 text-sm text-[var(--text-secondary)]">No bids yet. Be the first to bid!</li>
                    )}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NFTDetail;
