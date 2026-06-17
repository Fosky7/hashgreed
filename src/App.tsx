// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { KrossWalletProvider } from '@/lib/blockchain/kross/WalletProvider';
import { RequireWallet } from '@/components/wallet/RequireWallet';

import WalletOnboarding from '@/pages/WalletOnboarding';
import WalletDashboard from '@/pages/WalletDashboard';
import SendKss from '@/pages/SendKss';
import ReceiveKss from '@/pages/ReceiveKss';
import MintNFT from '@/pages/MintNFT';
import IssueToken from '@/pages/IssueToken';
import Marketplace from '@/pages/Marketplace';
import ExploreHome from '@/pages/ExploreHome';
import CategoryExplore from '@/pages/CategoryExplore';
import { UnlockGate } from '@/components/wallet/UnlockGate';

export default function App() {
  return (
    <KrossWalletProvider>
      <BrowserRouter>
        <Routes>
          {/* Public onboarding */}
          <Route path="/wallet/onboarding" element={<WalletOnboarding />} />

          {/* Public NFT category explore (browse without unlocking) */}
          <Route path="/explore" element={<ExploreHome />} />
          <Route path="/explore/:category" element={<CategoryExplore />} />

          {/* Wallet-guarded routes */}
          <Route
            path="/wallet"
            element={
              <RequireWallet>
                <WalletDashboard />
              </RequireWallet>
            }
          />
          <Route
            path="/wallet/send"
            element={
              <RequireWallet>
                <UnlockGate>
                  <SendKss />
                </UnlockGate>
              </RequireWallet>
            }
          />
          <Route
            path="/wallet/receive"
            element={
              <RequireWallet>
                <ReceiveKss />
              </RequireWallet>
            }
          />
          <Route
            path="/mint"
            element={
              <RequireWallet>
                <UnlockGate>
                  <MintNFT />
                </UnlockGate>
              </RequireWallet>
            }
          />
          <Route
            path="/issue-token"
            element={
              <RequireWallet>
                <UnlockGate>
                  <IssueToken />
                </UnlockGate>
              </RequireWallet>
            }
          />
          <Route
            path="/marketplace"
            element={
              <RequireWallet>
                <UnlockGate>
                  <Marketplace />
                </UnlockGate>
              </RequireWallet>
            }
          />
        </Routes>
      </BrowserRouter>
    </KrossWalletProvider>
  );
}
