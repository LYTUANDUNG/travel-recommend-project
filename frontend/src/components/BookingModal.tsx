import { useState } from 'react';
import { X, Calendar, Users, Check } from 'lucide-react';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    locationName: string;
}

export default function BookingModal({ isOpen, onClose, locationName }: BookingModalProps) {
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Đặt chỗ</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <p className="font-medium text-slate-900">Bạn đang đặt: <span className="text-primary-600">{locationName}</span></p>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ngày đi</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input type="date" className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Số lượng khách</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input type="number" min="1" defaultValue="2" className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <button onClick={() => setStep(2)} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold mt-4 hover:bg-primary-700">
                                Tiếp tục
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Đã gửi yêu cầu!</h4>
                            <p className="text-slate-500 mb-6">Chúng tôi sẽ liên hệ lại sớm để xác nhận.</p>
                            <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200">
                                Hoàn tất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
