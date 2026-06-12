import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NftGrid from '../components/NftGrid';
import { allNfts } from './NFTDetail'; // Import allNfts from NFTDetail
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  // Filter allNfts to get the featured ones (e.g., first 4)
  const featuredNfts = allNfts.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24 lg:py-32 bg-transparent">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] mb-6 leading-tight drop-shadow-2xl">
            Discover, Collect, and Create <br className="hidden sm:block"/> Digital Art NFTs
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-10 max-w-3xl mx-auto leading-relaxed">
            Hashgreed is the premier marketplace for unique digital collectibles.
            Explore exclusive NFTs, mint your own creations, and connect with a vibrant community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/explore">
              <button className="px-8 py-4 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg text-lg font-semibold transform hover:-translate-y-1">
                Explore Marketplace
              </button>
            </Link>
            <Link to="/create">
              <button className="px-8 py-4 rounded-full bg-transparent border-2 border-[var(--color-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out shadow-lg text-lg font-semibold transform hover:-translate-y-1">
                Create Your NFT
              </button>
            </Link>
          </div>
        </section>

        {/* Featured NFTs Section */}
        <section className="py-12 md:py-16">
          <h2 className="text-4xl font-bold mb-8 text-[var(--text-primary)] text-center drop-shadow-lg">
            Featured NFTs
          </h2>
          <NftGrid nfts={featuredNfts} />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
