import { useState, useEffect } from 'react';

interface GeoConfig {
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
}

export function useGeoLocation(config: GeoConfig = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }) {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setError("Trình duyệt không hỗ trợ Geolocation");
            return;
        }

        const success = (position: GeolocationPosition) => {
            setCoords({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        };

        const fail = (error: GeolocationPositionError) => {
            // Fallback to Ho Chi Minh City if blocked/error
            console.warn("Geolocation denied/error, falling back to HCM", error);
            setCoords({ lat: 10.762622, lng: 106.660172 });
            setError(error.message);
        };

        navigator.geolocation.getCurrentPosition(success, fail, config);
    }, []);

    const calculateDistance = (lat: number, lng: number) => {
        if (!coords) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat - coords.lat);
        const dLon = deg2rad(lng - coords.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(coords.lat)) * Math.cos(deg2rad(lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d.toFixed(1);
    };

    return { coords, error, calculateDistance };
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
