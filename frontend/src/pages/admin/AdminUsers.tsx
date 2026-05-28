import { useState, useEffect } from 'react';
import { api } from '../../api';
import { User } from '../../types/schema';
import { Trash2, Shield, User as UserIcon, Mail, Calendar, Search, Lock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const size = 10;

    const fetchUsers = async () => {
        setLoading(true);
        // Using getPaginated endpoint for users (added in realClient.ts if not exists)
        // Note: I added /api/users/paginated to the backend.
        // Let's ensure realClient has a matching method.
        try {
            const res = await api.client.get('/users/paginated', {
                params: { query: searchQuery, page, size }
            });
            if (res.data.success) {
                setUsers(res.data.data.content || []);
                setTotalPages(res.data.data.total_pages ?? res.data.data.totalPages ?? 0);
                setTotalElements(res.data.data.total_elements ?? res.data.data.totalElements ?? 0);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchQuery]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa User này?")) return;

        const res = await api.user.delete(id);
        if (res.success) {
            fetchUsers();
        } else {
            alert("Lỗi khi xóa: " + res.message);
        }
    };

    const handleStatusToggle = async (user: User) => {
        const newStatus = !user.is_active;
        const res = await api.user.updateStatus(user.user_id, newStatus);
        if (res.success) {
            fetchUsers();
        } else {
            alert("Lỗi: " + res.message);
        }
    };

    const handleRoleToggle = async (user: User) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!confirm(`Bạn có muốn chuyển ${user.full_name} thành ${newRole}?`)) return;
        
        const res = await api.user.updateRole(user.user_id, newRole);
        if (res.success) {
            fetchUsers();
        } else {
            alert("Lỗi: " + res.message);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Người dùng</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Hệ thống đang quản lý {totalElements} thành viên.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px] relative">
                    {loading && (
                         <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                         </div>
                    )}
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-black">
                                <th className="px-8 py-5">Thành viên</th>
                                <th className="px-8 py-5">Vai trò</th>
                                <th className="px-8 py-5">Ngày tham gia</th>
                                <th className="px-8 py-5 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {users.map((u) => (
                                <tr key={u.user_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <UserIcon className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">{u.full_name}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                                    <Mail className="w-3 h-3" />
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {u.role === 'ADMIN' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                                                <Shield className="w-3 h-3" /> Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                                                <UserIcon className="w-3 h-3" /> User
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Calendar className="w-3.5 h-3.5 text-orange-400" />
                                            {u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button 
                                                onClick={() => handleRoleToggle(u)}
                                                className={cn(
                                                    "p-2 rounded-xl transition-all",
                                                    u.role === 'ADMIN' ? "text-orange-600 bg-orange-50" : "text-slate-400 hover:text-orange-600 hover:bg-slate-50"
                                                )}
                                                title="Đổi quyền hạn"
                                            >
                                                <Shield className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleStatusToggle(u)}
                                                className={cn(
                                                    "p-2 rounded-xl transition-all",
                                                    u.is_active ? "text-slate-400 hover:text-orange-600 hover:bg-orange-50" : "text-rose-600 bg-rose-50"
                                                )}
                                                title={u.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                            >
                                                <Lock className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.user_id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
                                                disabled={u.role === 'ADMIN'}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Trang {page + 1} / {totalPages || 1}
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
