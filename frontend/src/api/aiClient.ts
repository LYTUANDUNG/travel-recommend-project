import axios from 'axios';
import { api } from './index';
import { ApiResponse } from './types';
import { Location } from '../types/schema';

const AI_API_BASE = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8000';
const MIN_RECOMMENDATION_SCORE = 0.5;

const aiClient = axios.create({
    baseURL: AI_API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

type AiRankedItem = {
    placeId?: number;
    place_id?: number;
    location_id?: number;
    score?: number;
};

const normalizeScore = (score?: number) => {
    if (score == null || Number.isNaN(Number(score))) return 0;
    const value = Number(score);
    return value > 1 ? value / 100 : value;
};

const hydrateRankedItems = async (items: AiRankedItem[]): Promise<Location[]> => {
    const eligibleItems = items
        .map((item) => ({
            id: item.placeId ?? item.place_id ?? item.location_id,
            score: normalizeScore(item.score)
        }))
        .filter((item): item is { id: number; score: number } => !!item.id && item.score >= MIN_RECOMMENDATION_SCORE);

    const ids = eligibleItems.map((item) => item.id);
    const scoreById = new Map(eligibleItems.map((item) => [item.id, item.score]));

    const res = await api.location.getByIds(ids);
    if (!res.success || !Array.isArray(res.data)) {
        const hydrated = await Promise.all(
            ids.map(async (id) => {
                const single = await api.location.getById(id);
                if (!single.success || !single.data?.location_id) return null;
                return { ...single.data, match_score: scoreById.get(id) || 0 };
            })
        );
        return hydrated.reduce<Location[]>((acc, loc) => {
            if (loc) acc.push(loc);
            return acc;
        }, []);
    }

    const locationById = new Map(res.data.map((loc) => [loc.location_id, loc]));

    return ids.reduce<Location[]>((acc, id) => {
        const loc = locationById.get(id);
        if (loc) {
            acc.push({ ...loc, match_score: scoreById.get(id) || 0 });
        }
        return acc;
    }, []);
};

export const aiRecommendationApi = {
    getContent: async (locationId: number, userId?: number, topN = 12): Promise<ApiResponse<Location[]>> => {
        try {
            const response = await aiClient.get('/recommend/content', {
                params: {
                    location_id: locationId,
                    user_id: userId,
                    top_n: topN
                }
            });
            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            return { success: true, data: await hydrateRankedItems(data), message: response.data?.message };
        } catch (error: any) {
            return { success: false, data: [], message: error.response?.data?.message || 'AI content recommendations failed' };
        }
    },

    getCollaborative: async (userId: number, topN = 12): Promise<ApiResponse<Location[]>> => {
        try {
            const response = await aiClient.get('/recommend/collaborative', {
                params: {
                    user_id: userId,
                    top_n: topN
                }
            });
            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            return { success: true, data: await hydrateRankedItems(data), message: response.data?.message };
        } catch (error: any) {
            return { success: false, data: [], message: error.response?.data?.message || 'AI collaborative recommendations failed' };
        }
    }
};
