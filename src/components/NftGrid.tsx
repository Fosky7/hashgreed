import React from 'react';
import NFTCard from './NFTCard';

interface NFT {
  id: string;
  imageUrl: string;
  name: string;
  creator: string;
  price: string;
}

interface NftGridProps {
  nfts: NFT[];
}

const NftGrid: React.FC<NftGridProps> = ({ nfts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {nfts.length > 0 ? (
        nfts.map((nft) => (
          <NFTCard
            key={nft.id}
            imageUrl={nft.imageUrl}
            name={nft.name}
            creator={nft.creator}
            price={nft.price}
          />
        ))
      ) : (
        <p className="col-span-full text-center text-[var(--text-secondary)]">No NFTs found.</p>
      )}
    </div>
  );
};

export default NftGrid;
