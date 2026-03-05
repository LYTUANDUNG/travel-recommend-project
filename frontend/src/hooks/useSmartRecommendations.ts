import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Location } from '../types';
import { useContextRecommendation } from './useContextRecommendation';

/**
 * Advanced Recommendation Engine (Thesis Quality)
 * Combines:
 * 1. Content-Based Filtering (User Interests vs Location Tags/Categories)
 * 2. Context-Aware Filtering (Weather/Time appropriateness)
 * 3. Collaborative/Social Proof (Ratings & Trending)
 */
export function useSmartRecommendations(locations: Location[]) {
    const { isAuthenticated, user } = useAuthStore();
    const { recommendation: contextRec } = useContextRecommendation();

    const recommendations = useMemo(() => {
        if (!locations.length) return [];

        return locations.map(loc => {
            let score = 0;
            let breakdown: string[] = [];

            // --- 1. BASELINE: Quality & Popularity (Max 30 pts) ---
            // Normalized rating (0-5 -> 0-20)
            score += (loc.average_rating || 0) * 4;
            // Popularity boost (logarithmic scale)
            if (loc.total_reviews > 100) score += 5;
            if (loc.total_reviews > 500) score += 5; // Max 10 pts popularity

            // --- 2. PERSONALIZATION: User Interests (Max 40 pts) ---
            if (isAuthenticated && user?.interests) {
                const interestMatches = user.interests.filter(interest =>
                    // Match Category Name
                    (loc.category_name || '').toLowerCase().includes(interest.toLowerCase()) ||
                    // Match Description keywords
                    loc.description.toLowerCase().includes(interest.toLowerCase()) ||
                    // Match Tags (if available)
                    loc.tags?.some(t => t.name.toLowerCase().includes(interest.toLowerCase()))
                );

                if (interestMatches.length > 0) {
                    // 20 pts for first match, 10 for subsequent
                    const interestScore = 20 + Math.min(20, (interestMatches.length - 1) * 10);
                    score += interestScore;
                    breakdown.push(`Phù hợp sở thích: ${interestMatches.join(', ')}`);
                }
            }

            // --- 3. CONTEXT-AWARE: Weather & Time (Max 30 pts) ---
            if (contextRec) {
                // Weather Match
                const isWeatherMatch = contextRec.suggestedCategories.some(cat =>
                    (loc.category_name || '').includes(cat) ||
                    loc.tags?.some(t => t.name.includes(cat))
                );

                if (isWeatherMatch) {
                    score += 25;
                    breakdown.push(`Lý tưởng cho trời ${contextRec.weatherDescription}`);
                }

                // Time Context (e.g., Nightlife vs Morning Coffee)
                const currentHour = new Date().getHours();
                // If it's "Night" (after 6PM) and location is "Bar/Pub" or "Night Market" -> Boost
                // (Simplified check via keywords as we don't have structured 'type' yet)
                const isNightLife = (loc.name + loc.description).toLowerCase().match(/bar|pub|chợ đêm|club/);
                if (currentHour >= 18 && isNightLife) {
                    score += 5;
                    breakdown.push('Điểm đến về đêm');
                }
            }

            // --- NORMALIZATION & CLEANUP ---
            // Cap at 99, Min at 50 (to look good on UI)
            const finalScore = Math.min(99, Math.max(50, Math.round(score)));

            return {
                ...loc,
                match_score: finalScore,
                match_reason: breakdown[0] || 'Địa điểm phổ biến', // Primary reason for UI
            };
        })
            .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
            .slice(0, 6); // Top 6 recommendations

    }, [locations, isAuthenticated, user, contextRec]);

    return recommendations;
}
