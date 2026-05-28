/**
 * Database Schema Mirror
 * Corresponds to public/database_design.txt
 * Used for strict typing of API responses and AI Data Collection.
 */

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Role = 'USER' | 'ADMIN' | 'PARTNER';
export type PriceLevel = 1 | 2 | 3 | 4; // 1: Cheap, 4: Luxury
export type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'COMPLETED';
export type ActionType = 'VIEW_DETAILS' | 'CLICK_BOOKING' | 'ADD_FAVORITE' | 'VIEW_MAP' | 'SEARCH_QUERY';
export type DiscountType = 'PERCENT' | 'FIXED';

export interface User {
    user_id: number;
    username: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
    // Demographic Fields (for Demographic Filtering)
    password?: string;
    gender?: Gender;
    birth_year?: number;
    nationality?: string;
    province?: string; // Residence
    role: Role;
    created_at: string; // ISO Date
    last_avatar_update?: string;
    interests?: string[]; // Joined/Computed for Frontend
    is_active?: boolean;
}

export interface Category {
    category_id: number;
    name: string;
}

export interface Tag {
    tag_id: number;
    name: string;
    weight: number;
}

export interface Location {
    location_id: number;
    name: string;
    description: string;
    // Geography
    address?: string;
    district?: string;
    province?: string;
    latitude: number;
    longitude: number;
    // Attributes
    images?: string[];
    category_id: number;
    price_level?: PriceLevel;
    price_range_str?: string;
    opening_hour?: string; // HH:mm:ss
    closing_hour?: string;
    // Metadata
    thumbnail_url?: string;
    average_rating: number;
    total_reviews: number;
    view_count?: number;
    // Computed/Joined fields (Frontend convenience)
    tags?: Tag[]; // Rich features for CBF
    category_name?: string;
    distance?: number; // Calculated relative to user
    match_score?: number; // AI Recommendation Score
    similarity_score?: number;
    distance_score?: number;
    context_score?: number;
    matched_tags?: string[];
    preview_experience?: string;
    category?: Category;
}

export interface LocationTag {
    location_id: number;
    tag_id: number;
    score: number;
}

export interface Review {
    review_id: number;
    user_id: number;
    location_id: number;
    rating: number; // 1-5
    comment?: string;
    images_json?: string[];
    verify_status: VerifyStatus;
    visit_date?: string;
    created_at: string;
    // Joins
    user_name?: string;
    user_avatar?: string;
    location_name?: string;
}

export interface BehaviorLog {
    log_id?: number; // Optional on creation
    user_id?: number | null;
    session_id?: string;
    location_id?: number; // Nullable if action is generic like SEARCH
    action_type: ActionType;
    metadata?: string; // e.g., Search Query string
    time_spent_seconds?: number;
    device_type?: string;
    created_at?: string;
}

export interface UserInterest {
    user_id: number;
    category_id: number;
    affinity_score: number; // 0.0 to 1.0
}

export interface Voucher {
    voucher_id: number;
    location_id: number;
    code: string;
    title: string;
    description?: string;
    discount_value: number;
    discount_type: DiscountType;
    valid_from?: string;
    valid_to?: string;
}

export interface Favorite {
    id: number;
    user: User;
    location: Location;
}

export interface VisitRequest {
    id: number;
    user_id: number;
    user_name: string;
    location_id: number;
    location_name: string;
    status: VerifyStatus;
    visit_date: string;
    created_at: string;
    location?: Location;
}

