import { useState, useCallback } from 'react';

// Open-Meteo API (No Key Required, Free for non-commercial)
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherInfo {
    temperature: number;
    weatherCode: number;
    isDay: number;
    description?: string;
}

export function useWeather() {
    const [weather, setWeather] = useState<WeatherInfo | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchWeather = useCallback(async (locationName: string) => {
        if (!locationName) return;

        // Clean up location name for search (remove "Tỉnh", "Thành phố")
        const cleanName = locationName.replace(/^(Tỉnh|Thành phố)\s+/i, '');

        setLoading(true);
        try {
            // 1. Geocoding: Get Lat/Lon from Name
            const geoRes = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(cleanName)}&count=1&language=vi&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                console.warn("Weather API: Location not found", cleanName);
                setWeather(null);
                return;
            }

            const { latitude, longitude } = geoData.results[0];
            await fetchWeatherByCoords(latitude, longitude);
        } catch (error) {
            console.error("Weather Fetch Error:", error);
            setWeather(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWeatherByCoords = useCallback(async (lat: number, lng: number) => {
        setLoading(true);
        try {
            const weatherRes = await fetch(`${WEATHER_URL}?latitude=${lat}&longitude=${lng}&current_weather=true`);
            const weatherData = await weatherRes.json();

            if (weatherData.current_weather) {
                const { temperature, weathercode, is_day } = weatherData.current_weather;
                setWeather({
                    temperature,
                    weatherCode: weathercode,
                    isDay: is_day,
                    description: getWeatherDescription(weathercode)
                });
            }
        } catch (error) {
            console.error("Weather Coords Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { weather, loading, fetchWeather, fetchWeatherByCoords };
}

// Helper: WMO Weather Code to Vietnam Description
function getWeatherDescription(code: number): string {
    if (code === 0) return 'Trời quang';
    if (code <= 3) return 'Có mây';
    if (code <= 48) return 'Sương mù';
    if (code <= 55) return 'Mưa phùn';
    if (code <= 65) return 'Mưa rào';
    if (code <= 75) return 'Tuyết rơi';
    if (code <= 82) return 'Mưa rào mạnh';
    if (code <= 99) return 'Giông bão';
    return 'Không xác định';
}
