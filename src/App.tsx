// src/App.tsx
// Install Node-global polyfills BEFORE any blockchain SDK module evaluates.
import '@/lib/blockchain/kross/polyfills';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KrossWalletProvider } from '@/lib/blockchain/kross/WalletProvider';
import { RequireWallet } from '@/components/wallet/RequireWallet';
import { UnlockGate } from '@/components/wallet/UnlockGate';

import WalletOnboarding from '@/pages/WalletOnboarding';
import WalletDashboard from '@/pages/WalletDashboard';
import SendKss from '@/pages/SendKss';
import ReceiveKss from '@/pages/ReceiveKss';
import MintNFT from '@/pages/MintNFT';
import IssueToken from '@/pages/IssueToken';
import Marketplace from '@/pages/Marketplace';
import MarketplaceBrowse from '@/pages/MarketplaceBrowse';
import ExploreHome from '@/pages/ExploreHome';
import CategoryExplore from '@/pages/CategoryExplore';
import ExploreByCategory from '@/pages/ExploreByCategory';
import ExplorePage from '@/pages/explore';
import NFTDetail from '@/pages/NFTDetail';
import CreatePage from '@/pages/create';
import HomeIndex from '@/pages/index';

export default function App() {
  return (
    <KrossWalletProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<HomeIndex />} />

          {/* Public marketplace browse page (content-rich, never blank) */}
          <Route path="/marketplace" element={<MarketplaceBrowse />} />

          {/* Wallet-powered trading flow (list / buy) */}
          <Route
            path="/marketplace/trade"
            element={
              <RequireWallet>
                <UnlockGate>
                  <Marketplace />
                </UnlockGate>
              </RequireWallet>
            }
          />

          {/* Public explore */}
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/categories" element={<ExploreByCategory />} />
          <Route path="/explore/listings" element={<ExploreHome />} />
          <Route path="/explore/:category" element={<CategoryExplore />} />
          <Route path="/nft/:id" element={<NFTDetail />} />
          <Route path="/create" element={<CreatePage />} />

          {/* Wallet onboarding (public) */}
          <Route path="/wallet/onboarding" element={<WalletOnboarding />} />

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

          {/* Catch-all → public marketplace so #root always renders */}
          <Route path="*" element={<Navigate to="/marketplace" replace />} />
        </Routes>
      </BrowserRouter>
    </KrossWalletProvider>
  );
}
