import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import AppShell from './components/AppShell';
import MyOrdersPage from './pages/MyOrdersPage';
import CartPage from './pages/CartPage';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants/:id" element={<RestaurantPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/cart" element={<CartPage />} />
          {/* Add other routes here as needed */}
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
