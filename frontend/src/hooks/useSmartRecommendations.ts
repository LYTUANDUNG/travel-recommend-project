import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Location } from '../types';

export function useSmartRecommendations(locations: Location[]) {
    const { isAuthenticated, user } = useAuthStore();

    const recommendations = useMemo(() => {
        if (!locations.length) return [];

        if (isAuthenticated && user) {
            // 1. Authenticated User Logic: Personalization
            // Filter by interests (mock) and assign high match scores
            return locations
                .map(loc => {
                    // Mock Logic: If category matches interest, boost score
                    // In real app: Call Python/ML API here
                    const isInterested = user.interests.some(i =>
                        loc.description.toLowerCase().includes(i.toLowerCase()) ||
                        loc.category.toLowerCase().includes(i.toLowerCase())
                    );

                    let baseScore = isInterested ? 90 : 70;
                    // Add randomness for demo
                    const matchScore = Math.min(99, baseScore + Math.floor(Math.random() * 10));

                    return { ...loc, matchScore };
                })
                .sort((a, b) => b.matchScore! - a.matchScore!)
                .slice(0, 4); // Return top 4
        } else {
            // 2. Guest Logic: Trending / Top Rated
            return locations
                .filter(loc => (loc.rating_avg || 0) > 4.5) // High rated
                .slice(0, 4);
        }
    }, [locations, isAuthenticated, user]);

    return recommendations;
}
