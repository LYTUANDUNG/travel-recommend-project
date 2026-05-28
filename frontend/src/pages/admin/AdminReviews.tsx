import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Review } from '../../types/schema';
import { Loader2, Star, MessageSquare, MapPin, Calendar, Search, Trash2, ShieldCheck, ShieldAlert, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.client.get('/reviews/paginated', {
                params: { query: searchQuery, page, size: pageSize }
            });
            if (res) {
                const apiRes = res.data && ('success' in res.data) ? res.data : res;
                if (apiRes.success && apiRes.data) {
                    const pageData = apiRes.data;
                    setReviews(pageData.content || []);
                    setTotalPages(pageData.total_pages ?? pageData.totalPages ?? 0);
                    setTotalElements(pageData.total_elements ?? pageData.totalElements ?? 0);
                }
            }
        } catch (err) {
            console.error("Lỗi load review", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReviews();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [page, searchQuery]);

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const res = await api.client.put(`/reviews/${id}/status`, { status });
            if (res.data.success) {
                fetchReviews();
            } else {
                alert("Lỗi: " + res.data.message);
            }
        } catch (err: any) {
            alert("Lỗi khi cập nhật trạng thái: " + (err?.response?.data?.message || err?.message || 'Unknown'));
        }
    };

    const handleDeleteReview = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này khỏi CSDL? Hành động này sẽ cập nhật ma trận tương tác của hệ thống AI.")) return;
        try {
            const res = await api.client.delete(`/reviews/${id}`);
            if (res.data.success || res.status === 200) {
                fetchReviews();
            } else {
                alert("Lỗi khi xóa đánh giá");
            }
        } catch (err: any) {
            alert("Lỗi: " + (err?.response?.data?.message || err?.message));
        }
    };

    if (loading) return (
        <div className="p-8 flex flex-col justify-center items-center h-[400px] gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <span className="text-xs font-bold text-slate-450 uppercase tracking-widest animate-pulse">Đang tải dữ liệu bình luận từ CSDL...</span>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                         <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Feedback Moderation Center
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Kiểm duyệt <span className="text-orange-500">Bình luận.</span>
                    </h1>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-semibold">
                        Bình luận và chấm sao trực tiếp cập nhật CSDL MySQL giúp thuật toán phân tách AI (CF/CBF) học lại hành vi.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm nội dung bình luận, tên địa điểm hoặc tên người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 transition-all outline-none shadow-inner"
                        />
                    </div>
                    
                    <div className="text-xs font-bold text-slate-400 bg-slate-100/50 dark:bg-slate-800/60 px-4 py-2 rounded-xl">
                        Tổng cộng: <span className="text-orange-500 font-black">{totalElements}</span> bình luận thực tế
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[9px] font-black">
                                <th className="px-6 py-5">Người dùng / Địa điểm</th>
                                <th className="px-6 py-5">Nội dung bình luận</th>
                                <th className="px-6 py-5">Đánh giá sao</th>
                                <th className="px-6 py-5">Trạng thái CSDL</th>
                                <th className="px-6 py-5">Thời điểm</th>
                                <th className="px-6 py-5 text-right">Thao tác duyệt nhanh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold italic">Chưa có bình luận nào khớp với tìm kiếm.</td>
                                </tr>
                            ) : reviews.map((r) => {
                                const currentStatus = r.verify_status || r.verifyStatus || 'PENDING';
                                return (
                                    <tr key={r.review_id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition duration-200">
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="font-extrabold text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-[10px]">
                                                        {r.user_name?.charAt(0) || 'U'}
                                                    </div>
                                                    {r.user_name || 'Người dùng'}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                                                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{r.location_name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 max-w-xs">
                                            <div className="flex gap-2">
                                                <MessageSquare className="w-4 h-4 text-slate-350 shrink-0 mt-0.5" />
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-2">
                                                    "{r.comment || r.content || 'Không có bình luận chữ'}"
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-0.5 text-amber-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-100 dark:text-slate-800'}`} />
                                                ))}
                                                <span className="ml-1.5 font-mono font-black text-slate-850 dark:text-white text-xs">{r.rating} sao</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {currentStatus === 'APPROVED' ? (
                                                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                    Đã phê duyệt
                                                </span>
                                            ) : currentStatus === 'HIDDEN' ? (
                                                <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/30 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                                    <ShieldAlert className="w-3 h-3 text-rose-500" />
                                                    Đã ẩn hiển thị
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                                    Chờ phê duyệt
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-slate-400">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                                                <Calendar className="w-3.5 h-3.5 text-slate-350" />
                                                {r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2 items-center">
                                                {/* Approve / Duyệt */}
                                                <button
                                                    onClick={() => handleUpdateStatus(r.review_id, 'APPROVED')}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                                                        currentStatus === 'APPROVED'
                                                            ? "bg-emerald-500 text-white border-emerald-500"
                                                            : "bg-white dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-emerald-500 hover:border-emerald-300"
                                                    )}
                                                >
                                                    Duyệt
                                                </button>

                                                {/* Hide / Ẩn */}
                                                <button
                                                    onClick={() => handleUpdateStatus(r.review_id, 'HIDDEN')}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                                                        currentStatus === 'HIDDEN'
                                                            ? "bg-rose-500 text-white border-rose-500"
                                                            : "bg-white dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-rose-500 hover:border-rose-300"
                                                    )}
                                                >
                                                    Ẩn
                                                </button>

                                                {/* Delete / Xóa vĩnh viễn */}
                                                <button
                                                    onClick={() => handleDeleteReview(r.review_id)}
                                                    className="p-2 bg-slate-50 dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-xl transition border border-transparent hover:border-red-200/30"
                                                    title="Xóa vĩnh viễn khỏi MySQL"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Trang {page + 1} / {totalPages || 1}
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                        <button 
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
