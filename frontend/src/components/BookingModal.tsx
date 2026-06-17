import { useState } from 'react';
import { X, Calendar as CalendarIcon, MapPin, CheckCircle2, Navigation, AlertCircle, Clock } from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    locationId: number;
    locationName: string;
    onSuccess?: () => void;
}

export default function BookingModal({ isOpen, onClose, locationId, locationName, onSuccess }: BookingModalProps) {
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
            const res = await api.visit.requestVisit(user.user_id, locationId, date);
            if (res.success) {
                setStep(2);
                onSuccess?.();
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800 flex flex-col">
                
                {/* Header Area */}
                <div className="relative h-32 bg-primary-500 overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 to-transparent"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors z-10"><X className="w-5 h-5" /></button>
                    
                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="flex items-center gap-2 text-primary-100 text-xs font-bold uppercase tracking-widest mb-1">
                            <Navigation className="w-3 h-3 text-primary-200" /> Đăng ký tham quan
                        </div>
                        <h3 className="font-bold text-2xl text-white tracking-tight truncate">{locationName}</h3>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 pb-8 flex-1 bg-white dark:bg-slate-900">
                    {step === 1 ? (
                        <div className="space-y-5">
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Chi tiết điểm đến</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Bạn sắp thêm <strong className="text-slate-700 dark:text-slate-300">{locationName}</strong> vào hành trình du lịch của mình để hệ thống lưu lịch sử đánh giá.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Chọn ngày đi dự kiến</label>
                                <div className="relative group">
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                                    <input 
                                        type="date" 
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 focus:bg-white text-sm font-semibold transition-all text-slate-800 dark:text-white" 
                                    />
                                </div>
                            </div>

                            {!isAuthenticated && (
                                <div className="flex gap-3 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl text-xs font-semibold">
                                    <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                                    <p>Bạn cần đăng nhập để thực hiện đăng ký tham quan điểm đến này.</p>
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!isAuthenticated}
                                variant="primary"
                                fullWidth
                                className="rounded-2xl h-12 text-xs font-bold uppercase tracking-wider mt-4"
                            >
                                Xác nhận Đăng ký
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-6 flex flex-col items-center animate-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-emerald-500/10">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Đăng ký thành công!</h4>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs max-w-[280px] mx-auto leading-relaxed">
                                Hành trình tham quan của bạn đã được ghi nhận thành công trên hệ thống.
                            </p>
                            <Button 
                                onClick={() => { onClose(); setStep(1); }} 
                                variant="secondary"
                                fullWidth
                                className="rounded-2xl h-12 text-xs font-bold uppercase tracking-wider"
                            >
                                Đóng cửa sổ
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
