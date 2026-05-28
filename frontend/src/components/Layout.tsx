import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    Home, 
    Compass, 
    Heart, 
    Calendar, 
    Map, 
    Users, 
    BookOpen,
    Sparkles,
    Search, 
    MapPin, 
    User, 
    LogOut, 
    Sun, 
    Moon, 
    Menu, 
    X,
    ChevronDown,
    Settings,
    Activity
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import JMeterVConsole from './JMeterVConsole';

export default function Layout() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState('Hồ Chí Minh');
    const [selectedWard, setSelectedWard] = useState('');

    const sidebarLinks = [
        { path: '/', name: 'Trang chủ', icon: Home },
        { path: '/explore', name: 'Khám phá', icon: Compass },
        { path: '/ai-recommend', name: 'Gợi ý AI', icon: Sparkles },
        { path: '/planner', name: 'Tạo lịch trình', icon: Calendar },
        { path: '/map', name: 'Bản đồ', icon: Map },
        { path: '/blog', name: 'Blog du lịch', icon: BookOpen },
        { path: '/contact', name: 'Đội ngũ liên hệ', icon: Users },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/explore?q=${searchQuery.trim()}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Close dropdowns on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
            {/* ==================================================== */}
            {/* 1. LEFT STICKY SIDEBAR (DESKTOP)                     */}
            {/* ==================================================== */}
            <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200/70 dark:border-slate-800 fixed top-0 bottom-0 left-0 z-40 hidden lg:flex flex-col justify-between p-5">
                <div className="flex flex-col gap-6">
                    {/* Brand/Logo (VinaTravel theme) */}
                    <Link to="/" className="flex items-center gap-3 px-2 h-14">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Compass className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                            VinaTravel<span className="text-orange-500">.</span>
                        </span>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-1">
                        {sidebarLinks.map((link) => {
                            const IconComponent = link.icon;
                            // Custom active check
                            const isActive = location.pathname === link.path || 
                                (link.path !== '/' && location.pathname.startsWith(link.path));

                            return (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors group
                                        ${isActive 
                                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' 
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-105
                                        ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} 
                                    />
                                    <span>{link.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                <div className="hidden">
                    {isAuthenticated && user ? (
                        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <Link to="/profile" className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700 overflow-hidden shrink-0">
                                    <img 
                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=random`} 
                                        alt={user.full_name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.full_name}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">{user.role?.toLowerCase()}</span>
                                </div>
                            </Link>
                            
                            {user.role === 'ADMIN' && (
                                <Link to="/admin/dashboard" className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform" title="Admin Control Panel">
                                    <Settings className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    ) : (
                        <Link 
                            to="/login" 
                            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-center text-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-md transition-all active:scale-[0.98]"
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </aside>

            {/* ==================================================== */}
            {/* 2. MAIN CONTENT AREA (WITH RIGHT/LEFT AD GUTTERS)    */}
            {/* ==================================================== */}
            <div className="flex-1 flex flex-col lg:pl-72 min-w-0 min-h-screen">
                {/* Sticky Topbar Header */}
                <header className="sticky top-0 z-30 w-full h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between transition-colors duration-300">
                    
                    {/* Mobile Menu & Logo Bar */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <Link to="/" className="flex items-center gap-1.5">
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">VinaTravel<span className="text-orange-500">.</span></span>
                        </Link>
                    </div>

                    {/* Header spacer to replace removed search bar and align layout */}
                    <div className="flex-1" />

                    {/* Action Panel: Theme toggle & Avatar Dropdown */}
                    <div className="flex items-center gap-4">
                        {/* Dark/Light Switch */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Đổi giao diện Sáng/Tối"
                        >
                            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                        </button>

                        {/* User Profile Avatar Dropdown */}
                        {isAuthenticated && user ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <img 
                                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=random`} 
                                            alt={user.full_name} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 py-3 animate-in fade-in slide-in-from-top-3 duration-200">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.full_name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                                            <User className="w-4 h-4" /> Hồ sơ cá nhân
                                        </Link>
                                        {user.role === 'ADMIN' && (
                                            <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                                                <Settings className="w-4 h-4" /> Bảng quản trị (Admin)
                                            </Link>
                                        )}
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link 
                                to="/login" 
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors hidden sm:block shrink-0 shadow-md shadow-blue-600/10"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </header>

                {/* Mobile Dropdown Menu Drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 p-4 flex flex-col gap-1.5 animate-in slide-in-from-top duration-300">
                        {/* Removed search mobile */}
                        
                        {sidebarLinks.map((link) => {
                            const IconComponent = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors
                                        ${isActive 
                                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }`}
                                >
                                    <IconComponent className="w-4.5 h-4.5" />
                                    <span>{link.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                )}

                {/* ==================================================== */}
                {/* 3. ADVERTISEMENT GUTTERS DESIGN SYSTEM               */}
                {/* ==================================================== */}
                {/* This core structure uses a standard grid layout.     */}
                {/* On widescreen, the content sits in the middle (cols 9), */}
                {/* leaving left/right areas perfectly reserved for     */}
                {/* sidebar banner advertisements!                       */}
                <div className="flex-1 w-full max-w-[1680px] mx-auto px-4 lg:px-8 py-8">
                    {/* Central main page content container (Full width) */}
                    <main className="w-full min-w-0">
                        <Outlet />
                    </main>
                </div>
            </div>
            {/* Floating JMeter & AI Console plugin like vConsole */}
            <JMeterVConsole />
        </div>
    );
}
