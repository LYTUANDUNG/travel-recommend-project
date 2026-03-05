import React from 'react';
import { Sun, CloudRain, Clock, MapPin, ArrowRight } from 'lucide-react';
import { ContextRecommendation } from '../hooks/useContextRecommendation';

interface Props {
    context: ContextRecommendation | null;
}

export default function SmartItineraryWidget({ context }: Props) {
    if (!context) return null;

    // Logic: Suggest specific activities based on Context Type
    const getItinerary = () => {
        if (context.contextType === 'RAIN') {
            return [
                { time: '09:00', activity: 'Cafe sách yên tĩnh', icon: '☕' },
                { time: '14:00', activity: 'Tham quan bảo tàng lịch sử', icon: '🏛️' },
                { time: '19:00', activity: 'Ăn tối nhà hàng ấm cúng', icon: '🍲' },
            ];
        } else if (context.contextType === 'SUN') {
            return [
                { time: '08:00', activity: 'Dạo biển bình minh', icon: '🏖️' },
                { time: '15:00', activity: 'Chèo thuyền Kayak', icon: '🚣' },
                { time: '20:00', activity: 'Tiệc nướng BBQ bãi biển', icon: '🍢' },
            ];
        } else {
            return [
                { time: '09:00', activity: 'Check-in địa điểm nổi tiếng', icon: '📸' },
                { time: '14:00', activity: 'Khám phá ẩm thực đường phố', icon: '🍜' },
                { time: '19:00', activity: 'Dạo phố đi bộ', icon: '🚶' },
            ];
        }
    };

    const plans = getItinerary();

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-serif font-bold text-slate-900">Gợi ý lịch trình hôm nay</h3>
                    <p className="text-slate-500 text-sm">Tự động tạo bởi AI ({context.message})</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <Clock className="w-6 h-6" />
                </div>
            </div>

            <div className="space-y-4">
                {plans.map((plan, idx) => (
                    <div key={idx} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                        <span className="font-mono text-xs font-bold text-slate-400 w-12">{plan.time}</span>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            {plan.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm">{plan.activity}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">Phù hợp với thời tiết {context.weatherDescription}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">
                Tùy chỉnh lịch trình
            </button>
        </div>
    );
}
