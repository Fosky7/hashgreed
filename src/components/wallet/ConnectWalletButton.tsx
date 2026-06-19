// src/components/wallet/ConnectWalletButton.tsx
import { useExternalWallet } from '@/lib/blockchain/kross/useExternalWallet';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Connect to an external Keeper / Signer wallet (RIDE v6) and show the
 * connected address + KSS balance. Signing for marketplace actions is then
 * authorized inside the user's wallet.
 */
export function ConnectWalletButton() {
  const { address, balance, status, error, connect, disconnect } =
    useExternalWallet();
  const symbol = (KROSS_CONFIG as any).nativeCoin?.symbol ?? 'KSS';

  if (status === 'connected' && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-1.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-mono">{truncate(address)}</span>
          {balance != null && (
            <span className="text-gray-500">
              {balance} {symbol}
            </span>
          )}
        </div>
        <button
          onClick={disconnect}
          className="text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={connect}
        disabled={status === 'connecting'}
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
      >
        {status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && <p className="text-xs text-red-500 max-w-xs">{error}</p>}
    </div>
  );
}
