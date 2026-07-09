// src/pages/CreateNft.tsx
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { UnlockGate } from '@/components/wallet/UnlockGate';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { resolveSeed } from '@/lib/blockchain/kross/resolve-seed';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { NFT_CATEGORIES, type NftCategoryId } from '@/lib/blockchain/kross/categories';

type CreateStatus = 'idle' | 'uploading' | 'minting' | 'listing' | 'success' | 'error';
type SaleMode = 'mint-only' | 'mint-and-list';

interface MintResult {
  id?: string;
  txId?: string;
  assetId?: string;
  explorerUrl?: string;
}

const PINNING_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

function getNativeSymbol(): string {
  const coin = (KROSS_CONFIG as any).nativeCoin;
  if (typeof coin === 'string') return coin;
  return coin?.symbol ?? 'KSS';
}

function getFunctionsBase(): string {
  const explicit = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;
  if (explicit) return explicit.replace(/\/$/, '');

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) return '';
  return `${url.replace(/\/$/, '')}/functions/v1`;
}

function getAnonKey(): string {
  return (
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    ''
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
  });
}

function shortAddress(address: string | null): string {
  if (!address) return 'Not connected';
  return `${address.slice(0, 7)}…${address.slice(-5)}`;
}

export default function CreateNft() {
  const { address, isConnected } = useKrossWallet();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const nativeSymbol = getNativeSymbol();

  const [saleMode, setSaleMode] = useState<SaleMode>('mint-and-list');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [category, setCategory] = useState<NftCategoryId>('art');
  const [price, setPrice] = useState('');
  const [royaltyPercent, setRoyaltyPercent] = useState('5');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [status, setStatus] = useState<CreateStatus>('idle');
  const [message, setMessage] = useState('');
  const [txUrl, setTxUrl] = useState('');
  const [assetId, setAssetId] = useState('');

  useEffect(() => {
    if (!mediaFile) {
      setLocalPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(mediaFile);
    setLocalPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [mediaFile]);

  const previewUrl = localPreviewUrl || mediaUrl.trim();
  const priceNumber = Number(price || '0');
  const royaltyNumber = Number(royaltyPercent || '0');
  const platformFeePercent = 2.5;

  const payout = useMemo(() => {
    const safePrice = Number.isFinite(priceNumber) && priceNumber > 0 ? priceNumber : 0;
    const safeRoyalty =
      Number.isFinite(royaltyNumber) && royaltyNumber > 0
        ? Math.min(royaltyNumber, 10)
        : 0;

    const platformFee = safePrice * (platformFeePercent / 100);
    const royalty = safePrice * (safeRoyalty / 100);
    const creatorReceives = Math.max(safePrice - platformFee, 0);

    return {
      platformFee,
      royalty,
      creatorReceives,
      total: safePrice,
    };
  }, [priceNumber, royaltyNumber]);

  const canSubmit =
    name.trim().length >= 2 &&
    description.trim().length >= 10 &&
    category &&
    (mediaFile || mediaUrl.trim()) &&
    (saleMode === 'mint-only' || (Number.isFinite(priceNumber) && priceNumber > 0));

  const busy = status === 'uploading' || status === 'minting' || status === 'listing';

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setMessage('Please upload an image file.');
      return;
    }

    setMediaFile(file);
    setMediaUrl('');
    setStatus('idle');
    setMessage('');
    setTxUrl('');
  };

  const pinFile = async (file: File): Promise<{ cid: string; sha256?: string }> => {
    const functionsBase = getFunctionsBase();
    const anonKey = getAnonKey();

    if (!functionsBase || !anonKey) {
      throw new Error('Supabase functions are not configured for IPFS upload.');
    }

    const form = new FormData();
    form.append('image', file);

    const response = await fetch(`${functionsBase}/kross-ipfs-upload`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: form,
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Image upload failed.');
    }

    return { cid: data.cid, sha256: data.sha256 };
  };

  const pinMetadata = async (metadata: Record<string, unknown>): Promise<{ cid: string }> => {
    const functionsBase = getFunctionsBase();
    const anonKey = getAnonKey();

    if (!functionsBase || !anonKey) {
      throw new Error('Supabase functions are not configured for metadata upload.');
    }

    const response = await fetch(`${functionsBase}/kross-pin-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(metadata),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Metadata upload failed.');
    }

    return { cid: data.cid };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit || busy) return;

    setStatus('uploading');
    setMessage('Preparing media and metadata…');
    setTxUrl('');
    setAssetId('');

    try {
      const seed = await resolveSeed();

      let imageCid = '';
      let imageUrl = mediaUrl.trim();
      let sha256 = '';

      if (mediaFile) {
        const pinned = await pinFile(mediaFile);
        imageCid = pinned.cid;
        sha256 = pinned.sha256 ?? '';
        imageUrl = `${PINNING_GATEWAY}/${pinned.cid}`;
      }

      const selectedCategory = NFT_CATEGORIES.find((item) => item.id === category);

      const metadata = {
        name: name.trim(),
        description: description.trim(),
        image: imageUrl,
        imageCid: imageCid || undefined,
        sha256: sha256 || undefined,
        external_url: externalUrl.trim() || undefined,
        chain: 'kross',
        nativeCoin: nativeSymbol,
        attributes: [
          { trait_type: 'Category', value: selectedCategory?.label ?? category },
          { trait_type: 'Royalty', value: `${Math.min(Math.max(royaltyNumber || 0, 0), 10)}%` },
          { trait_type: 'Creator', value: address ?? '' },
        ],
      };

      const pinnedMetadata = await pinMetadata(metadata);
      const metadataUrl = `${PINNING_GATEWAY}/${pinnedMetadata.cid}`;

      setStatus('minting');
      setMessage('Minting your NFT on Kross…');

      const mintModule = (await import('@/lib/blockchain/kross/mintNft')) as unknown as {
        mintNft: (params: Record<string, unknown>) => Promise<MintResult>;
      };

      const mintResult = await mintModule.mintNft({
        seed,
        password: seed,
        name: name.trim(),
        description: description.trim(),
        imageCid,
        imageUrl,
        metadataCid: pinnedMetadata.cid,
        metadataUrl,
        category,
        royaltyPercent: Math.min(Math.max(royaltyNumber || 0, 0), 10),
      });

      const mintedAssetId = mintResult.assetId || mintResult.id || '';
      const mintTxId = mintResult.txId || mintResult.id || '';
      setAssetId(mintedAssetId);

      if (saleMode === 'mint-and-list' && mintedAssetId) {
        setStatus('listing');
        setMessage('Listing your NFT for sale…');

        const listModule = (await import('@/lib/blockchain/kross/listNft')) as unknown as {
          listNft: (params: {
            assetId: string;
            priceKSS: number;
            royaltyPercent: number;
            seed: string;
          }) => Promise<{ id: string }>;
        };

        const listing = await listModule.listNft({
          assetId: mintedAssetId,
          priceKSS: priceNumber,
          royaltyPercent: Math.min(Math.max(royaltyNumber || 0, 0), 10),
          seed,
        });

        setTxUrl(`${KROSS_CONFIG.explorerUrl}/tx/${listing.id}`);
        setMessage('NFT minted and listed successfully.');
      } else {
        setTxUrl(
          mintResult.explorerUrl ||
            (mintTxId ? `${KROSS_CONFIG.explorerUrl}/tx/${mintTxId}` : ''),
        );
        setMessage('NFT minted successfully.');
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to create NFT.');
    }
  };

  if (!isConnected || !address) {
    return (
      <main className="min-h-screen bg-[#080A14] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl">
          <BackButton to="/" label="Back to Home" className="mb-8 text-white/65 hover:text-white" />
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/30">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl">
              🔐
            </div>
            <h1 className="text-3xl font-black tracking-tight">Connect your Kross wallet</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              You need a Kross wallet before you can mint NFTs and list them for sale in KSS.
            </p>
            <Link
              to="/wallet/onboarding"
              className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#080A14] transition hover:bg-white/90"
            >
              Open Wallet
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <UnlockGate>
      <main className="min-h-screen bg-[#080A14] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.22),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <BackButton to="/" label="Back to Home" className="mb-8 text-white/60 hover:text-white" />

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                  Kross creator studio
                </div>
                <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Mint a collectible that feels{' '}
                  <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-rose-300 bg-clip-text text-transparent">
                    gallery-ready.
                  </span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                  Upload your media, pin metadata to IPFS, mint on Kross, and optionally list
                  for sale in native {nativeSymbol}.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-2xl font-black">IPFS</p>
                    <p className="mt-1 text-xs text-white/45">Pinned media</p>
                  </div>
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-2xl font-black">{nativeSymbol}</p>
                    <p className="mt-1 text-xs text-white/45">Native pricing</p>
                  </div>
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-2xl font-black">3K</p>
                    <p className="mt-1 text-xs text-white/45">Kross address</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {status !== 'idle' && (
            <div
              className={`mb-6 rounded-3xl border p-5 ${
                status === 'success'
                  ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
                  : status === 'error'
                    ? 'border-rose-400/25 bg-rose-400/10 text-rose-100'
                    : 'border-indigo-400/25 bg-indigo-400/10 text-indigo-100'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">
                    {status === 'uploading'
                      ? 'Uploading'
                      : status === 'minting'
                        ? 'Minting'
                        : status === 'listing'
                          ? 'Listing'
                          : status === 'success'
                            ? 'Success'
                            : 'Something went wrong'}
                  </p>
                  <p className="mt-1 text-sm opacity-80">{message}</p>
                </div>

                {txUrl && (
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#080A14] transition hover:bg-white/90"
                  >
                    View transaction
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200/70">
                      Step 01
                    </p>
                    <h2 className="mt-2 text-2xl font-black">Artwork</h2>
                    <p className="mt-1 text-sm text-white/50">
                      Upload an image or paste an IPFS / gateway URL.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-indigo-400/10 px-3 py-2 text-xs font-bold text-indigo-100 sm:block">
                    Required
                  </div>
                </div>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    handleFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`group relative overflow-hidden rounded-[1.5rem] border border-dashed p-6 transition ${
                    dragActive
                      ? 'border-indigo-300 bg-indigo-400/15'
                      : 'border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                  />

                  <div className="grid gap-5 sm:grid-cols-[170px_1fr] sm:items-center">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                      {previewUrl ? (
                        <img src={previewUrl} alt="NFT media preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                            ✦
                          </div>
                          <p className="mt-3 text-xs text-white/45">No media yet</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black">Drop your artwork here</h3>
                      <p className="mt-2 text-sm leading-6 text-white/52">
                        Recommended: square JPG, PNG, or GIF. Your image is pinned through the
                        server-side IPFS function before minting.
                      </p>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90"
                        >
                          Choose file
                        </button>
                        {mediaFile && (
                          <button
                            type="button"
                            onClick={() => setMediaFile(null)}
                            className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="media-url" className="mb-2 block text-sm font-bold text-white/80">
                    Or paste image URL
                  </label>
                  <input
                    id="media-url"
                    value={mediaUrl}
                    onChange={(event) => {
                      setMediaUrl(event.target.value);
                      if (event.target.value.trim()) setMediaFile(null);
                    }}
                    placeholder="ipfs://... or https://..."
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
                <div className="mb-5">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-200/70">
                    Step 02
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Metadata</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Add the information collectors see before they buy.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label htmlFor="nft-name" className="mb-2 block text-sm font-bold text-white/80">
                      NFT name
                    </label>
                    <input
                      id="nft-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Neon Memory #01"
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-bold text-white/80">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={5}
                      placeholder="Tell the story behind this collectible…"
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <p className="mt-2 text-xs text-white/38">
                      Minimum 10 characters. Strong descriptions help collectors understand value.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="category" className="mb-2 block text-sm font-bold text-white/80">
                        Category
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value as NftCategoryId)}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
                      >
                        {NFT_CATEGORIES.map((item) => (
                          <option key={item.id} value={item.id} className="bg-[#080A14]">
                            {item.emoji} {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="external-url" className="mb-2 block text-sm font-bold text-white/80">
                        External link
                      </label>
                      <input
                        id="external-url"
                        value={externalUrl}
                        onChange={(event) => setExternalUrl(event.target.value)}
                        placeholder="https://your-site.com"
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
                <div className="mb-5">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-200/70">
                    Step 03
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Sale settings</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Mint only, or mint and immediately list on the marketplace.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSaleMode('mint-and-list')}
                    className={`rounded-3xl border p-4 text-left transition ${
                      saleMode === 'mint-and-list'
                        ? 'border-indigo-300/50 bg-indigo-400/15'
                        : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <p className="font-black">Mint & list</p>
                    <p className="mt-1 text-sm text-white/50">Create the NFT and list it for {nativeSymbol}.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleMode('mint-only')}
                    className={`rounded-3xl border p-4 text-left transition ${
                      saleMode === 'mint-only'
                        ? 'border-indigo-300/50 bg-indigo-400/15'
                        : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <p className="font-black">Mint only</p>
                    <p className="mt-1 text-sm text-white/50">Keep it in your wallet after minting.</p>
                  </button>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="price" className="mb-2 block text-sm font-bold text-white/80">
                      Price
                    </label>
                    <div className="relative">
                      <input
                        id="price"
                        type="number"
                        min="0"
                        step="0.00000001"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        disabled={saleMode === 'mint-only'}
                        placeholder="25"
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 pr-16 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-white/38">
                        {nativeSymbol}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="royalty" className="mb-2 block text-sm font-bold text-white/80">
                      Royalty
                    </label>
                    <div className="relative">
                      <input
                        id="royalty"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={royaltyPercent}
                        onChange={(event) => setRoyaltyPercent(event.target.value)}
                        placeholder="5"
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-indigo-300/70 focus:ring-4 focus:ring-indigo-500/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-white/38">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/30 backdrop-blur">
                <div className="relative aspect-square bg-black/30">
                  {previewUrl ? (
                    <img src={previewUrl} alt="NFT preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center">
                      <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/10 text-4xl">
                          🖼️
                        </div>
                        <p className="mt-4 text-sm font-bold text-white/70">Live preview</p>
                        <p className="mt-1 text-xs text-white/40">Your artwork appears here.</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-black backdrop-blur">
                    {NFT_CATEGORIES.find((item) => item.id === category)?.emoji}{' '}
                    {NFT_CATEGORIES.find((item) => item.id === category)?.label}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-2xl font-black">
                        {name.trim() || 'Untitled NFT'}
                      </h3>
                      <p className="mt-1 text-sm text-white/45">by {shortAddress(address)}</p>
                    </div>
                    {saleMode === 'mint-and-list' && priceNumber > 0 && (
                      <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right text-[#080A14]">
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-55">Price</p>
                        <p className="font-black">{formatNumber(priceNumber)}</p>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-4 min-h-[4rem] text-sm leading-6 text-white/52">
                    {description.trim() || 'Add a strong description to help collectors understand the story behind this piece.'}
                  </p>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20">
                <h3 className="text-lg font-black">Payout estimate</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/48">List price</span>
                    <span className="font-bold">
                      {formatNumber(payout.total)} {nativeSymbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/48">Platform fee ({platformFeePercent}%)</span>
                    <span className="font-bold">
                      {formatNumber(payout.platformFee)} {nativeSymbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/48">Royalty reference</span>
                    <span className="font-bold">
                      {formatNumber(payout.royalty)} {nativeSymbol}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black">Creator receives</span>
                      <span className="font-black text-emerald-300">
                        {formatNumber(payout.creatorReceives)} {nativeSymbol}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20">
                <h3 className="text-lg font-black">Checklist</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ['Artwork added', Boolean(mediaFile || mediaUrl.trim())],
                    ['Name added', name.trim().length >= 2],
                    ['Description added', description.trim().length >= 10],
                    ['Category selected', Boolean(category)],
                    ['Sale configured', saleMode === 'mint-only' || priceNumber > 0],
                  ].map(([label, complete]) => (
                    <div key={String(label)} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                          complete ? 'bg-emerald-400 text-[#07120d]' : 'bg-white/10 text-white/35'
                        }`}
                      >
                        {complete ? '✓' : '•'}
                      </span>
                      <span className={complete ? 'text-white/80' : 'text-white/42'}>{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="submit"
                disabled={!canSubmit || busy}
                className="group relative w-full overflow-hidden rounded-[1.5rem] bg-white px-6 py-4 text-base font-black text-[#080A14] shadow-2xl shadow-indigo-950/40 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="relative z-10">
                  {busy
                    ? status === 'uploading'
                      ? 'Uploading to IPFS…'
                      : status === 'minting'
                        ? 'Minting NFT…'
                        : 'Listing NFT…'
                    : saleMode === 'mint-and-list'
                      ? 'Mint & List NFT'
                      : 'Mint NFT'}
                </span>
                <span className="absolute inset-0 translate-y-full bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-rose-200 transition group-hover:translate-y-0" />
              </button>

              {assetId && (
                <p className="break-all rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/50">
                  Asset ID: <span className="text-white/75">{assetId}</span>
                </p>
              )}
            </aside>
          </div>
        </form>
      </main>
    </UnlockGate>
  );
}
