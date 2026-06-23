// src/components/marketplace/MarketplaceGrid.tsx
import { useMarketplace } from '../../hooks/useMarketplace';
import type { KrossSigner } from '../../lib/blockchain/kross/signer';
import { EXPLORER_URL, MARKETPLACE_CONFIG } from '../../lib/blockchain/kross/config';
import { ListingCard } from './ListingCard';

export function MarketplaceGrid({ signer }: { signer: KrossSigner | null }) {
  const mp = useMarketplace({ signer });

  return (
    <div className="mp">
      <header className="mp__header">
        <h2>Kross NFT Marketplace</h2>
        <div className="mp__meta">
          <span className="mp__coin">Prices in KSS</span>
          {MARKETPLACE_CONFIG.dAppAddress && (
            <a
              href={`${EXPLORER_URL}/address/${MARKETPLACE_CONFIG.dAppAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              View dApp
            </a>
          )}
          <button onClick={() => void mp.refresh()} disabled={mp.loading}>
            {mp.loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {mp.error && <div className="mp__error" role="alert">{mp.error}</div>}
      {!mp.connected && <div className="mp__hint">Connect a wallet to buy, list, or manage NFTs.</div>}

      {mp.loading && mp.listings.length === 0 ? (
        <div className="mp__empty">Loading listings…</div>
      ) : mp.listings.length === 0 ? (
        <div className="mp__empty">No active listings yet.</div>
      ) : (
        <div className="mp__grid">
          {mp.listings.map((l) => (
            <ListingCard
              key={l.assetId}
              listing={l}
              currentAddress={mp.address}
              busy={mp.busy}
              onBuy={() => mp.buy(l.assetId)}
              onCancel={() => mp.cancel(l.assetId)}
              onUpdatePrice={(p) => mp.updatePrice(l.assetId, p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
