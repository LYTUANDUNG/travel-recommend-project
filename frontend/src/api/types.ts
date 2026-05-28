import { Location, User, Review } from '../types/schema';

// Generic API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: any;
    // Pagination (Backend ready)
    page?: number;
    limit?: number;
    total?: number;
}

// Authentication API Interface
export interface IAuthApi {
    login(email: string, password: string): Promise<ApiResponse<User>>;
    register(user: Partial<User>): Promise<ApiResponse<User>>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<ApiResponse<User | null>>;
    forgotPassword(email: string): Promise<ApiResponse<any>>;
    resetPassword(token: string, newPassword: string): Promise<ApiResponse<any>>;
}

export interface IUserApi {
    getProfile(id: number): Promise<ApiResponse<User>>;
    updateProfile(id: number, data: Partial<User>): Promise<ApiResponse<User>>;
}

// Location API Interface
export interface ILocationApi {
    getAll(): Promise<ApiResponse<Location[]>>;
    getById(id: number): Promise<ApiResponse<Location>>;
    getByIds(ids: number[]): Promise<ApiResponse<Location[]>>;
    search(query: string, filters?: any): Promise<ApiResponse<Location[]>>;
    create(location: Partial<Location>): Promise<ApiResponse<Location>>;
    // AI/Recommendation Endpoints
    getRecommendations(userId?: number, lat?: number, lng?: number): Promise<ApiResponse<Location[]>>;
    getSmartRecommendations(userId?: number): Promise<ApiResponse<Location[]>>;
    getPersonalizedRecommendations(lat?: number, lng?: number, hour?: number, weather?: string): Promise<ApiResponse<Location[]>>;
}

// Review API Interface
export interface IReviewApi {
    getByLocation(locationId: number): Promise<ApiResponse<Review[]>>;
    addReview(review: Partial<Review>): Promise<ApiResponse<Review>>;
}
