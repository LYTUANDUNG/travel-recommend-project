import type { Location, RecommendationResult } from '../types';
import { mockLocations } from './mockData';
import { haversineDistance } from '../utils/haversine';

// Giả lập delay mạng
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchLocations = async (): Promise<Location[]> => {
  await delay(800);
  return mockLocations;
};

export const fetchLocationById = async (id: number): Promise<Location> => {
  await delay(500);
  const loc = mockLocations.find(l => l.id === id);
  if (!loc) throw new Error("Not found");
  return loc;
};

export const recommendLocations = async (query: string): Promise<RecommendationResult[]> => {
  await delay(1200);

  const keywords = query.toLowerCase().split(' ').filter(Boolean);
  const userLocation = { lat: 10.762622, lng: 106.660172 }; // HCM

  return mockLocations
    .map(loc => {
      const desc = (loc.description + ' ' + loc.category + ' ' + loc.city).toLowerCase();
      let matchScore = 0;
      keywords.forEach(kw => {
        if (desc.includes(kw)) matchScore += 1;
        if (loc.name.toLowerCase().includes(kw)) matchScore += 2;
      });
      const similarity = matchScore / (keywords.length * 3);

      const distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        loc.latitude, loc.longitude
      );

      return { location: loc, similarity, distance };
    })
    .filter(r => r.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity || a.distance! - b.distance!)
    .slice(0, 6);
};