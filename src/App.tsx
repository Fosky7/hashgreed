// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { KrossWalletProvider } from '@/lib/blockchain/kross/WalletProvider';

// Pages (lazy-loaded to keep the initial bundle lean).
const HomePage = lazy(() => import('./pages/Home'));
const ExploreHome = lazy(() => import('./pages/ExploreHome'));
const ExploreCategories = lazy(() => import('./pages/ExploreCategories'));
const ExploreByCategory = lazy(() => import('./pages/ExploreByCategory'));
const CategoryExplore = lazy(() => import('./pages/CategoryExplore'));
const MoviesHome = lazy(() => import('./pages/MoviesHome'));
const MintNFT = lazy(() => import('./pages/MintNFT'));
const UpdateNFTPrice = lazy(() => import('./pages/UpdateNFTPrice'));
const WalletOnboarding = lazy(() => import('./pages/WalletOnboarding'));
const WalletDashboard = lazy(() => import('./pages/WalletDashboard'));
const SendKss = lazy(() => import('./pages/SendKss'));
const ReceiveKss = lazy(() => import('./pages/ReceiveKss'));

export default function App() {
  return (
    <KrossWalletProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-gray-500">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExploreHome />} />
            <Route path="/categories" element={<ExploreCategories />} />
            <Route path="/explore/by-category" element={<ExploreByCategory />} />
            <Route
              path="/marketplace/explore/:category"
              element={<CategoryExplore />}
            />
            <Route path="/movies" element={<MoviesHome />} />
            <Route path="/create" element={<MintNFT />} />

            {/* Update an existing listing's price (owner-only flow). */}
            <Route
              path="/marketplace/update-price/:assetId"
              element={<UpdateNFTPrice />}
            />

            {/* Wallet */}
            <Route path="/wallet/onboarding" element={<WalletOnboarding />} />
            <Route path="/wallet" element={<WalletDashboard />} />
            <Route path="/wallet/send" element={<SendKss />} />
            <Route path="/wallet/receive" element={<ReceiveKss />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </KrossWalletProvider>
  );
}
