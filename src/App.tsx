import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExploreByCategory from './pages/ExploreByCategory';
import HomePage from './pages/index';
import ExplorePage from './pages/explore';
import CreatePage from './pages/create';
import WalletPage from './pages/wallet';
import NFTDetail from './pages/NFTDetail';
import ExploreCategoriesPage from './pages/ExploreCategories';
import CategoryDetail from './pages/CategoryDetail';
import MovieCategoryDetail from './pages/MovieCategoryDetail';
import './index.css'; // Import the global stylesheet

function App() {
  return (
    <Router>
      <Routes>
        {/* Main entry page: the marketplace home page */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore-categories" element={<ExploreByCategory />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/nft/:id" element={<NFTDetail />} />
        <Route path="/categories" element={<ExploreCategoriesPage />} />
        <Route path="/category/:id" element={<MovieCategoryDetail />} />
        <Route path="/explore/category/:id" element={<CategoryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
