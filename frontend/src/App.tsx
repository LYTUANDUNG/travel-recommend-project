import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LocationDetail from './pages/LocationDetail';
import Recommend from './pages/Recommend';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import TripPlanner from './pages/TripPlanner';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import 'leaflet/dist/leaflet.css';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AiRecommend from './pages/AiRecommend';
import Contact from './pages/Contact';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLocationForm from './pages/admin/AdminLocationForm';
import AdminLocations from './pages/admin/AdminLocations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBanners from './pages/admin/AdminBanners';
import AdminVisits from './pages/admin/AdminVisits';
import AdminCategories from './pages/admin/AdminCategories';
import AdminGisScanner from './pages/admin/AdminGisScanner';
import AdminBlogs from './pages/admin/AdminBlogs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/location/:id" element={<LocationDetail />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/map" element={<Explore />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/planner" element={<TripPlanner />} />
          <Route path="/ai-recommend" element={<AiRecommend />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-location" element={<AdminLocationForm />} />
          <Route path="/admin/edit-location/:id" element={<AdminLocationForm />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
          <Route path="/admin/visits" element={<AdminVisits />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/gis-scanner" element={<AdminGisScanner />} />
          <Route path="/admin/blogs" element={<AdminBlogs />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
