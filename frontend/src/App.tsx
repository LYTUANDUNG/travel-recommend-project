import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Recommend from './pages/Recommend';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Blog from './pages/Blog';
import Layout from './components/Layout';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddLocation from './pages/AdminAddLocation';
import { AdminLocations, AdminUsers, AdminReviews, AdminTags } from './pages/AdminDummies';

export default function App() {
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
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin Pages */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-location" element={<AdminAddLocation />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/tags" element={<AdminTags />} />
        </Route>

        {/* Naked Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}