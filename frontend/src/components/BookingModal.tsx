import { useState } from 'react';
import { X, Calendar as CalendarIcon, MapPin, CheckCircle2, Navigation, AlertCircle, Clock } from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    locationId: number;
    locationName: string;
}

export default function BookingModal({ isOpen, onClose, locationId, locationName }: BookingModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const { user, isAuthenticated } = useAuthStore();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!isAuthenticated || !user) {
            alert("Vui lòng đăng nhập để lưu lịch trình chuyến đi!");
            return;
        }
        if (!date) {
            alert("Vui lòng chọn ngày dự kiến đi!");
            return;
        }

        setLoading(true);
        try {
            const res = await api.visit.requestVisit(user.user_id, locationId);
            if (res.success) {
                setStep(2);
                api.behavior.logAction({
                    user_id: user.user_id,
                    location_id: locationId,
                    action: 'CLICK_BOOKING'
                }).catch(() => {});
            } else {
                alert(res.message || "Có lỗi xảy ra khi thêm lịch trình.");
            }
        } catch (error) {
            alert("Lỗi kết nối server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800 flex flex-col">
                
                {/* Header Area */}
                <div className="relative h-32 bg-primary-600 overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors z-10"><X className="w-5 h-5" /></button>
                    
                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="flex items-center gap-2 text-primary-100 text-xs font-black uppercase tracking-widest mb-1">
                            <Navigation className="w-3 h-3" /> Lên kế hoạch
                        </div>
                        <h3 className="font-black text-2xl text-white tracking-tight truncate">{locationName}</h3>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 pb-10 flex-1 bg-white dark:bg-slate-900">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Chi tiết điểm đến</h4>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">Bạn sắp thêm <strong className="text-slate-700 dark:text-slate-300">{locationName}</strong> vào hành trình du lịch của mình. Hệ thống sẽ tối ưu hóa AI gợi ý đường đi và lưu log để đánh giá sau này.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Ngày diễn ra</label>
                                <div className="relative group">
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                                    <input 
                                        type="date" 
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-700 dark:text-slate-200" 
                                    />
                                </div>
                            </div>

                            {!isAuthenticated && (
                                <div className="flex gap-3 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>Bạn cần đăng nhập để sử dụng tính năng này.</p>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !isAuthenticated}
                                className="w-full py-4 bg-slate-900 dark:bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-primary-500 shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Xử lý...</>
                                ) : (
                                    <>Xác nhận Thêm Hành Trình</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8 flex flex-col items-center animate-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 ring-8 ring-emerald-50/50 dark:ring-emerald-900/10 shadow-lg shadow-emerald-100/50 dark:shadow-none">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Thành công!</h4>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-[250px] mx-auto leading-relaxed">Lịch trình đã được ghi nhận. Bạn có thể để lại Review sau khi check-in.</p>
                            <button 
                                onClick={() => { onClose(); setStep(1); }} 
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Đóng Cửa Sổ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
