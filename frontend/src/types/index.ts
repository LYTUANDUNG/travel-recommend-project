export interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  rating_avg: number;
  rating_count: number;
  city: string;
  image?: string;
  priceRange?: string;
  // New fields for Personalization & Promotions
  discount?: {
    content: string; // e.g., "GIẢM 20%"
    amount: number;
  };
  matchScore?: number; // e.g., 95 (for 95%)
}

export interface RecommendationResult {
  location: Location;
  similarity: number;
  distance?: number;
}