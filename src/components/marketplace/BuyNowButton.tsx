// src/components/marketplace/BuyNowButton.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { getKssBalance } from '@/lib/blockchain/kross/queries';
import { getListing, type Listing } from '@/lib/blockchain/kross/marketplace-listings';
import { purchaseListedNft } from '@/lib/blockchain/kross/purchaseNft';
import DEPLOYED_CONFIG from '@/lib/blockchain/kross/deployed.config';

interface BuyNowButtonProps {
  assetId: string;
  priceKss?: number;
  priceKSS?: number;
  listing?: Listing | null;
  seller?: string | null;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
  onPurchased?: (txId: string) => void;
  onSuccess?: (txId: string) => void;
}

type ToastKind = 'success' | 'error' | 'info';

interface ToastState {
  kind: ToastKind;
  message: string;
  txUrl?: string;
}

const KSS_SYMBOL = DEPLOYED_CONFIG.nativeCoin.symbol;
const INVOKE_FEE_KSS = 0.005;

function formatKss(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
  });
}

function truncateAddress(value?: string | null): string {
  if (!value) return 'Unknown';
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function listingPriceKss(listing?: Listing | null, fallback?: number): number {
  if (listing?.priceWavelets) return listing.priceWavelets / 1e8;
  if (typeof listing?.priceKSS === 'number') return listing.priceKSS;
  return fallback ?? 0;
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const color =
    toast.kind === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-50'
      : toast.kind === 'error'
        ? 'border-rose-500/30 bg-rose-500/15 text-rose-50'
        : 'border-indigo-500/30 bg-indigo-500/15 text-indigo-50';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-[100] w-[min(92vw,26rem)] rounded-2xl border p-4 shadow-2xl backdrop-blur ${color}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {toast.kind === 'success'
              ? 'Purchase complete'
              : toast.kind === 'error'
                ? 'Purchase failed'
                : 'Kross wallet'}
          </p>
          <p className="mt-1 text-sm opacity-85">{toast.message}</p>
          {toast.txUrl && (
            <a
              href={toast.txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-bold underline underline-offset-4"
            >
              View transaction
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-sm opacity-70 transition hover:bg-white/10 hover:opacity-100"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function BuyNowButton({
  assetId,
  priceKss,
  priceKSS,
  listing,
  seller,
  className = '',
  disabled = false,
  children,
  fullWidth = true,
  onPurchased,
  onSuccess,
}: BuyNowButtonProps) {
  const navigate = useNavigate();
  const wallet = useKrossWallet();
  const { unlocked } = useKrossSession();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resolvedListing, setResolvedListing] = useState<Listing | null>(listing ?? null);
  const [checking, setChecking] = useState(false);
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fallbackPrice = priceKSS ?? priceKss;
  const displayPrice = listingPriceKss(resolvedListing ?? listing, fallbackPrice);
  const sellerAddress = resolvedListing?.seller ?? listing?.seller ?? seller ?? null;

  const isOwnListing = useMemo(() => {
    if (!wallet.address || !sellerAddress) return false;
    return wallet.address.toLowerCase() === sellerAddress.toLowerCase();
  }, [wallet.address, sellerAddress]);

  const busy = checking || buying;
  const isDisabled = disabled || busy || isOwnListing;

  const closeToastSoon = () => {
    window.setTimeout(() => setToast(null), 6000);
  };

  const showToast = (next: ToastState) => {
    setToast(next);
    closeToastSoon();
  };

  const prepareConfirmation = async () => {
    if (!assetId) {
      showToast({ kind: 'error', message: 'Missing NFT asset ID.' });
      return;
    }

    if (!wallet.address) {
      showToast({
        kind: 'info',
        message: 'Connect or create a Kross wallet before buying this NFT.',
      });
      navigate('/wallet/onboarding');
      return;
    }

    if (!unlocked) {
      showToast({
        kind: 'info',
        message: 'Unlock your Kross wallet before buying this NFT.',
      });
      navigate('/wallet');
      return;
    }

    setChecking(true);

    try {
      const latestListing = listing ?? (await getListing(assetId));
      if (!latestListing) {
        showToast({
          kind: 'error',
          message: 'This NFT is no longer listed for sale.',
        });
        return;
      }

      if (latestListing.seller?.toLowerCase() === wallet.address.toLowerCase()) {
        showToast({
          kind: 'info',
          message: 'You already own this listing, so you cannot buy it from yourself.',
        });
        setResolvedListing(latestListing);
        return;
      }

      const latestPriceKss = latestListing.priceWavelets / 1e8;
      const requiredKss = latestPriceKss + INVOKE_FEE_KSS;
      const balanceKss = await getKssBalance(wallet.address);

      if (balanceKss < requiredKss) {
        showToast({
          kind: 'error',
          message: `Insufficient ${KSS_SYMBOL}. You need at least ${formatKss(
            requiredKss,
          )} ${KSS_SYMBOL} including the ${formatKss(INVOKE_FEE_KSS)} ${KSS_SYMBOL} network fee. Current balance: ${formatKss(
            balanceKss,
          )} ${KSS_SYMBOL}.`,
        });
        setResolvedListing(latestListing);
        return;
      }

      setResolvedListing(latestListing);
      setConfirmOpen(true);
    } catch (error) {
      showToast({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to prepare purchase.',
      });
    } finally {
      setChecking(false);
    }
  };

  const confirmPurchase = async () => {
    if (!resolvedListing) {
      showToast({
        kind: 'error',
        message: 'Listing details are unavailable. Please refresh and try again.',
      });
      return;
    }

    setBuying(true);

    try {
      const result = await purchaseListedNft(assetId, resolvedListing);

      await wallet.refresh();
      setConfirmOpen(false);

      showToast({
        kind: 'success',
        message: `You bought this NFT for ${formatKss(
          result.listing.priceWavelets / 1e8,
        )} ${KSS_SYMBOL}.`,
        txUrl: result.explorerUrl,
      });

      onPurchased?.(result.id);
      onSuccess?.(result.id);
    } catch (error) {
      showToast({
        kind: 'error',
        message: error instanceof Error ? error.message : 'NFT purchase failed.',
      });
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <button
        type="button"
        disabled={isDisabled}
        onClick={prepareConfirmation}
        className={[
          fullWidth ? 'w-full' : '',
          'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition',
          'bg-[var(--button-primary-bg,#4f46e5)] text-[var(--button-primary-text,#fff)] hover:bg-[var(--button-primary-hover-bg,#4338ca)]',
          'disabled:cursor-not-allowed disabled:opacity-55',
          className,
        ].join(' ')}
      >
        {checking
          ? 'Checking balance…'
          : buying
            ? 'Buying…'
            : isOwnListing
              ? 'Your listing'
              : children ?? `Buy NFT${displayPrice > 0 ? ` · ${formatKss(displayPrice)} ${KSS_SYMBOL}` : ''}`}
      </button>

      {confirmOpen && resolvedListing && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy-nft-confirm-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1020] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200/70">
                  Confirm Kross purchase
                </p>
                <h2 id="buy-nft-confirm-title" className="mt-2 text-2xl font-black">
                  Buy this NFT?
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={buying}
                className="rounded-full px-2 py-1 text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Close confirmation"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/55">NFT price</span>
                <span className="font-black">
                  {formatKss(resolvedListing.priceWavelets / 1e8)} {KSS_SYMBOL}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/55">Estimated network fee</span>
                <span className="font-black">
                  {formatKss(INVOKE_FEE_KSS)} {KSS_SYMBOL}
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-white/70">Required balance</span>
                <span className="font-black text-indigo-200">
                  {formatKss(resolvedListing.priceWavelets / 1e8 + INVOKE_FEE_KSS)} {KSS_SYMBOL}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-white/50">
              <p>
                Seller:{' '}
                <span className="font-mono text-white/75">
                  {truncateAddress(resolvedListing.seller)}
                </span>
              </p>
              <p>
                Asset:{' '}
                <span className="font-mono text-white/75">
                  {truncateAddress(assetId)}
                </span>
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={buying}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmPurchase}
                disabled={buying}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {buying ? 'Confirming on Kross…' : `Confirm Buy`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
