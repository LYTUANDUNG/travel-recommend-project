import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, User, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, loginAsUser, loginAsGuest, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

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
    { name: 'Gợi ý', path: '/recommend' },
    { name: 'Bài viết', path: '/blog' },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600 p-2 rounded-lg text-white group-hover:bg-primary-700 transition-colors">
              <MapPin className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-2xl font-serif font-bold transition-colors",
              isScrolled ? "text-slate-900" : "text-white"
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
                  "text-sm font-medium transition-colors hover:text-primary-500",
                  isActive ? "text-primary-500 font-semibold" : isScrolled ? "text-slate-600" : "text-white/90"
                )}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:block">Hi, {user?.full_name}</span>
                <Link to="/profile" className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600" title="Hồ sơ cá nhân">
                  <User className="w-5 h-5" />
                </Link>
                <button
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isScrolled ? "text-slate-600 hover:text-primary-600" : "text-white hover:text-primary-200"
                  )}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Debug / Demo Toggle (Temporary) */}
          <div className="hidden lg:flex fixed bottom-5 right-5 z-50 bg-white shadow-xl p-2 rounded-lg border border-slate-200">
            <button
              onClick={() => isAuthenticated ? loginAsGuest() : loginAsUser()}
              className="text-xs font-mono font-bold text-primary-600 hover:underline"
            >
              Toggle: {isAuthenticated ? 'User Mode' : 'Guest Mode'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu className={isScrolled ? "text-slate-900" : "text-white"} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-lg p-4 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-primary-50 text-primary-600" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {link.name}
            </NavLink>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          <Link to="/login" className="px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Đăng nhập</Link>
          <Link to="/register" className="px-4 py-3 bg-primary-600 text-white text-center font-medium rounded-lg hover:bg-primary-700">Đăng ký</Link>
        </div>
      )}
    </header>
  );
}