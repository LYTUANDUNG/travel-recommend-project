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
                    setRecommendations(res.data || []);
                } else if (isMounted) {
                    setRecommendations([]);
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

    return { recommendations, loading: isReady ? loading : false };
}

export function useCollaborativeRecommendations(userId?: number, isReady: boolean = true) {
    const [recommendations, setRecommendations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId || !isReady) return;

        let isMounted = true;
        setLoading(true);
        api.location.getRecommendations(userId)
            .then(res => {
                if (isMounted && res.success) {
                    setRecommendations(res.data || []);
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [userId, isReady]);

    return { recommendations, loading: isReady ? loading : false };
}
