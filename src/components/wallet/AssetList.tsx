// src/components/wallet/AssetList.tsx
import { KrossAsset } from '@/lib/blockchain/kross/queries';

export function AssetList({ assets }: { assets: KrossAsset[] }) {
  const tokens = assets.filter((a) => !a.isNFT);
  const nfts = assets.filter((a) => a.isNFT);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Tokens</h3>
        {tokens.length === 0 ? (
          <p className="text-sm text-gray-400">No tokens held.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((t) => (
              <div
                key={t.assetId}
                className="flex justify-between items-center p-3 rounded-xl border bg-white"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-gray-700">
                  {t.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">NFTs</h3>
        {nfts.length === 0 ? (
          <p className="text-sm text-gray-400">No NFTs held.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {nfts.map((n) => (
              <div
                key={n.assetId}
                className="p-3 rounded-xl border bg-white text-sm"
              >
                <p className="font-medium truncate">{n.name}</p>
                <p className="text-xs text-gray-400 truncate">{n.assetId}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
