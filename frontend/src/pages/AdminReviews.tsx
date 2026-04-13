import { useState, useEffect } from 'react';
import { api } from '../api';
import { Review } from '../types/schema';
import { Trash2, Loader2, Star, MessageSquare, MapPin, Calendar, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchReviews = async () => {
        setLoading(true);
        // Assuming api.review.getAll() exists or we use a custom endpoint
        try {
            const res = await api.client.get('/admin/reviews');
            if (res.data.success) {
                setReviews(res.data.data || []);
            }
        } catch (err) {
            console.error("Lỗi load review", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa Bình luận này?")) return;
        try {
            const res = await api.client.delete(`/admin/reviews/${id}`);
            if (res.data.success) {
                fetchReviews();
            }
        } catch (err) {
            alert("Lỗi khi xóa bình luận");
        }
    };

    const filteredReviews = reviews.filter(r => 
        r.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 flex justify-center items-center h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Kiểm duyệt Bình luận</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Bình luận từ người dùng là dữ liệu quan trọng cho thuật toán gợi ý (CF/CBF).</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden outline outline-4 outline-slate-50 dark:outline-slate-950">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm nội dung, địa điểm hoặc người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-colors">
                            <Filter className="w-3 h-3" /> Lọc xếp hạng
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-black">
                                <th className="px-8 py-5">Người dùng / Địa điểm</th>
                                <th className="px-8 py-5">Nội dung bình luận</th>
                                <th className="px-8 py-5">Đánh giá</th>
                                <th className="px-8 py-5">Thời gian</th>
                                <th className="px-8 py-5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold">Chưa có bình luận nào cần xử lý.</td>
                                </tr>
                            ) : filteredReviews.map((r) => (
                                <tr key={r.review_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200">
                                                    <span className="text-[10px]">{r.user_name?.charAt(0)}</span>
                                                </div>
                                                {r.user_name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-primary-600 font-bold">
                                                <MapPin className="w-3 h-3" />
                                                {r.location_name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 max-w-md">
                                        <div className="flex gap-2">
                                            <MessageSquare className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-2">"{r.content}"</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1 text-amber-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                                            ))}
                                            <span className="ml-2 font-black text-slate-900 dark:text-white">{r.rating}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(r.review_id)}
                                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all"
                                            title="Xóa bình luận"
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
    );
}
