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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/detail/:id" element={<Detail />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}