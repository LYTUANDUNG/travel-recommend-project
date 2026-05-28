import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, User, MapPin, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api';

export default function AdminVisits() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const size = 10;

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.visit.getPaginated({ page, size });
            if (res.success) {
                setRequests(res.data.content || []);
                setTotalPages(res.data.total_pages || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page]);

    const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
        const label = status === 'APPROVED' ? 'Đã duyệt' : status === 'COMPLETED' ? 'Đã hoàn thành chuyến đi' : 'Từ chối';
        if (!confirm(`Bạn chắc chắn muốn đổi trạng thái thành ${label}?`)) return;

        try {
            const res = await api.visit.updateStatus(id, status);
            if (res.success) {
                fetchRequests();
            } else {
                alert(res.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            alert("Lỗi server.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-orange-500" />
                        Kiểm duyệt Tham quan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Phê duyệt các yêu cầu tham quan để người dùng có thể viết đánh giá.</p>
                </div>
                <button 
                    onClick={() => { setPage(0); fetchRequests(); }} 
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden outline outline-4 outline-slate-50 dark:outline-slate-950">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest text-[10px] font-black">
                                <th className="px-8 py-5">Người dùng</th>
                                <th className="px-8 py-5">Địa điểm</th>
                                <th className="px-8 py-5">Thời gian</th>
                                <th className="px-8 py-5">Trạng thái</th>
                                <th className="px-8 py-5 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                                        <p className="mt-4 text-slate-500 font-bold">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold tracking-tight">Không có yêu cầu nào cần xử lý.</td>
                                </tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                {req.user_avatar ? (
                                                    <img src={req.user_avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            {req.user_name || `User #${req.user_id}`}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                            {req.location_name || `Loc #${req.location_id}`}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                                        {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                            req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-900/50' :
                                            req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:ring-emerald-900/50' :
                                            req.status === 'COMPLETED' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-950/30 dark:ring-orange-900/50' :
                                            'bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-950/30 dark:ring-rose-900/50'
                                        }`}>
                                            {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                            {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                                            {req.status === 'COMPLETED' && <ShieldCheck className="w-3 h-3" />}
                                            {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                            {req.status === 'PENDING' ? 'Chờ duyệt' : req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'COMPLETED' ? 'Đã đi' : 'Từ chối'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {req.status === 'PENDING' ? (
                                            <div className="flex gap-1 justify-center">
                                                <button 
                                                    onClick={() => handleUpdateStatus(req.id, 'APPROVED')} 
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all hover:scale-110 active:scale-95" 
                                                    title="Duyệt"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(req.id, 'REJECTED')} 
                                                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all hover:scale-110 active:scale-95" 
                                                    title="Từ chối"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : req.status === 'APPROVED' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                                                className="px-4 py-2 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border border-orange-100 dark:border-orange-900/50 shadow-sm"
                                                title="Đánh dấu người dùng đã đi / hoàn thành chuyến đi"
                                            >
                                                Hoàn thành
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {req.status === 'COMPLETED' ? 'Đã đi' : 'Đã hủy'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="text-xs font-bold text-slate-500">
                            Trang <span className="text-slate-900 dark:text-white">{page + 1}</span> / {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
