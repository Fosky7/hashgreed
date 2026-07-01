// src/components/wallet/UnlockScreen.tsx
import WalletOnboarding from '@/pages/WalletOnboarding';

/**
 * Retired plain fallback. Keep this module as a compatibility shim so any
 * stale imports still render the styled wallet onboarding/unlock view.
 */
export function UnlockScreen() {
  return <WalletOnboarding />;
}

export default UnlockScreen;
