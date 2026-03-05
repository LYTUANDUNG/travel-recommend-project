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
}

// Location API Interface
export interface ILocationApi {
    getAll(): Promise<ApiResponse<Location[]>>;
    getById(id: number): Promise<ApiResponse<Location>>;
    search(query: string, filters?: any): Promise<ApiResponse<Location[]>>;
    create(location: Partial<Location>): Promise<ApiResponse<Location>>;
    // AI/Recommendation Endpoints
    getRecommendations(userId: number, lat?: number, lng?: number): Promise<ApiResponse<Location[]>>;
}

// Review API Interface
export interface IReviewApi {
    getByLocation(locationId: number): Promise<ApiResponse<Review[]>>;
    addReview(review: Partial<Review>): Promise<ApiResponse<Review>>;
}
