import { BehaviorLog, ActionType } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logging Service
 * Captures user interactions for Recommendation System Training (Collaborative Filtering).
 * 
 * In a real app, this would send batches of logs to the Backend via API.
 * Currently, it simulates this by logging to Console and LocalStorage.
 */

const STORAGE_KEY = 'user_behavior_logs';

export const loggingService = {

    getSessionId: (): string => {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = uuidv4();
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    },

    logAction: (
        action: ActionType,
        locationId?: number,
        metadata?: string,
        timeSpent?: number,
        userId?: number
    ) => {
        const log: BehaviorLog = {
            session_id: loggingService.getSessionId(),
            user_id: userId || null, // If authenticated
            location_id: locationId,
            action_type: action,
            metadata: metadata,
            time_spent_seconds: timeSpent || 0,
            device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'MOBILE' : 'DESKTOP',
            created_at: new Date().toISOString()
        };

        // 1. Log to Console (for Developer/Demo)
        console.groupCollapsed(`[Behavior Log] ${action}`);
        console.log("Payload:", log);
        console.groupEnd();

        // 2. Persist to LocalStorage (Mock Database)
        try {
            const existingLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            existingLogs.push(log);
            // Limit to last 100 logs to prevent overflow
            if (existingLogs.length > 100) existingLogs.shift();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLogs));
        } catch (e) {
            console.error("Failed to save log", e);
        }
    },

    // Methods for specific actions
    logViewDetails: (locationId: number, userId?: number) => {
        loggingService.logAction('VIEW_DETAILS', locationId, undefined, undefined, userId);
    },

    logSearch: (query: string, userId?: number) => {
        loggingService.logAction('SEARCH_QUERY', undefined, query, undefined, userId);
    },

    logAddFavorite: (locationId: number, userId?: number) => {
        loggingService.logAction('ADD_FAVORITE', locationId, undefined, undefined, userId);
    },

    // Call this when component unmounts
    logTimeSpent: (locationId: number, seconds: number, userId?: number) => {
        if (seconds > 5) { // Only log significant dwell time
            loggingService.logAction('VIEW_DETAILS', locationId, 'Dwell Time', seconds, userId);
        }
    },

    getLogs: (): BehaviorLog[] => {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    },

    clearLogs: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
