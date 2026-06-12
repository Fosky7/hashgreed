import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/index';
import ExplorePage from './pages/explore';
import CreatePage from './pages/create';
import WalletPage from './pages/wallet';
import NFTDetail from './pages/NFTDetail';
import './index.css'; // Import the global stylesheet

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/nft/:id" element={<NFTDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
