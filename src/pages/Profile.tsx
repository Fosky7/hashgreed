// src/pages/Profile.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { getStoredAddress } from '@/lib/blockchain/kross/wallet-store';
import DEPLOYED_CONFIG from '@/lib/blockchain/kross/deployed.config';
import {
  fetchUserProfile,
  formatKSS,
  truncate,
  type ProfileActivityItem,
  type ProfileCollection,
  type ProfileOwnedNft,
  type UserProfileData,
} from '@/lib/blockchain/kross/profile';

type Tab = 'owned' | 'collections' | 'activity';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="55%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="720" height="720" fill="#080A14"/>
      <circle cx="180" cy="140" r="230" fill="#6366f1" opacity="0.25"/>
      <circle cx="620" cy="210" r="190" fill="#ec4899" opacity="0.16"/>
      <circle cx="390" cy="620" r="260" fill="#06b6d4" opacity="0.13"/>
      <rect x="150" y="150" width="420" height="420" rx="64" fill="url(#g)" opacity="0.18" stroke="white" stroke-opacity="0.22" stroke-width="3"/>
      <text x="360" y="348" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="36" font-weight="800">Kross NFT</text>
      <text x="360" y="400" text-anchor="middle" fill="white" fill-opacity="0.58" font-family="Arial, sans-serif" font-size="18">Profile item</text>
    </svg>
  `);

function nativeSymbol(): string {
  return DEPLOYED_CONFIG.nativeCoin.symbol;
}

function copyAddress(address: string) {
  void navigator.clipboard.writeText(address);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-white/45">{hint}</p>
    </div>
  );
}

function TabButton({
  value,
  active,
  onClick,
  children,
}: {
  value: Tab;
  active: boolean;
  onClick: (value: Tab) => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-full px-4 py-2 text-sm font-black transition ${
        active
          ? 'bg-white text-[#080A14]'
          : 'border border-white/10 bg-white/[0.045] text-white/55 hover:bg-white/[0.075] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function NftCard({ nft }: { nft: ProfileOwnedNft }) {
  return (
    <Link
      to={`/nft/${nft.assetId}`}
      className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/15 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="relative aspect-square overflow-hidden bg-black/30">
        <img
          src={nft.imageUrl || FALLBACK_IMAGE}
          alt={nft.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {nft.isCreatedByUser && (
            <span className="rounded-full border border-indigo-200/20 bg-indigo-400/20 px-3 py-1 text-[11px] font-black text-indigo-100 backdrop-blur">
              Created
            </span>
          )}
          {nft.isListedByUser && (
            <span className="rounded-full border border-emerald-200/20 bg-emerald-400/20 px-3 py-1 text-[11px] font-black text-emerald-100 backdrop-blur">
              Listed
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="truncate text-lg font-black text-white">{nft.name}</p>
        <p className="mt-1 truncate text-sm text-white/45">{nft.collectionName}</p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">
              {nft.isListedByUser ? 'Price' : 'Status'}
            </p>
            <p className="mt-1 font-black text-indigo-200">
              {nft.isListedByUser
                ? `${formatKSS(nft.listing?.priceKSS ?? nft.listing?.priceWavelets ? Number(nft.listing?.priceWavelets ?? 0) / 1e8 : null)} ${nativeSymbol()}`
                : 'In wallet'}
            </p>
          </div>
          <span className="text-sm font-black text-white/50 transition group-hover:translate-x-1 group-hover:text-white">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

function CollectionCard({ collection }: { collection: ProfileCollection }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/15">
      <div className="relative h-44 overflow-hidden bg-black/30">
        <img
          src={collection.coverImage || FALLBACK_IMAGE}
          alt={collection.name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A14] via-[#080A14]/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="truncate text-2xl font-black text-white">{collection.name}</p>
          <p className="mt-1 text-sm font-bold text-white/55">
            {collection.itemCount} item{collection.itemCount === 1 ? '' : 's'} created
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">
              Listed
            </p>
            <p className="mt-1 text-xl font-black text-white">{collection.listedCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">
              Floor
            </p>
            <p className="mt-1 text-xl font-black text-white">
              {collection.floorPriceKSS === null
                ? '—'
                : `${formatKSS(collection.floorPriceKSS)} ${nativeSymbol()}`}
            </p>
          </div>
        </div>

        {collection.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {collection.categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-bold text-white/55"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: ProfileActivityItem['kind'] }) {
  const icon =
    kind === 'received'
      ? '↓'
      : kind === 'sent'
        ? '↑'
        : kind === 'minted'
          ? '✦'
          : kind === 'listed'
            ? '🏷'
            : kind === 'bought'
              ? '✓'
              : kind === 'sold'
                ? '💎'
                : '↯';

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#080A14]">
      {icon}
    </div>
  );
}

function ActivityRow({ item }: { item: ProfileActivityItem }) {
  return (
    <a
      href={item.explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:border-white/20 hover:bg-white/[0.07]"
    >
      <ActivityIcon kind={item.kind} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-black text-white">{item.title}</p>
            <p className="mt-1 text-sm text-white/45">{item.description}</p>
          </div>
          <p className="shrink-0 text-xs font-bold text-white/35">
            {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Pending'}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[11px] text-white/40">
            {truncate(item.id, 8, 6)}
          </span>
          {typeof item.amountKSS === 'number' && (
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-black text-indigo-200">
              {formatKSS(item.amountKSS)} {nativeSymbol()}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center shadow-2xl shadow-black/15">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/48">{description}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[#080A14] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <BackButton to="/" label="Back to Home" className="mb-8 text-white/55 hover:text-white" />
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-white/[0.055]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.055]" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.055]" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.055]" />
        </div>
      </div>
    </main>
  );
}

export default function Profile() {
  const wallet = useKrossWallet();
  const [activeTab, setActiveTab] = useState<Tab>('owned');
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const connectedAddress = wallet.address || getStoredAddress();

  const loadProfile = useCallback(async () => {
    if (!connectedAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await fetchUserProfile(connectedAddress);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [connectedAddress]);

  useEffect(() => {
    void wallet.refresh();
  }, [wallet.refresh]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const listedCount = useMemo(
    () => profile?.ownedNfts.filter((nft) => nft.isListedByUser).length ?? 0,
    [profile?.ownedNfts],
  );

  if (loading) return <ProfileSkeleton />;

  if (!connectedAddress) {
    return (
      <main className="min-h-screen bg-[#080A14] px-4 py-8 text-white">
        <div className="mx-auto max-w-xl">
          <BackButton to="/" label="Back to Home" className="mb-8 text-white/55 hover:text-white" />
          <EmptyState
            icon="👤"
            title="Connect your Kross wallet"
            description="Create or import a Kross wallet to view your owned NFTs, created collections, and recent activity."
            action={{ label: 'Connect Wallet', to: '/wallet/onboarding' }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080A14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-24%] top-[-20%] h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-[-20%] top-[5%] h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/14 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[25%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BackButton to="/" label="Back to Home" className="text-white/55 hover:text-white" />
          <button
            type="button"
            onClick={() => void loadProfile()}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-black text-white/62 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.12),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-100/75">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                  Connected Kross profile
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-white/10 bg-white text-4xl font-black text-[#080A14] shadow-2xl shadow-black/30">
                    {connectedAddress.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">User Profile</h1>
                    <p className="mt-3 max-w-2xl break-all font-mono text-sm leading-6 text-white/58">
                      {connectedAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => copyAddress(connectedAddress)}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#080A14] transition hover:bg-white/90"
                  >
                    Copy Address
                  </button>
                  <a
                    href={`${DEPLOYED_CONFIG.explorerUrl}/address/${connectedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
                  >
                    View on Kross Explorer
                  </a>
                  <Link
                    to="/create"
                    className="rounded-2xl border border-indigo-300/30 bg-indigo-400/15 px-5 py-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-400/20"
                  >
                    Create NFT
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6">
                <p className="text-sm font-bold text-white/45">Native balance</p>
                <p className="mt-2 text-5xl font-black tracking-tight text-white">
                  {wallet.loading ? '…' : wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </p>
                <p className="mt-1 text-lg font-black text-indigo-200">{nativeSymbol()}</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-3xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Owned NFTs"
            value={String(profile?.ownedNfts.length ?? 0)}
            hint="Wallet-held and active listed NFTs"
          />
          <StatCard
            label="Created Collections"
            value={String(profile?.createdCollections.length ?? 0)}
            hint="Grouped from NFTs issued by you"
          />
          <StatCard
            label="Listed"
            value={String(listedCount)}
            hint="NFTs currently listed for sale"
          />
        </section>

        <section className="mt-8">
          <div className="mb-6 flex flex-wrap gap-3">
            <TabButton value="owned" active={activeTab === 'owned'} onClick={setActiveTab}>
              Owned NFTs
            </TabButton>
            <TabButton value="collections" active={activeTab === 'collections'} onClick={setActiveTab}>
              Created Collections
            </TabButton>
            <TabButton value="activity" active={activeTab === 'activity'} onClick={setActiveTab}>
              Recent Activity
            </TabButton>
          </div>

          {activeTab === 'owned' && (
            <>
              {profile?.ownedNfts.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {profile.ownedNfts.map((nft) => (
                    <NftCard key={nft.assetId} nft={nft} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🖼️"
                  title="No NFTs owned yet"
                  description="NFTs held by your Kross wallet, plus NFTs you listed in marketplace escrow, will appear here."
                  action={{ label: 'Explore NFTs', to: '/explore' }}
                />
              )}
            </>
          )}

          {activeTab === 'collections' && (
            <>
              {profile?.createdCollections.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {profile.createdCollections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="✨"
                  title="No created collections yet"
                  description="Collections are grouped from NFTs issued by your connected Kross address. Mint your first NFT to start building a collection."
                  action={{ label: 'Create NFT', to: '/create' }}
                />
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {profile?.recentActivity.length ? (
                <div className="space-y-3">
                  {profile.recentActivity.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🧾"
                  title="No recent activity"
                  description="Your Kross sends, receives, minting actions, and marketplace interactions will appear here."
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
