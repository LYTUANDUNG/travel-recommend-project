import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, User, LogOut, Sun, Moon } from 'lucide-react';
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
    { name: 'Dành cho bạn', path: '/recommend' },
    { name: 'Khám phá', path: '/explore' },
    { name: 'Lộ trình', path: '/planner' },
    { name: 'Bài viết', path: '/blog' },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600 p-2 rounded-lg text-white group-hover:bg-primary-700 transition-colors">
              <MapPin className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-2xl font-serif font-black transition-colors uppercase tracking-widest",
              isScrolled ? "text-slate-900 dark:text-white" : "text-white"
            )}>
              Travel
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-primary-500 relative flex items-center gap-2",
                  isActive ? "text-primary-500" : isScrolled ? "text-slate-600 dark:text-slate-400" : "text-white/90"
                )}
              >
                {link.name}
                {link.name === 'Lộ trình' && tripItems.length > 0 && (
                   <span className="absolute -top-3 -right-4 w-4 h-4 bg-primary-600 text-white rounded-full flex items-center justify-center text-[8px] font-black animate-bounce shadow-lg shadow-primary-500/30 font-sans">
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
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:block">Hi, {user?.full_name?.split(' ').pop()}</span>
                {user?.role === 'ADMIN' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100 transition-colors" 
                    title="Quản trị"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </Link>
                )}
                <Link to="/profile" className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all">
                  <User className="w-5 h-5" />
                </Link>
                <button
                  className="p-2 rounded-xl bg-slate-50 dark:bg-red-900/10 text-slate-600 dark:text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-sans"
                  onClick={logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-all px-4",
                    isScrolled ? "text-slate-600 dark:text-slate-400 hover:text-primary-600" : "text-white hover:text-primary-200"
                  )}
                >
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20">
                  Khám phá ngay
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600 dark:text-slate-400"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu className={isScrolled ? "text-slate-900 dark:text-white" : "text-white"} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-lg p-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors",
                isActive ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}