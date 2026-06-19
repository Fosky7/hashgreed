// src/components/wallet/UnlockGate.tsx
import { ReactNode } from 'react';
import { useKrossSession } from '@/lib/blockchain/kross/useSession';
import { UnlockScreen } from './UnlockScreen';

/**
 * Gates pages that need signing. Shows the unlock screen when locked,
 * otherwise renders children. Once unlocked, send/mint no longer
 * require re-typing the password (session seed is used).
 */
export function UnlockGate({ children }: { children: ReactNode }) {
  const { unlocked } = useKrossSession();
  if (!unlocked) return <UnlockScreen />;
  return <>{children}</>;
}
