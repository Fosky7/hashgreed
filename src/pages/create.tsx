import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CreatePage: React.FC = () => {
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [nftPrice, setNftPrice] = useState('');
  const [nftFile, setNftFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!nftName || !nftDescription || !nftPrice || !nftFile) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }

    try {
      // In a real application, you would upload the file to IPFS/storage and then mint the NFT.
      // This is a placeholder for demonstration purposes.
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      console.log('Minting NFT:', { nftName, nftDescription, nftPrice, nftFile: nftFile.name });
      setSuccess('NFT has been successfully created and minted!');
      // Clear form
      setNftName('');
      setNftDescription('');
      setNftPrice('');
      setNftFile(null);
    } catch (err) {
      setError('Failed to create NFT. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--background-start)] to-[var(--background-end)] transition-colors duration-300 ease-in-out">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8 text-[var(--text-primary)] text-center drop-shadow-lg">Create New NFT</h2>
        <div className="max-w-xl mx-auto p-6 rounded-lg shadow-xl bg-[var(--card-bg)] border border-[var(--border-color)] transition-all duration-300 ease-in-out">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nftName" className="block text-sm font-medium text-[var(--text-primary)] mb-2">NFT Name</label>
              <input
                type="text"
                id="nftName"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="e.g., 'Digital Masterpiece #001'"
                className="w-full p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
                required
              />
            </div>
            <div>
              <label htmlFor="nftDescription" className="block text-sm font-medium text-[var(--text-primary)] mb-2">Description</label>
              <textarea
                id="nftDescription"
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                placeholder="Describe your NFT..."
                rows={4}
                className="w-full p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="nftPrice" className="block text-sm font-medium text-[var(--text-primary)] mb-2">Price (ETH)</label>
              <input
                type="number"
                id="nftPrice"
                value={nftPrice}
                onChange={(e) => setNftPrice(e.target.value)}
                placeholder="e.g., 0.5"
                step="0.01"
                min="0"
                className="w-full p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-300 ease-in-out"
                required
              />
            </div>
            <div>
              <label htmlFor="nftFile" className="block text-sm font-medium text-[var(--text-primary)] mb-2">Upload NFT File</label>
              <input
                type="file"
                id="nftFile"
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={(e) => setNftFile(e.target.files ? e.target.files[0] : null)}
                className="w-full p-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--button-primary-bg)] file:text-[var(--button-primary-text)] hover:file:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out cursor-pointer"
                required
              />
              {nftFile && <p className="mt-2 text-sm text-[var(--text-secondary)]">Selected file: {nftFile.name}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating NFT...' : 'Create NFT'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatePage;