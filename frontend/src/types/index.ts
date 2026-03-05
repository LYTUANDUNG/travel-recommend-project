export * from './schema';

export interface RecommendationResult {
  location: import('./schema').Location;
  similarity: number;
  distance?: number;
}