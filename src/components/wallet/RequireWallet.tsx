// src/components/wallet/RequireWallet.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { hasWallet } from '@/lib/blockchain/kross/wallet-store';

/**
 * Guards wallet-dependent routes. Redirects to onboarding
 * when no encrypted wallet is stored.
 */
export function RequireWallet({ children }: { children: ReactNode }) {
  if (!hasWallet()) {
    return <Navigate to="/wallet/onboarding" replace />;
  }
  return <>{children}</>;
}
