// src/pages/NftDetailPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import DEPLOYED_CONFIG from '@/lib/blockchain/kross/deployed.config';
import {
  buyListedNft,
  fetchNftDetail,
  formatKSS,
  truncateKrossAddress,
  type NftAttribute,
  type NftDetail,
} from '@/lib/blockchain/kross/nft-detail';

type LoadStatus = 'loading' | 'ready' | 'error';
type BuyStatus = 'idle' | 'buying' | 'success' | 'error';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="55%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" fill="#080A14"/>
      <circle cx="220" cy="180" r="280" fill="#6366f1" opacity="0.28"/>
      <circle cx="760" cy="250" r="240" fill="#ec4899" opacity="0.18"/>
      <circle cx="480" cy="760" r="300" fill="#06b6d4" opacity="0.14"/>
      <rect x="185" y="185" width="530" height="530" rx="72" fill="url(#g)" opacity="0.18" stroke="white" stroke-opacity="0.22" stroke-width="3"/>
      <text x="450" y="425" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="800">Kross NFT</text>
      <text x="450" y="485" text-anchor="middle" fill="white" fill-opacity="0.6" font-family="Arial, sans-serif" font-size="22">Metadata preview</text>
    </svg>
  `);

function nativeSymbol(): string {
  return DEPLOYED_CONFIG.nativeCoin.symbol;
}

function copyToClipboard(value: string) {
  if (!value) return;
  void navigator.clipboard.writeText(value);
}

function AttributeCard({ attribute }: { attribute: NftAttribute }) {
  const label =
    attribute.trait_type ||
    attribute.type ||
    attribute.key ||
    attribute.name ||
    'Attribute';

  const value =
    attribute.value === null || typeof attribute.value === 'undefined'
      ? '—'
      : String(attribute.value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-indigo-200/65">
        {String(label)}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function MetadataRow({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 block break-all text-sm font-bold text-indigo-200 transition hover:text-indigo-100 ${
            mono ? 'font-mono' : ''
          }`}
        >
          {value}
        </a>
      ) : (
        <p
          className={`mt-2 break-all text-sm font-bold text-white/78 ${
            mono ? 'font-mono' : ''
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function LoadingView() {
  return (
    <main className="min-h-screen bg-[#080A14] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <BackButton to="/explore" label="Back to Explore" className="mb-8 text-white/55 hover:text-white" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="aspect-square animate-pulse rounded-[2.5rem] bg-white/[0.06]" />
          <div className="space-y-4">
            <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-white/[0.06]" />
            <div className="h-24 animate-pulse rounded-2xl bg-white/[0.06]" />
            <div className="h-44 animate-pulse rounded-[2rem] bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function NftDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const assetId = params.assetId || params.id || '';

  const { address, isConnected } = useKrossWallet();
  const { unlocked } = useKrossSession();

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [detail, setDetail] = useState<NftDetail | null>(null);
  const [error, setError] = useState('');

  const [buyStatus, setBuyStatus] = useState<BuyStatus>('idle');
  const [buyError, setBuyError] = useState('');
  const [buyTxUrl, setBuyTxUrl] = useState('');

  const loadDetail = useCallback(async () => {
    if (!assetId) {
      setStatus('error');
      setError('Missing NFT asset ID.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const nextDetail = await fetchNftDetail(assetId);
      setDetail(nextDetail);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NFT details.');
      setStatus('error');
    }
  }, [assetId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const attributes = useMemo(() => {
    if (!detail?.metadata?.attributes || !Array.isArray(detail.metadata.attributes)) return [];
    return detail.metadata.attributes;
  }, [detail]);

  const isOwner = useMemo(() => {
    if (!address || !detail?.owner) return false;
    return address.toLowerCase() === detail.owner.toLowerCase();
  }, [address, detail?.owner]);

  const handleBuy = async () => {
    if (!detail) return;

    if (!isConnected || !address) {
      navigate('/wallet/onboarding');
      return;
    }

    if (!unlocked) {
      setBuyStatus('error');
      setBuyError('Unlock your Kross wallet before buying this NFT.');
      return;
    }

    setBuyStatus('buying');
    setBuyError('');
    setBuyTxUrl('');

    try {
      const result = await buyListedNft(detail.assetId);
      setBuyTxUrl(result.explorerUrl);
      setBuyStatus('success');
      await loadDetail();
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Purchase failed.');
      setBuyStatus('error');
    }
  };

  if (status === 'loading') return <LoadingView />;

  if (status === 'error' || !detail) {
    return (
      <main className="min-h-screen bg-[#080A14] px-4 py-8 text-white">
        <div className="mx-auto max-w-xl">
          <BackButton to="/explore" label="Back to Explore" className="mb-8 text-white/55 hover:text-white" />
          <section className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-7 text-center shadow-2xl shadow-black/25">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-400/15 text-3xl">
              ⚠️
            </div>
            <h1 className="text-3xl font-black">NFT not found</h1>
            <p className="mt-3 text-sm leading-6 text-rose-100/75">
              {error || 'We could not load this Kross NFT.'}
            </p>
            <button
              type="button"
              onClick={() => void loadDetail()}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90"
            >
              Try Again
            </button>
          </section>
        </div>
      </main>
    );
  }

  const symbol = nativeSymbol();

  return (
    <main className="min-h-screen overflow-hidden bg-[#080A14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-24%] top-[-20%] h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-[-20%] top-[5%] h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/14 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[25%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BackButton to="/explore" label="Back to Explore" className="text-white/55 hover:text-white" />
          <a
            href={detail.explorerAssetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-black text-white/62 transition hover:bg-white/[0.08] hover:text-white"
          >
            View on Kross Explorer
          </a>
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
              <div className="relative aspect-square bg-black/30">
                <img
                  src={detail.imageUrl || FALLBACK_IMAGE}
                  alt={detail.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                {detail.listed && (
                  <div className="absolute left-5 top-5 rounded-full border border-emerald-300/25 bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-100 backdrop-blur">
                    Listed for sale
                  </div>
                )}

                {detail.isCustodiedByMarketplace && (
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-xs font-semibold text-white/68 backdrop-blur">
                    This NFT is held in marketplace escrow while listed. The seller remains{' '}
                    <span className="font-mono text-white">{truncateKrossAddress(detail.owner)}</span>.
                  </div>
                )}
              </div>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/15 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-200/60">
                    Metadata
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Properties</h2>
                </div>
                {detail.metadataUrl && (
                  <a
                    href={detail.metadataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-black text-white/60 transition hover:bg-white/5 hover:text-white"
                  >
                    Metadata JSON
                  </a>
                )}
              </div>

              {attributes.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attributes.map((attribute, index) => (
                    <AttributeCard key={`${attribute.trait_type ?? attribute.key ?? index}`} attribute={attribute} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    ✦
                  </div>
                  <p className="font-black">No attributes provided</p>
                  <p className="mt-1 text-sm text-white/45">
                    This NFT does not include trait metadata.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/15 sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200/60">
                Activity
              </p>
              <h2 className="mt-2 text-2xl font-black">Recent history</h2>

              {detail.history.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {detail.history.map((tx) => (
                    <a
                      key={tx.id}
                      href={`${DEPLOYED_CONFIG.explorerUrl}/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black text-white">
                            {tx.functionName || (tx.type === 4 ? 'Transfer' : tx.type === 3 ? 'Issue' : `Tx type ${tx.type}`)}
                          </p>
                          <p className="mt-1 truncate font-mono text-xs text-white/35">{tx.id}</p>
                        </div>
                        <p className="shrink-0 text-xs text-white/40">
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                  <p className="font-black">No recent asset activity loaded</p>
                  <p className="mt-1 text-sm text-white/45">
                    Open the Kross Explorer for complete transaction history.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                Kross NFT
              </div>

              <h1 className="break-words text-4xl font-black tracking-tight">{detail.name}</h1>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/58">
                {detail.description}
              </p>

              <div className="mt-6 grid gap-3">
                <MetadataRow
                  label="Asset ID"
                  value={detail.assetId}
                  href={detail.explorerAssetUrl}
                  mono
                />
                <MetadataRow
                  label={detail.listed ? 'Seller' : 'Owner'}
                  value={detail.owner || 'Unknown'}
                  href={detail.owner ? detail.explorerOwnerUrl : undefined}
                  mono
                />
                <MetadataRow
                  label="Issuer"
                  value={detail.issuer || 'Unknown'}
                  href={detail.issuer ? `${DEPLOYED_CONFIG.explorerUrl}/address/${detail.issuer}` : undefined}
                  mono
                />
              </div>
            </section>

            <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200/60">
                Sale
              </p>

              {detail.listed ? (
                <>
                  <div className="mt-4 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
                    <p className="text-sm font-bold text-emerald-100/70">Current price</p>
                    <p className="mt-2 text-5xl font-black tracking-tight text-white">
                      {formatKSS(detail.priceKSS)}
                    </p>
                    <p className="mt-1 text-lg font-black text-emerald-200">{symbol}</p>
                  </div>

                  {buyStatus === 'success' && (
                    <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                      Purchase confirmed.
                      {buyTxUrl && (
                        <a
                          href={buyTxUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 font-black underline"
                        >
                          View transaction
                        </a>
                      )}
                    </div>
                  )}

                  {buyStatus === 'error' && (
                    <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
                      {buyError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={buyStatus === 'buying' || isOwner}
                    className="mt-5 w-full rounded-[1.35rem] bg-white px-6 py-4 text-base font-black text-[#080A14] shadow-2xl shadow-indigo-950/30 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isOwner
                      ? 'You own this listing'
                      : buyStatus === 'buying'
                        ? `Buying with ${symbol}…`
                        : !isConnected
                          ? 'Connect Wallet to Buy'
                          : !unlocked
                            ? 'Unlock Wallet to Buy'
                            : 'Buy NFT'}
                  </button>

                  {!isConnected && (
                    <p className="mt-3 text-center text-xs text-white/40">
                      You will be redirected to set up or unlock a Kross wallet.
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    🏷️
                  </div>
                  <p className="font-black text-white">Not listed for sale</p>
                  <p className="mt-1 text-sm leading-6 text-white/45">
                    This NFT is not currently available to buy on the Kross marketplace.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/15 sm:p-6">
              <h2 className="text-xl font-black">On-chain details</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/45">Quantity</span>
                  <span className="font-black text-white">{detail.quantity}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/45">Decimals</span>
                  <span className="font-black text-white">{detail.decimals}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/45">Reissuable</span>
                  <span className="font-black text-white">{detail.reissuable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/45">Network</span>
                  <span className="font-black text-white">Kross · Chain ID N</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(detail.assetId)}
                className="mt-5 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Copy Asset ID
              </button>
            </section>

            <Link
              to="/wallet"
              className="block rounded-[1.5rem] border border-white/10 bg-white/[0.045] px-5 py-4 text-center text-sm font-black text-white/72 transition hover:bg-white/[0.075] hover:text-white"
            >
              Open Kross Wallet
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
