import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, MessageSquare, Tag, Image as ImageIcon, Settings, LogOut, Map as MapIcon, QrCode, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const menu = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Thống kê Tổng quan' },
        { path: '/admin/locations', icon: ImageIcon, label: 'Kho Địa điểm' },
        { path: '/admin/add-location', icon: MapPin, label: 'Thêm Địa điểm' },
        { path: '/admin/visits', icon: Users, label: 'Yêu cầu Tham quan' },
        { path: '/admin/users', icon: Users, label: 'Người dùng' },
        { path: '/admin/reviews', icon: MessageSquare, label: 'Đánh giá & Phản hồi' },
        { path: '/admin/blogs', icon: BookOpen, label: 'Quản lý Bài viết' },
        { path: '/admin/categories', icon: Tag, label: 'Danh mục & Phân loại' },
        { path: '/admin/gis-scanner', icon: MapIcon, label: 'Công cụ GIS' },
        { path: '/admin/banners', icon: ImageIcon, label: 'Banners Quảng cáo' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/40">
            {/* Sidebar with Glassmorphism */}
            <aside className="w-80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border-r border-slate-200/40 dark:border-slate-800 hidden lg:flex flex-col fixed h-full z-40 transition-all duration-500 group/side">
                <div className="p-10">
                    <div className="flex items-center gap-4 transition-transform duration-300 group-hover/side:translate-x-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/20 border border-white/20">
                            <Settings className="w-6 h-6 text-white animate-spin-slow" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">
                                Administrator
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">System Online</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar pt-2">
                    {menu.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-bold transition-all duration-300 group/item relative
                ${isActive
                                     ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xl shadow-slate-900/20 dark:shadow-none translate-x-2'
                                     : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'}`
                            }
                        >
                            <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover/item:scale-110`} />
                            <span className="text-sm tracking-tight">{item.label}</span>
                            
                            {/* Accent Dot for Active */}
                            <NavLink to={item.path} className={({isActive}) => isActive ? "absolute left-2 w-1.5 h-1.5 bg-primary-500 rounded-full" : "hidden"} />
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 space-y-3">
                    <div className="p-4 bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-4">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-2">Connected as</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-600 shadow-sm">
                                <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'Admin'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.full_name || 'Admin User'}</p>
                                <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role?.toLowerCase() || 'Administrator'}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                    >
                        Về Trang chủ
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-80 relative min-h-screen">
                {/* Modern Admin Topbar */}
                <header className="sticky top-0 z-30 w-full h-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md px-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm font-bold">
                        <span className="hover:text-primary-600 transition-colors cursor-pointer">Admin</span>
                        <span>/</span>
                        <span className="text-slate-900 dark:text-white capitalize">Dashboard</span>
                    </div>
                </header>
                
                <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
