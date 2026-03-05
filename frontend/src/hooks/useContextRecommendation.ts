import { useEffect, useState } from 'react';
import { useGeoLocation } from './useGeoLocation';
import { useWeather } from './useWeather';

export type ContextType = 'RAIN' | 'SUN' | 'CLEAR' | 'COLD' | 'NORMAL';

export interface ContextRecommendation {
    contextType: ContextType;
    icon: string;
    message: string;
    subMessage: string;
    suggestedCategories: string[]; // IDs from INTEREST_CATEGORIES
    weatherDescription?: string;
    temperature?: number;
}

export function useContextRecommendation() {
    const { coords, error: geoError } = useGeoLocation();
    const { weather, loading: weatherLoading, fetchWeatherByCoords } = useWeather();
    const [recommendation, setRecommendation] = useState<ContextRecommendation | null>(null);

    // 1. Auto-fetch weather when coords available
    useEffect(() => {
        if (coords) {
            fetchWeatherByCoords(coords.lat, coords.lng);
        }
    }, [coords, fetchWeatherByCoords]);

    // 2. Analyze Weather -> Recommendation
    useEffect(() => {
        if (!weather) return;

        const { weatherCode, temperature } = weather;
        let context: ContextType = 'NORMAL';
        let rec: Partial<ContextRecommendation> = {};

        // WMO Code Logic
        // Rain/Drizzle/Thunderstorm
        if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99)) {
            context = 'RAIN';
            rec = {
                icon: '☔',
                message: 'Trời đang mưa, chill thôi!',
                subMessage: 'Phù hợp nhất để đi cafe hoặc thăm bảo tàng.',
                suggestedCategories: ['Ẩm thực', 'Văn hóa', 'Nghỉ dưỡng']
            };
        }
        // Clear/Sun
        else if (weatherCode <= 3) {
            if (temperature > 30) {
                context = 'SUN';
                rec = {
                    icon: '☀️',
                    message: 'Nắng đẹp rực rỡ!',
                    subMessage: 'Thời điểm tuyệt vời cho biển đảo và chụp ảnh.',
                    suggestedCategories: ['Biển', 'Núi', 'Mạo hiểm']
                };
            } else {
                context = 'CLEAR';
                rec = {
                    icon: '🌤️',
                    message: 'Thời tiết chiều lòng người.',
                    subMessage: 'Xách ba lô lên đi bộ đường dài hoặc cắm trại nào.',
                    suggestedCategories: ['Núi', 'Mạo hiểm', 'Văn hóa']
                };
            }
        }
        // Cold?
        else if (temperature < 15) {
            context = 'COLD';
            rec = {
                icon: '🧣',
                message: 'Se lạnh rồi đấy!',
                subMessage: 'Đi ăn đồ nướng hoặc tắm suối khoáng nóng là chuẩn bài.',
                suggestedCategories: ['Ẩm thực', 'Nghỉ dưỡng']
            };
        }
        // Fallback
        else {
            rec = {
                icon: '✨',
                message: 'Khám phá thế giới!',
                subMessage: 'Bất kể thời tiết, luôn có nơi thú vị chờ bạn.',
                suggestedCategories: ['Văn hóa', 'Ẩm thực']
            };
        }

        setRecommendation({
            contextType: context,
            icon: rec.icon!,
            message: rec.message!,
            subMessage: rec.subMessage!,
            suggestedCategories: rec.suggestedCategories!,
            weatherDescription: weather.description,
            temperature: weather.temperature
        });

    }, [weather]);

    return {
        recommendation,
        isLoading: !coords || weatherLoading,
        hasGeoError: !!geoError
    };
}
