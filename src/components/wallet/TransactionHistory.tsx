// src/components/wallet/TransactionHistory.tsx
import { KrossTx } from '@/lib/blockchain/kross/queries';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';

export function TransactionHistory({ txs }: { txs: KrossTx[] }) {
  if (txs.length === 0) {
    return <p className="text-sm text-gray-400">No transactions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {txs.map((tx) => (
        <a
          key={tx.id}
          href={`${KROSS_CONFIG.explorerUrl}/tx/${tx.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-between items-center p-3 rounded-xl border bg-white hover:bg-gray-50"
        >
          <div>
            <p className="text-sm font-medium">
              {tx.direction === 'in'
                ? 'Received'
                : tx.direction === 'out'
                ? 'Sent'
                : 'Self'}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(tx.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-sm font-semibold ${
                tx.direction === 'in'
                  ? 'text-green-600'
                  : tx.direction === 'out'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {tx.direction === 'in' ? '+' : tx.direction === 'out' ? '-' : ''}
              {tx.amount} {KROSS_CONFIG.nativeCoin}
            </p>
            <p className="text-xs text-gray-400">
              fee {tx.fee} {KROSS_CONFIG.nativeCoin}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
