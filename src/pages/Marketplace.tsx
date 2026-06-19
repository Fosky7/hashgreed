// src/pages/Marketplace.tsx
import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { invokeMarketplace } from '@/lib/blockchain/kross/assets';
import { MARKETPLACE_CONFIG } from '@/lib/blockchain/kross/deployed.config';

type Action = 'list' | 'buy';
type Status = 'idle' | 'sending' | 'done' | 'error';

export default function Marketplace() {
  const { assets, refresh } = useKrossWallet();
  const [action, setAction] = useState<Action>('buy');
  const [assetId, setAssetId] = useState('');
  const [priceKSS, setPriceKSS] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [txUrl, setTxUrl] = useState('');

  const fee = KROSS_CONFIG.fees.invoke;
  const priceNum = parseFloat(priceKSS) || 0;
  const nfts = assets.filter((a) => a.isNFT);

  const canSubmit =
    assetId.trim() &&
    priceNum > 0 &&
    password.length >= 8 &&
    status !== 'sending';

  const handleSubmit = async () => {
    setError('');
    if (!MARKETPLACE_CONFIG.dAppAddress) {
      setError('Marketplace dApp address is not configured.');
      return;
    }
    setStatus('sending');
    try {
      const res =
        action === 'list'
          ? // listNFT(price, category): the NFT itself is attached as the
            // invoke payment (assetId = the NFT id, amount = 1). Native KSS is
            // NEVER attached here — only the NFT being escrowed.
            await invokeMarketplace({
              dApp: MARKETPLACE_CONFIG.dAppAddress,
              fnName: MARKETPLACE_CONFIG.functions.list,
              args: [
                {
                  type: 'integer',
                  value: Math.round(priceNum * KROSS_CONFIG.unit),
                },
                { type: 'string', value: category || 'Uncategorized' },
              ],
              // Attach the NFT (1 unit) as payment so the dApp can escrow it.
              paymentAmount: 1,
              paymentAssetId: assetId,
              password,
            })
          : // buyNFT(assetId): exactly one NATIVE KSS payment equal to price.
            // Native KSS => assetId null (it has no assetId on Kross).
            await invokeMarketplace({
              dApp: MARKETPLACE_CONFIG.dAppAddress,
              fnName: MARKETPLACE_CONFIG.functions.buy,
              args: [{ type: 'string', value: assetId }],
              paymentKSS: priceNum,
              paymentAssetId: null,
              password,
            });
      setTxUrl(res.explorerUrl);
      setStatus('done');
      setPassword('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-green-600">
          {action === 'list' ? 'Listed!' : 'Purchased!'}
        </h2>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-indigo-600 underline"
        >
          View on Explorer
        </a>
        <a
          href="/wallet"
          className="block w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          Back to Wallet
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Marketplace</h1>

      <div className="flex gap-2 border-b">
        {(['buy', 'list'] as Action[]).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`pb-2 px-2 text-sm font-medium capitalize ${
              action === a
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-400'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {action === 'list' ? (
        <div>
          <label className="text-sm font-medium">Select NFT to list</label>
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full p-3 rounded-xl border text-sm mt-1"
          >
            <option value="">— choose —</option>
            {nfts.map((n) => (
              <option key={n.assetId} value={n.assetId}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium">NFT Asset ID</label>
          <input
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Asset ID to buy"
            className="w-full p-3 rounded-xl border text-sm mt-1"
          />
        </div>
      )}

      {action === 'list' && (
        <div>
          <label className="text-sm font-medium">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Art, Music, Gaming"
            className="w-full p-3 rounded-xl border text-sm mt-1"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium">
          {action === 'list' ? 'List Price' : 'Price'} (
          {KROSS_CONFIG.nativeCoin})
        </label>
        <input
          type="number"
          value={priceKSS}
          onChange={(e) => setPriceKSS(e.target.value)}
          placeholder="0.0"
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Wallet Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password to sign"
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-1">
        {action === 'buy' && (
          <div className="flex justify-between">
            <span className="text-gray-500">Price</span>
            <span>
              {priceNum} {KROSS_CONFIG.nativeCoin}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Network Fee</span>
          <span>
            {fee} {KROSS_CONFIG.nativeCoin}
          </span>
        </div>
        {action === 'buy' && (
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total</span>
            <span>
              {(priceNum + fee).toFixed(8)} {KROSS_CONFIG.nativeCoin}
            </span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
      >
        {status === 'sending'
          ? 'Processing...'
          : action === 'list'
          ? 'List NFT'
          : 'Buy NFT'}
      </button>
    </div>
  );
}
