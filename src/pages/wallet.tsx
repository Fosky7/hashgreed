import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NftGrid from '../components/NftGrid';
import { allNfts } from './NFTDetail'; // Import allNfts from NFTDetail
; // Import NFT type

const WalletPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Filter allNfts to get user-owned NFTs (e.g., IDs 11-13) or by owner property 
  const userOwnedNfts: NFT[] = allNfts.filter(nft => nft.owner === '0xMine' || (parseInt(nft.id) >= 11 && parseInt(nft.id) <= 13));

  const connectWallet = async () => {
    setIsConnected(false);
    setWalletAddress(null);
    setBalance(null);
    // Simulate wallet connection
    console.log('Connecting to wallet...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const address = '0xAbCDeF1234567890aBcDeF1234567890aBcDeF1'; // Placeholder address
    const ethBalance = '5.75'; // Placeholder balance
    setIsConnected(true);
    setWalletAddress(address);
    setBalance(ethBalance);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8 text-[var(--text-primary)] text-center drop-shadow-lg">My Wallet</h2>
        <div className="max-w-2xl mx-auto p-6 rounded-lg shadow-xl bg-[var(--card-bg)] border border-[var(--border-color)] transition-all duration-300 ease-in-out text-center">
          {!isConnected ? (
            <div className="space-y-6">
              <p className="text-xl text-[var(--text-secondary)]">Connect your wallet to view your NFTs and balance.</p>
              <button
                onClick={connectWallet}
                className="px-8 py-4 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold text-lg"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xl font-semibold text-[var(--text-primary)]">Wallet Connected:</p>
              <p className="text-lg text-[var(--text-secondary)] break-words">{walletAddress}</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">Balance: {balance} ETH</p>
              <h3 className="text-3xl font-bold mt-10 mb-6 text-[var(--text-primary)] drop-shadow-lg">Your NFTs</h3>
              <NftGrid nfts={userOwnedNfts} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WalletPage;
