import { useState, useEffect } from 'react';
import { Location } from '../types/schema';
import { api } from '../api';
import { aiRecommendationApi } from '../api/aiClient';

export function useRecommendations() {
    const [recommendations, setRecommendations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        // Call backend API for guest/general recommendations (userId=undefined)
        api.location.getRecommendations(undefined)
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
    }, []);

    return { recommendations, loading };
}

export function useCollaborativeRecommendations(userId?: number, isReady: boolean = true) {
    const [recommendations, setRecommendations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId || !isReady) return;

        let isMounted = true;
        setLoading(true);
        api.location.getSmartRecommendations(userId)
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

export function useAiContentRecommendations(userId?: number, seedLocationId?: number, isReady: boolean = true) {
    const [recommendations, setRecommendations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [threshold, setThreshold] = useState(() => {
        const saved = localStorage.getItem('ai_cb_threshold');
        return saved ? parseFloat(saved) : 0.4;
    });

    useEffect(() => {
        const handleThresholdChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.cbThreshold === 'number') {
                setThreshold(customEvent.detail.cbThreshold);
            }
        };
        window.addEventListener('aiThresholdChange', handleThresholdChange);
        return () => window.removeEventListener('aiThresholdChange', handleThresholdChange);
    }, []);

    useEffect(() => {
        if (!seedLocationId || !isReady) return;

        let isMounted = true;
        setLoading(true);
        aiRecommendationApi.getContent(seedLocationId, userId, 12, threshold)
            .then(res => {
                if (isMounted) setRecommendations(res.success ? (res.data || []) : []);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [seedLocationId, userId, isReady, threshold]);

    return { recommendations, loading: isReady ? loading : false };
}

export function useAiCollaborativeRecommendations(userId?: number, isReady: boolean = true) {
    const [recommendations, setRecommendations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [threshold, setThreshold] = useState(() => {
        const saved = localStorage.getItem('ai_cf_threshold');
        return saved ? parseFloat(saved) : 0.5;
    });

    useEffect(() => {
        const handleThresholdChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.cfThreshold === 'number') {
                setThreshold(customEvent.detail.cfThreshold);
            }
        };
        window.addEventListener('aiThresholdChange', handleThresholdChange);
        return () => window.removeEventListener('aiThresholdChange', handleThresholdChange);
    }, []);

    useEffect(() => {
        if (!userId || !isReady) return;

        let isMounted = true;
        setLoading(true);
        aiRecommendationApi.getCollaborative(userId, 12, threshold)
            .then(res => {
                if (isMounted) setRecommendations(res.success ? (res.data || []) : []);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [userId, isReady, threshold]);

    return { recommendations, loading: isReady ? loading : false };
}
