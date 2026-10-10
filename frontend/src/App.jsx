import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Sprout, Stethoscope, Store, ShoppingBag, ShieldCheck, ArrowRight, User, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuth } from './context/AuthContext.jsx';

// Public Pages
import HomePage from './pages/public/HomePage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';

// Plant Doctor Page
import PlantDoctorPage from './pages/plant-doctor/PlantDoctorPage.jsx';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// Plant & Nursery Marketplace Pages
import ProductListingPage from './pages/products/ProductListingPage.jsx';
import NurseryListingPage from './pages/nurseries/NurseryListingPage.jsx';

// Customer Pages
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage.jsx';
import MyReservationsPage from './pages/customer/MyReservationsPage.jsx';
import MyOrdersPage from './pages/customer/MyOrdersPage.jsx';
import OrderDetailsPage from './pages/customer/OrderDetailsPage.jsx';

// Seller Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage.jsx';

export default function App() {
  const [apiHealth, setApiHealth] = useState(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/health')
      .then((res) => setApiHealth(res.data))
      .catch(() => {
        axios.get('http://localhost:5000/api/health')
          .then((res) => setApiHealth(res.data))
          .catch(() => setApiHealth({ status: 'offline', message: 'Backend not connected' }));
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* AgriPickup Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Agri<span className="text-emerald-600">Pickup</span>
              </span>
              <span className="block text-[10px] font-medium text-emerald-800 -mt-1 tracking-wide">
                Fresh Farm Needs, Just a Pickup Away!
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 rounded-lg transition-colors">
              Home
            </Link>
            <Link to="/plants" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 rounded-lg transition-colors">
              Browse Plants
            </Link>
            <Link to="/nurseries" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 rounded-lg transition-colors">
              Nearby Nurseries
            </Link>
            <Link to="/plant-doctor" className="px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-200">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Plant Doctor AI</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to={user?.role === 'SELLER' ? '/seller/dashboard' : '/customer/dashboard'}
                  className="px-2.5 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>{user?.name?.split(' ')[0] || 'Dashboard'}</span>
                </Link>
                {user?.role === 'CUSTOMER' && (
                  <>
                    <Link
                      to="/orders"
                      className="px-2.5 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/reservations"
                      className="px-2.5 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      My Reservations
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors ml-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-emerald-600 rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-3.5 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body Routing */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage apiHealth={apiHealth} />} />
          <Route path="/plants" element={<ProductListingPage />} />
          <Route path="/nurseries" element={<NurseryListingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/plant-doctor" element={<PlantDoctorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          <Route path="/reservations" element={<MyReservationsPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left sm:flex sm:justify-between items-center text-sm">
          <div>
            <p className="font-semibold text-white">AgriPickup</p>
            <p className="text-xs text-slate-400 mt-1">Find Nearby. Reserve Easily. Grow Better.</p>
          </div>
          <div className="mt-4 sm:mt-0 text-xs text-slate-500">
            Backend API status: <span className={apiHealth?.status === 'ok' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>{apiHealth?.status || 'checking...'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
