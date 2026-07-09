// src/components/marketplace/DelistNftButton.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelistNft } from '@/hooks/useDelistNft';

interface DelistNftButtonProps {
  assetId: string;
  /** Called after a confirmed delist so parents can refetch/close. */
  onDelisted?: (txId: string) => void;
  className?: string;
}

/**
 * "Delist" control for an NFT the connected wallet has listed. Shows an inline
 * confirm step, live status, explorer link on success, and routes the user to
 * unlock when the wallet is locked. Mirrors BuyNowButton's UX conventions.
 */
const DelistNftButton: React.FC<DelistNftButtonProps> = ({
  assetId,
  onDelisted,
  className = '',
}) => {
  const navigate = useNavigate();
  const { status, error, explorerUrl, needsUnlock, delist, reset } =
    useDelistNft();
  const [confirming, setConfirming] = useState(false);

  const handleDelist = async () => {
    if (needsUnlock) {
      navigate('/connect');
      return;
    }
    const ok = await delist(assetId);
    setConfirming(false);
    if (ok && explorerUrl) {
      const txId = explorerUrl.split('/tx/')[1] ?? '';
      onDelisted?.(txId);
    }
  };

  if (status === 'success') {
    return (
      <div className={className}>
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-center">
          <p className="text-sm font-semibold text-green-700">NFT delisted</p>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline"
              style={{ color: 'var(--color-primary)' }}
            >
              View transaction ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {confirming ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-3">
          <p className="text-sm text-[var(--text-primary)]">
            Delist this NFT? It will be returned to your wallet and removed from
            sale.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleDelist}
              disabled={status === 'delisting'}
              className="rounded-lg py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              style={{ backgroundColor: '#dc2626' }}
            >
              {status === 'delisting' ? 'Delisting…' : 'Confirm Delist'}
            </button>
            <button
              onClick={() => {
                setConfirming(false);
                reset();
              }}
              disabled={status === 'delisting'}
              className="rounded-lg border border-[var(--border-color)] py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => (needsUnlock ? navigate('/connect') : setConfirming(true))}
            className="w-full rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors"
            style={{ borderColor: '#dc2626', color: '#dc2626' }}
          >
            {needsUnlock ? 'Unlock to Delist' : 'Delist NFT'}
          </button>
          {error && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default DelistNftButton;
