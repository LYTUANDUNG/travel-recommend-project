import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useNavigate } from 'react-router-dom';
import { Location } from '../../types/schema';
import { Trash2, Edit, MapPin, Loader2, Image as ImageIcon, Search, Plus, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function AdminLocations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const size = 10;
    
    const navigate = useNavigate();

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await api.location.getPaginated({ 
                query: searchQuery,
                page, 
                size 
            });
            if (res) {
                const apiRes = res.data && ('success' in res.data) ? res.data : res;
                if (apiRes.success && apiRes.data) {
                    const pageData = apiRes.data;
                    setLocations(pageData.content || []);
                    setTotalPages(pageData.total_pages ?? pageData.totalPages ?? 0);
                    setTotalElements(pageData.total_elements ?? pageData.totalElements ?? 0);
                }
            }
        } catch (error) {
            console.error("Lỗi tải địa điểm:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLocations();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [page, searchQuery]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) return;

        const res = await api.location.delete(id);
        if (res.success) {
            fetchLocations();
        } else {
            alert("Lỗi khi xóa: " + res.message);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Quản lý Địa điểm</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Hệ thống đang hiển thị {totalElements} địa điểm du lịch.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/admin/add-location')}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm địa điểm mới
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0); // Reset page on search
                            }}
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trang {page + 1} / {totalPages || 1}</span>
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
                            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-bold">
                                <th className="px-8 py-5">Địa điểm</th>
                                <th className="px-8 py-5 text-center">Đánh giá</th>
                                <th className="px-8 py-5">Phân loại</th>
                                <th className="px-8 py-5">Ngân sách</th>
                                <th className="px-8 py-5 text-right w-40">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {locations.map((loc) => (
                                <tr key={loc.location_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                                {loc.thumbnail_url ? (
                                                    <img src={loc.thumbnail_url} alt={loc.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-orange-600 transition-colors">{loc.name}</h4>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[200px]">{loc.address || loc.province || "---"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white">
                                                <span className="text-amber-500 text-lg">★</span>
                                                {loc.average_rating?.toFixed(1) || "0.0"}
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{loc.total_reviews || 0} reviews</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-100 dark:border-orange-800/30">
                                            {loc.category_name || "Tourism"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                            {loc.price_range_str || "---"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <button 
                                                onClick={() => navigate(`/location/${loc.location_id}`)}
                                                className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/admin/edit-location/${loc.location_id}`)}
                                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl transition-all"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(loc.location_id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
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

                {/* Pagination UI */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Hiển thị {locations.length} / {totalElements} kết quả
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
