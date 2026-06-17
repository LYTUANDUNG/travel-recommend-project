import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    Home, 
    Compass, 
    Calendar, 
    Map, 
    BookOpen,
    Users,
    Sparkles,
    User, 
    LogOut, 
    Sun, 
    Moon, 
    Menu, 
    X,
    ChevronDown,
    Settings
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { Button } from './ui/Button';

export default function Layout() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const sidebarLinks = [
        { path: '/', name: 'Trang chủ', icon: Home },
        { path: '/explore', name: 'Khám phá', icon: Compass },
        { path: '/ai-recommend', name: 'Gợi ý cho bạn', icon: Sparkles },
        { path: '/planner', name: 'Tạo lịch trình', icon: Calendar },
        { path: '/map', name: 'Bản đồ', icon: Map },
        { path: '/blog', name: 'Cẩm nang du lịch', icon: BookOpen },
        { path: '/contact', name: 'Liên hệ', icon: Users },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Fetch user favorites once globally
    useEffect(() => {
        if (isAuthenticated && user?.user_id) {
            useFavoriteStore.getState().fetchFavorites(user.user_id);
        }
    }, [isAuthenticated, user]);

    // Close dropdowns on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
            {/* ==================================================== */}
            {/* 1. LEFT STICKY SIDEBAR (DESKTOP)                     */}
            {/* ==================================================== */}
            <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/80 fixed top-0 bottom-0 left-0 z-40 hidden lg:flex flex-col justify-between p-6 shadow-sm">
                <div className="flex flex-col gap-8">
                    {/* Brand/Logo */}
                    <Link to="/" className="flex items-center gap-3 px-2 h-10">
                        <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                            <Compass className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                            VinaTravel<span className="text-primary-500">.</span>
                        </span>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-1">
                        {sidebarLinks.map((link) => {
                            const IconComponent = link.icon;
                            const isActive = location.pathname === link.path || 
                                (link.path !== '/' && location.pathname.startsWith(link.path));

                            return (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 group
                                        ${isActive 
                                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 shadow-sm shadow-primary-500/5' 
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'
                                        }`}
                                >
                                    <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110
                                        ${isActive ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} 
                                    />
                                    <span>{link.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Desktop Sidebar Footer */}
                {!isAuthenticated && (
                    <div className="border-t border-slate-150 dark:border-slate-800/80 pt-5">
                        <Button 
                            variant="primary" 
                            fullWidth 
                            onClick={() => navigate('/login')}
                            className="shadow-md"
                        >
                            Đăng nhập
                        </Button>
                    </div>
                )}
            </aside>

            {/* ==================================================== */}
            {/* 2. MAIN CONTENT AREA WITH STICKY TOPBAR HEADER       */}
            {/* ==================================================== */}
            <div className="flex-1 flex flex-col lg:pl-72 min-w-0 min-h-screen">
                {/* Sticky Topbar Header */}
                <header className="sticky top-0 z-30 w-full h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 px-6 lg:px-8 flex items-center justify-between transition-colors duration-300">
                    
                    {/* Mobile Menu & Logo Bar */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-md font-black">
                                <Compass className="w-4 h-4" />
                            </div>
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">VinaTravel<span className="text-primary-500">.</span></span>
                        </Link>
                    </div>

                    {/* Spacer to align buttons right */}
                    <div className="flex-1" />

                    {/* Action Panel: Theme toggle & Avatar Dropdown */}
                    <div className="flex items-center gap-4">
                        {/* Dark/Light Switch */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300"
                            title="Đổi giao diện Sáng/Tối"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>

                        {/* User Profile Avatar Dropdown */}
                        {isAuthenticated && user ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                                >
                                    <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <img 
                                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=random`} 
                                            alt={user.full_name} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-lg z-50 p-2 py-3 animate-in fade-in slide-in-from-top-3 duration-250">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.full_name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors">
                                            <User className="w-4 h-4" /> Hồ sơ cá nhân
                                        </Link>
                                        {user.role === 'ADMIN' && (
                                            <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors">
                                                <Settings className="w-4 h-4" /> Bảng quản trị
                                            </Link>
                                        )}
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Resolved mobile layout login bug: removed hidden class and replaced with sleek layout responsive wrapper
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => navigate('/login')}
                                className="shadow-md hidden sm:inline-flex"
                            >
                                Đăng nhập
                            </Button>
                        )}
                    </div>
                </header>

                {/* Mobile Dropdown Menu Drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800 p-4 flex flex-col gap-1.5 shadow-md animate-in slide-in-from-top duration-300">
                        {sidebarLinks.map((link) => {
                            const IconComponent = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors
                                        ${isActive 
                                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }`}
                                >
                                    <IconComponent className="w-4.5 h-4.5" />
                                    <span>{link.name}</span>
                                </NavLink>
                            );
                        })}
                        
                        {/* Mobile Login / User Profile integration to fix UX bugs */}
                        <div className="border-t border-slate-100 dark:border-slate-800/80 mt-2 pt-3">
                            {isAuthenticated && user ? (
                                <div className="flex flex-col gap-1">
                                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300">
                                        <img 
                                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=random`} 
                                            alt={user.full_name} 
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold truncate">{user.full_name}</span>
                                            <span className="text-[9px] text-slate-400 capitalize">{user.role?.toLowerCase()}</span>
                                        </div>
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25"
                                    >
                                        <LogOut className="w-4.5 h-4.5" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            ) : (
                                <Button 
                                    variant="primary" 
                                    size="sm"
                                    fullWidth
                                    onClick={() => navigate('/login')}
                                >
                                    Đăng nhập
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Central main page content container */}
                <div className="flex-1 w-full max-w-[1680px] mx-auto px-4 lg:px-8 py-8">
                    <main className="w-full min-w-0">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
