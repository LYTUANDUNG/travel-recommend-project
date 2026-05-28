import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useTripStore } from '../store/useTripStore';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { tripItems } = useTripStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Khám phá', path: '/explore' },
    { name: 'Dành cho bạn', path: '/recommend' },
    { name: 'Lộ trình', path: '/planner' },
    { name: 'Cẩm nang', path: '/blog' },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/95 dark:bg-slate-950/95 shadow-sm py-4" : "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-6"
      )}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f97316] to-[#f59e0b] flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black">
              V
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Vina<span className="text-[#f97316]">Travel</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => cn(
                  "text-[14px] font-semibold transition-all relative flex items-center gap-2",
                  isActive ? "text-[#f97316]" : "text-slate-800 hover:text-[#f97316] dark:text-slate-200 dark:hover:text-white"
                )}
              >
                {link.name}
                {link.name === 'Lộ trình' && tripItems.length > 0 && (
                   <span className="absolute -top-2 -right-3 w-4 h-4 bg-[#f97316] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      {tripItems.length}
                   </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden lg:block">Hi, {user?.full_name?.split(' ').pop()}</span>
                {user?.role === 'ADMIN' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors" 
                    title="Quản trị"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </Link>
                )}
                <Link to="/profile" className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
                  <User className="w-4 h-4" />
                </Link>
                <button
                  className="p-2 rounded-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-8 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full text-[14px] font-semibold transition-all">
                Đăng nhập
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-800 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-lg p-6 md:hidden flex flex-col gap-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                isActive ? "bg-orange-50 dark:bg-orange-950/20 text-[#f97316]" : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {link.name}
            </NavLink>
          ))}
          {!isAuthenticated && (
             <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 bg-[#f97316] text-white rounded-xl text-sm font-semibold text-center mt-2">
                Đăng nhập
             </Link>
          )}
        </div>
      )}
    </header>
  );
}
