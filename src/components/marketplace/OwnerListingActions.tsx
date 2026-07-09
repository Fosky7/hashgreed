// src/components/marketplace/OwnerListingActions.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import DelistNftButton from './DelistNftButton';

interface OwnerListingActionsProps {
  assetId: string;
  /** Address of the NFT's current seller/owner of the listing. */
  sellerAddress?: string | null;
  /** Whether this asset is actively listed for sale. */
  isListed: boolean;
  /** Called after a successful delist so the parent can refetch. */
  onDelisted?: (txId: string) => void;
  className?: string;
}

/**
 * Renders owner-only marketplace controls (Update Price + Delist) when the
 * currently connected wallet is the seller of an actively-listed NFT.
 * Renders nothing for non-owners or unlisted items.
 */
const OwnerListingActions: React.FC<OwnerListingActionsProps> = ({
  assetId,
  sellerAddress,
  isListed,
  onDelisted,
  className = '',
}) => {
  const { address } = useKrossWallet();

  const isOwner =
    !!address &&
    !!sellerAddress &&
    address.toLowerCase() === sellerAddress.toLowerCase();

  if (!isOwner || !isListed) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Manage your listing
      </p>

      <Link
        to={`/marketplace/update-price/${assetId}`}
        className="block w-full px-4 py-2.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] font-semibold text-center hover:bg-[var(--button-primary-hover-bg)] transition-colors"
      >
        Update Price
      </Link>

      <DelistNftButton assetId={assetId} onDelisted={onDelisted} />
    </div>
  );
};

export default OwnerListingActions;
