// src/pages/ReceiveKss.tsx
import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { AddressQR } from '@/components/wallet/AddressQR';
import BackButton from '@/components/BackButton';

export default function ReceiveKss() {
  const { address } = useKrossWallet();
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="mb-4 text-left">
          <BackButton to="/wallet" label="Back to Wallet" />
        </div>
        <p className="text-gray-600">No wallet found.</p>
      </div>
    );
  }

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 text-center">
      <div className="text-left">
        <BackButton to="/wallet" label="Back to Wallet" />
      </div>

      <h1 className="text-2xl font-bold">Receive {KROSS_CONFIG.nativeCoin}</h1>
      <p className="text-sm text-gray-500">
        Share this address or QR code to receive {KROSS_CONFIG.nativeCoin} and
        Kross assets.
      </p>

      <div className="flex justify-center">
        <div className="p-4 bg-white rounded-2xl border inline-block">
          <AddressQR value={address} />
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-4 break-all text-sm font-mono">
        {address}
      </div>

      <button
        onClick={copy}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
      >
        {copied ? 'Copied!' : 'Copy Address'}
      </button>

      <p className="text-xs text-amber-600">
        Only send Kross ({KROSS_CONFIG.nativeCoin}) and Kross-based assets to
        this address.
      </p>
    </div>
  );
}
