import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, MessageSquare, Tag, Image, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const menu = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Thống kê (Dashboard)' },
        { path: '/admin/add-location', icon: MapPin, label: 'Thêm Địa điểm mới' },
        { path: '/admin/locations', icon: Image, label: 'Quản lý Địa điểm' },
        { path: '/admin/users', icon: Users, label: 'Quản lý Người dùng' },
        { path: '/admin/reviews', icon: MessageSquare, label: 'Kiểm duyệt Đánh giá' },
        { path: '/admin/tags', icon: Tag, label: 'Quản lý Bộ lọc (Tags)' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden sm:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl flex items-center gap-2 font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                        <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Trang Quản Trị
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hello, {user?.full_name || 'Admin'}!</p>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {menu.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'}`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mb-2"
                    >
                        Về Trang chủ User
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content (Shifted right for Sidebar) */}
            <main className="flex-1 sm:ml-64 relative min-h-screen">
                <Outlet />
            </main>
        </div>
    );
}
