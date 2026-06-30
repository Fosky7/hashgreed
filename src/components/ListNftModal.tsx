import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { useListNft } from '@/hooks/useListNft';

interface ListNftModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
}

export default function ListNftModal({ isOpen, onClose, assetId }: ListNftModalProps) {
  const { balance, refresh } = useKrossWallet();
  const { unlocked } = useKrossSession();
  const {
    execute,
    status,
    error,
    txUrl,
  } = useListNft();

  const [priceKss, setPriceKss] = useState('');
  const [royaltyPercent, setRoyaltyPercent] = useState('5');

  // Fee constant – fallback to 0.01 KSS if not defined
  const fee = (KROSS_CONFIG.fees as any).listNft ?? 0.01;
  const priceNum = parseFloat(priceKss) || 0;
  const royaltyNum = parseFloat(royaltyPercent);
  const insufficient = fee > balance;
  const priceValid = priceNum > 0;
  const royaltyValid = !isNaN(royaltyNum) && royaltyNum >= 0 && royaltyNum <= 50;

  const canSubmit =
    unlocked &&
    assetId.length > 0 &&
    priceValid &&
    royaltyValid &&
    !insufficient &&
    status !== 'listing' &&
    status !== 'confirming';

  const handleSubmit = () => {
    if (!canSubmit) return;
    execute({ assetId, priceKss: priceNum, royaltyPercent: royaltyNum });
  };

  const handleClose = () => {
    if (status === 'done') {
      refresh();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        {status === 'done' ? (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-green-600">NFT Listed!</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Your NFT is now available on the marketplace.
            </p>
            {txUrl && (
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm underline"
                style={{ color: 'var(--color-primary)' }}
              >
                View Transaction
              </a>
            )}
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-white font-semibold"
              style={{ backgroundColor: 'var(--button-primary-bg)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">List NFT for Sale</h2>
              <button
                onClick={handleClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Asset ID
                </label>
                <input
                  value={assetId}
                  disabled
                  className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-secondary)] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Price (KSS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={priceKss}
                  onChange={(e) => setPriceKss(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                {priceKss !== '' && !priceValid && (
                  <p className="text-xs text-red-600 mt-1">Price must be greater than 0.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Royalty (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={royaltyPercent}
                  onChange={(e) => setRoyaltyPercent(e.target.value)}
                  placeholder="5"
                  className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                {!royaltyValid && (
                  <p className="text-xs text-red-600 mt-1">Royalty must be 0–50%.</p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--hover-bg)] p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Network Fee</span>
                  <span className={insufficient ? 'text-red-600' : ''}>
                    {fee} KSS
                  </span>
                </div>
                {insufficient && (
                  <p className="text-xs text-red-600">Insufficient balance for the fee.</p>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!unlocked && (
                <p className="text-sm text-red-600">Wallet is locked. Unlock to list.</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--button-primary-bg)' }}
              >
                {status === 'listing'
                  ? 'Signing...'
                  : status === 'confirming'
                  ? 'Confirming...'
                  : 'List NFT'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
