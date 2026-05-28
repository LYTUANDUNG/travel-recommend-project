import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Trash2, Loader2, Plus, LayoutGrid, Info, Search } from 'lucide-react';

export default function AdminCategories() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        const res = await api.category.getAll();
        if (res.success) {
            setCategories(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Xóa danh mục này có thể ảnh hưởng đến các địa điểm liên quan. Tiếp tục?")) return;
        const res = await api.category.delete(id);
        if (res.success) {
            fetchCategories();
        } else {
            alert("Lỗi khi xóa.");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        const res = await api.category.create({ name: newName, description: newDesc });
        if (res.success) {
            setNewName('');
            setNewDesc('');
            fetchCategories();
        } else {
            alert("Lỗi khi tạo.");
        }
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <LayoutGrid className="w-8 h-8 text-orange-600" />
                    Quản lý Danh mục
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Tổ chức các địa điểm vào các nhóm chức năng (Nhà hàng, Khách sạn, v.v.).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Add Category */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 font-bold text-xl">
                            +
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Tạo Danh mục</h2>
                        <p className="text-sm text-slate-500 mb-8 font-medium italic">Phân nhóm địa điểm mới</p>
                        
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Tên Danh mục</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                    placeholder="Ví dụ: Ẩm thực, Lưu trú..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Mô tả ngắn</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    className="w-full px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400"
                                    rows={3}
                                    placeholder="Mô tả cho danh mục này..."
                                />
                            </div>
                            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-100 dark:shadow-none active:scale-95 flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Xác nhận tạo
                            </button>
                        </form>
                    </div>
                </div>

                {/* Table Categories */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-orange-600" /> Toàn bộ danh mục
                            </h3>
                            <span className="text-xs font-bold text-slate-400">{categories.length} mục</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-bold">
                                        <th className="px-8 py-5">Tên & Mô tả</th>
                                        <th className="px-8 py-5 w-24 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-8 py-20 text-center text-slate-500 font-bold">Chưa có danh mục nào.</td>
                                        </tr>
                                    ) : categories.map((c) => (
                                        <tr key={c.category_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400 transition-transform">
                                                        <LayoutGrid className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none group-hover:text-orange-600 transition-colors uppercase">{c.name}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 max-w-sm italic">
                                                            {c.description || 'Không có mô tả cho danh mục này.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button 
                                                    onClick={() => handleDelete(c.category_id)} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
