// src/pages/IssueToken.tsx
import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { createAssetToken } from '@/lib/blockchain/kross/assets';

type Status = 'idle' | 'issuing' | 'done' | 'error';

export default function IssueToken() {
  const { balance, refresh } = useKrossWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [decimals, setDecimals] = useState('8');
  const [reissuable, setReissuable] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [txUrl, setTxUrl] = useState('');

  const fee = KROSS_CONFIG.fees.issueAsset;
  const qtyNum = parseFloat(quantity) || 0;
  const canIssue =
    name.trim() &&
    qtyNum > 0 &&
    password.length >= 8 &&
    balance >= fee &&
    status !== 'issuing';

  const handleIssue = async () => {
    setError('');
    setStatus('issuing');
    try {
      const res = await createAssetToken({
        name,
        description,
        quantity: qtyNum,
        decimals: parseInt(decimals, 10),
        reissuable,
        password,
      });
      setTxUrl(res.explorerUrl);
      setStatus('done');
      setPassword('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Token issuance failed.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-green-600">Token Issued!</h2>
        <p className="text-sm text-gray-600">{name} created successfully.</p>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-indigo-600 underline"
        >
          View on Explorer
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Issue Token</h1>

      <div>
        <label className="text-sm font-medium">Token Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Token name (max 16 chars)"
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Total Supply</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1000000"
            className="w-full p-3 rounded-xl border text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Decimals</label>
          <input
            type="number"
            value={decimals}
            min={0}
            max={8}
            onChange={(e) => setDecimals(e.target.value)}
            className="w-full p-3 rounded-xl border text-sm mt-1"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={reissuable}
          onChange={(e) => setReissuable(e.target.checked)}
        />
        Reissuable (can mint more later)
      </label>

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

      <div className="rounded-xl bg-gray-50 p-4 text-sm flex justify-between">
        <span className="text-gray-500">Issuance Fee</span>
        <span>{fee} {KROSS_CONFIG.nativeCoin}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={!canIssue}
        onClick={handleIssue}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
      >
        {status === 'issuing' ? 'Issuing...' : 'Issue Token'}
      </button>
    </div>
  );
}
