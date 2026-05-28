import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MapPin,
    MessageSquare,
    Tag,
    Image as ImageIcon,
    Settings,
    LogOut,
    Map as MapIcon,
    BookOpen,
    ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const menu = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
        { path: '/admin/locations', icon: ImageIcon, label: 'Địa điểm' },
        { path: '/admin/add-location', icon: MapPin, label: 'Thêm địa điểm' },
        { path: '/admin/visits', icon: Users, label: 'Yêu cầu tham quan' },
        { path: '/admin/users', icon: Users, label: 'Người dùng' },
        { path: '/admin/reviews', icon: MessageSquare, label: 'Đánh giá' },
        { path: '/admin/blogs', icon: BookOpen, label: 'Bài viết' },
        { path: '/admin/categories', icon: Tag, label: 'Danh mục' },
        { path: '/admin/gis-scanner', icon: MapIcon, label: 'Công cụ GIS' },
        { path: '/admin/banners', icon: ImageIcon, label: 'Banner' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
                <div className="h-20 px-7 flex items-center border-b border-slate-100 dark:border-slate-800">
                    <Link to="/admin/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black tracking-tight">VinaTravel</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">Admin console</div>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
                    {menu.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                                    isActive
                                        ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/25 dark:text-orange-400'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 flex items-center gap-3">
                        <img
                            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'Admin'}&background=random`}
                            alt="Admin"
                            className="w-9 h-9 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                            <div className="text-sm font-black truncate">{user?.full_name || 'Admin'}</div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{user?.role || 'ADMIN'}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Về trang chính
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="flex-1 lg:pl-72 min-w-0">
                <header className="sticky top-0 z-30 h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">Quản trị hệ thống</div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Dữ liệu, nội dung và vận hành VinaTravel</div>
                    </div>
                </header>

                <div className="w-full max-w-[1680px] mx-auto px-4 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
