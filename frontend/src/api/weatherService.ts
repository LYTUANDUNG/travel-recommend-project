import { Location } from '../types';

export interface WeatherData {
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
    icon: string;
}

// Real Open-Meteo API integration
// Docs: https://open-meteo.com/en/docs
export const getWeatherForLocation = async (lat: number, lng: number): Promise<WeatherData> => {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        );

        if (!response.ok) {
            throw new Error('Weather API failed');
        }

        const data = await response.json();
        const weatherCode = data.current_weather.weathercode;
        const temperature = data.current_weather.temperature;

        // Map WMO Weather interpretation codes (WW)
        // https://open-meteo.com/en/docs
        let condition: WeatherData['condition'] = 'Sunny';
        let iconName = 'sun';

        if (weatherCode === 0) {
            condition = 'Sunny';
            iconName = 'sun';
        } else if ([1, 2, 3, 45, 48].includes(weatherCode)) {
            condition = 'Cloudy';
            iconName = 'cloud';
        } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
            condition = 'Rainy';
            iconName = 'cloud-rain';
        } else if ([95, 96, 99].includes(weatherCode)) {
            condition = 'Stormy';
            iconName = 'cloud-lightning';
        }

        return {
            temp: temperature,
            condition,
            icon: iconName,
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Fallback in case of error (e.g. offline)
        return {
            temp: 25,
            condition: 'Sunny',
            icon: 'sun'
        };
    }
};
