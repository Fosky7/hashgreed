// src/pages/MintNFT.tsx
import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { createNFT } from '@/lib/blockchain/kross/assets';

type Status = 'idle' | 'minting' | 'done' | 'error';

export default function MintNFT() {
  const { balance, refresh } = useKrossWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; assetId: string } | null>(
    null
  );

  const fee = KROSS_CONFIG.fees.issueNFT;
  const canMint =
    name.trim() &&
    password.length >= 8 &&
    balance >= fee &&
    status !== 'minting';

  const handleMint = async () => {
    setError('');
    setStatus('minting');
    try {
      const res = await createNFT({ name, description, imageUrl, password });
      setResult({ url: res.explorerUrl, assetId: res.assetId });
      setStatus('done');
      setPassword('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Minting failed.');
      setStatus('error');
    }
  };

  if (status === 'done' && result) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-green-600">NFT Minted!</h2>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-40 h-40 object-cover rounded-xl mx-auto"
          />
        )}
        <p className="text-sm text-gray-600">{name}</p>
        <p className="text-xs text-gray-400 break-all">{result.assetId}</p>
        <a
          href={result.url}
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
      <h1 className="text-2xl font-bold">Mint NFT</h1>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="preview"
          className="w-full h-48 object-cover rounded-xl border"
        />
      )}

      <div>
        <label className="text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="NFT name (max 16 chars)"
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Image URL</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe your NFT"
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

      <div className="rounded-xl bg-gray-50 p-4 text-sm flex justify-between">
        <span className="text-gray-500">Minting Fee</span>
        <span>{fee} {KROSS_CONFIG.nativeCoin}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={!canMint}
        onClick={handleMint}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
      >
        {status === 'minting' ? 'Minting...' : 'Mint NFT'}
      </button>
    </div>
  );
}
