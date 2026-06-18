import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import { useNavigate } from 'react-router-dom';
import { encodeId } from '../../utils/obfuscate';
import { Location } from '../../types/schema';
import { Trash2, Edit, MapPin, Loader2, Image as ImageIcon, Search, Plus, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function AdminLocations() {
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Retrieve initial state from sessionStorage to persist navigation context
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('admin_locations_search') || '');
    const [filterType, setFilterType] = useState<string>(() => sessionStorage.getItem('admin_locations_filter') || 'all');
    const [page, setPage] = useState(() => {
        const saved = sessionStorage.getItem('admin_locations_page');
        return saved ? parseInt(saved, 10) : 0;
    });
    
    const size = 10;
    const navigate = useNavigate();

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await api.location.getAll();
            if (res && res.success && Array.isArray(res.data)) {
                setAllLocations(res.data);
            }
        } catch (error) {
            console.error("Lỗi tải địa điểm:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    // Filter and sort locations locally
    const filteredAndSortedLocations = useMemo(() => {
        let result = [...allLocations];

        // 1. Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(loc => 
                (loc.name || '').toLowerCase().includes(query) || 
                (loc.address || '').toLowerCase().includes(query) ||
                (loc.province || '').toLowerCase().includes(query) ||
                (loc.category_name || '').toLowerCase().includes(query)
            );
        }

        // 2. Image status filter (Check for null/empty or fallback placeholders)
        if (filterType === 'no-image') {
            result = result.filter(loc => {
                const url = loc.thumbnail_url || '';
                return !url || 
                    url.trim() === '' || 
                    url.includes('photo-1555436169-20d9321f98c6') || 
                    url.includes('photo-1542314831-068cd1dbfeeb');
            });
        }

        // 3. Newly added sort (descending ID)
        if (filterType === 'newly-added') {
            result.sort((a, b) => b.location_id - a.location_id);
        } else {
            // Default: sort ascending ID
            result.sort((a, b) => a.location_id - b.location_id);
        }

        return result;
    }, [allLocations, searchQuery, filterType]);

    // Cache states in sessionStorage
    useEffect(() => {
        sessionStorage.setItem('admin_locations_search', searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        sessionStorage.setItem('admin_locations_filter', filterType);
    }, [filterType]);

    useEffect(() => {
        sessionStorage.setItem('admin_locations_page', String(page));
    }, [page]);

    // Paginated elements
    const totalElements = filteredAndSortedLocations.length;
    const totalPages = Math.ceil(totalElements / size);
    
    // Safeguard page bounds
    const activePage = Math.max(0, Math.min(page, totalPages - 1));
    
    const paginatedLocations = useMemo(() => {
        return filteredAndSortedLocations.slice(activePage * size, (activePage + 1) * size);
    }, [filteredAndSortedLocations, activePage, size]);

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
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Hệ thống đang hiển thị {allLocations.length} địa điểm du lịch.</p>
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
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Tìm theo tên hoặc địa chỉ..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(0); // Reset page on query change
                                }}
                                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                            />
                        </div>
                        
                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl">
                            <button
                                onClick={() => { setFilterType('all'); setPage(0); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => { setFilterType('no-image'); setPage(0); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'no-image' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                            >
                                Chưa có ảnh
                            </button>
                            <button
                                onClick={() => { setFilterType('newly-added'); setPage(0); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'newly-added' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                            >
                                Mới thêm
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-slate-450 uppercase tracking-widest">Trang {totalPages > 0 ? activePage + 1 : 1} / {totalPages || 1}</span>
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
                            {paginatedLocations.map((loc) => (
                                <tr key={loc.location_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                                {loc.thumbnail_url && !loc.thumbnail_url.includes('photo-1555436169-20d9321f98c6') && !loc.thumbnail_url.includes('photo-1542314831-068cd1dbfeeb') ? (
                                                    <img src={loc.thumbnail_url} alt={loc.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-rose-400 bg-rose-50 dark:bg-rose-950/20 font-bold text-[10px] uppercase text-center p-1">
                                                        Chưa có ảnh
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
                                                onClick={() => navigate(`/location/${encodeId(loc.location_id)}`)}
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
                        Hiển thị {paginatedLocations.length} / {totalElements} kết quả
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={activePage === 0}
                            onClick={() => setPage(activePage - 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            disabled={activePage >= totalPages - 1}
                            onClick={() => setPage(activePage + 1)}
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
