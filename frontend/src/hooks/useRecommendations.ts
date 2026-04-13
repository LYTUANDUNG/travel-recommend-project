import { useState, useEffect } from 'react';
import { Location } from '../types/schema';
import { api } from '../api';

export function useRecommendations(lat?: number, lng?: number, hour?: number, weather?: string, isReady: boolean = true) {
    const [recommendations, setRecommendations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;
        
        let isMounted = true;
        setLoading(true);
        api.location.getPersonalizedRecommendations(lat, lng, hour, weather)
            .then(res => {
                if (isMounted && res.success) {
                    setRecommendations(res.data);
                }
            })
            .catch(error => {
                // Silently handle error
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [lat, lng, hour, weather, isReady]);

    return { recommendations, loading: !isReady || loading };
}
