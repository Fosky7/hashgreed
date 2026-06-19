// src/components/wallet/LockButton.tsx
import { useKrossSession } from '@/lib/blockchain/kross/useSession';

export function LockButton() {
  const { unlocked, lock } = useKrossSession();
  if (!unlocked) return null;
  return (
    <button
      onClick={lock}
      className="text-xs px-3 py-1.5 rounded-lg border text-gray-600"
    >
      Lock
    </button>
  );
}
