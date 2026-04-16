import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Recommend from './pages/Recommend';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import TripPlanner from './pages/TripPlanner';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import 'leaflet/dist/leaflet.css'; // Global Leaflet CSS

import AdminDashboard from './pages/AdminDashboard';
import AdminAddLocation from './pages/AdminAddLocation';
import AdminLocations from './pages/AdminLocations';
import AdminUsers from './pages/AdminUsers';
import AdminReviews from './pages/AdminReviews';
import AdminBanners from './pages/AdminBanners';
import AdminVisits from './pages/AdminVisits';
import AdminCategories from './pages/AdminCategories';
import AdminGisScanner from './pages/AdminGisScanner';
import AdminBlogs from './pages/AdminBlogs';

import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  useEffect(() => {
    // FIX: Auto-login bug when first running the web 
    // Zustand persists the auth state but token might be missing or invalid
    const token = localStorage.getItem('token');
    const { isAuthenticated, logout } = useAuthStore.getState();
    
    if (isAuthenticated) {
        if (!token) {
           logout();
        } else {
            // Check if token is expired using basic Base64 decoding
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();
                if (isExpired) {
                    localStorage.removeItem('token');
                    logout();
                }
            } catch (e) {
                // If token is malformed, clear session
                localStorage.removeItem('token');
                logout();
            }
        }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* User Pages */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/detail/:id" element={<Detail />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/planner" element={<TripPlanner />} />
        </Route>

        {/* Admin Pages */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-location" element={<AdminAddLocation />} />
          <Route path="/admin/edit-location/:id" element={<AdminAddLocation />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
          <Route path="/admin/visits" element={<AdminVisits />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/gis-scanner" element={<AdminGisScanner />} />
          <Route path="/admin/blogs" element={<AdminBlogs />} />
        </Route>

        {/* Naked Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}