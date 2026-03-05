import { IAuthApi, ILocationApi, ApiResponse, IReviewApi } from './types';
import { User, Location, Review } from '../types/schema';
import { mockLocations } from './mockData';
import { loggingService } from './loggingService';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Mock User
const mockUser: User = {
    user_id: 1,
    username: 'nguyenvana',
    email: 'nguyenvana@example.com',
    full_name: 'Nguyễn Văn A',
    formatted_role: 'User', // Mapped from role? No, schema says role: Role
    role: 'USER',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    created_at: new Date().toISOString()
};

export const mockAuthApi: IAuthApi = {
    login: async (email, password): Promise<ApiResponse<User>> => {
        await delay(800);
        if (email === 'fail@test.com') {
            return { success: false, data: {} as User, message: 'Invalid credentials' };
        }
        return { success: true, data: mockUser };
    },
    register: async (user): Promise<ApiResponse<User>> => {
        await delay(1000);
        return { success: true, data: { ...mockUser, ...user } as User };
    },
    logout: async () => {
        await delay(200);
    },
    getCurrentUser: async () => {
        await delay(300);
        return { success: true, data: mockUser };
    }
};

export const mockLocationApi: ILocationApi = {
    getAll: async (): Promise<ApiResponse<Location[]>> => {
        await delay(500);
        return { success: true, data: mockLocations };
    },

    getById: async (id: number): Promise<ApiResponse<Location>> => {
        await delay(300);
        const loc = mockLocations.find(l => l.location_id === id);
        if (!loc) return { success: false, data: {} as Location, message: 'Not found' };

        // Log "View Details" action
        loggingService.logViewDetails(id, mockUser.user_id);

        return { success: true, data: loc };
    },

    create: async (location: Partial<Location>): Promise<ApiResponse<Location>> => {
        await delay(500);
        const newLoc = { ...location, location_id: Date.now() } as Location;
        // In reality, it would save to DB. Mock just returns it.
        return { success: true, data: newLoc };
    },

    search: async (query: string): Promise<ApiResponse<Location[]>> => {
        await delay(600);
        loggingService.logSearch(query, mockUser.user_id);

        const lowerQ = query.toLowerCase();
        const results = mockLocations.filter(l =>
            l.name.toLowerCase().includes(lowerQ) ||
            l.province?.toLowerCase().includes(lowerQ)
        );
        return { success: true, data: results };
    },

    getRecommendations: async (userId, lat, lng): Promise<ApiResponse<Location[]>> => {
        await delay(1000);
        // Mock Recommendation Logic (Thesis: Content-based / CF)
        // For now, return random or sorted by rating
        const sorted = [...mockLocations].sort((a, b) => b.average_rating - a.average_rating);
        return { success: true, data: sorted };
    }
};

export const mockReviewApi: IReviewApi = {
    getByLocation: async (locationId): Promise<ApiResponse<Review[]>> => {
        await delay(400);
        return { success: true, data: [] }; // Empty for now
    },

    addReview: async (review): Promise<ApiResponse<Review>> => {
        await delay(800);
        return { success: true, data: review as Review };
    }
}
