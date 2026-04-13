import { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Location } from '../types/schema';
import { Trash2, Edit, MapPin, Loader2, Image as ImageIcon, Search, Plus, Filter, MoreVertical, ExternalLink } from 'lucide-react';

export default function AdminLocations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const fetchLocations = async () => {
        setLoading(true);
        const res = await api.location.getAll();
        if (res.success) {
            setLocations(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) return;

        const res = await api.location.delete(id);
        if (res.success) {
            fetchLocations();
        } else {
            alert("Lỗi khi xóa: " + res.message);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm(`CẢNH BÁO ĐỎ: Xóa toàn bộ ${locations.length} địa điểm trên hệ thống? Hành động này rất nguy hiểm và không thể khôi phục!`)) return;
        setLoading(true);
        let errorCount = 0;
        for (const loc of locations) {
            try {
                await api.location.delete(loc.location_id);
            } catch (e) {
                errorCount++;
            }
        }
        if (errorCount > 0) alert(`Hoàn tất, nhưng có ${errorCount} địa điểm lỗi không thể xóa.`);
        else alert("Đã dọn dẹp sạch sẽ toàn bộ dữ liệu địa điểm!");
        fetchLocations();
    };

    const filteredLocations = locations.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 flex justify-center h-[400px] items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Quản lý Địa điểm</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Danh sách các điểm đến, nhà hàng và khách sạn trên hệ thống.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleDeleteAll}
                        disabled={locations.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold transition-all disabled:opacity-50"
                    >
                        <Trash2 className="w-5 h-5" />
                        Xóa tất cả
                    </button>
                    <button 
                        onClick={() => navigate('/admin/add-location')}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm địa điểm mới
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden outline outline-4 outline-slate-50 dark:outline-slate-950">
                {/* Table Header / Filters */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-black">
                                <th className="px-8 py-5">Địa điểm</th>
                                <th className="px-8 py-5 text-center">Đánh giá</th>
                                <th className="px-8 py-5">Phân loại</th>
                                <th className="px-8 py-5 text-right w-40">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredLocations.map((loc) => (
                                <tr key={loc.location_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 group-hover:scale-105 transition-transform duration-300">
                                                {loc.thumbnail_url ? (
                                                    <img src={loc.thumbnail_url} alt={loc.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{loc.name}</h4>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[200px]">{loc.province || "Đà Nẵng"}</span>
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
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{loc.total_reviews} reviews</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-tighter ring-1 ring-indigo-100 dark:ring-indigo-800/30">
                                            {loc.category_name || "Tourism"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <button 
                                                onClick={() => navigate(`/detail/${loc.location_id}`)}
                                                className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all"
                                                title="Xem trang User"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/admin/edit-location/${loc.location_id}`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
                                                title="Sửa"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(loc.location_id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLocations.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Search className="w-12 h-12 mb-4" />
                                            <p className="text-lg font-bold text-slate-500">Không tìm thấy địa điểm nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
