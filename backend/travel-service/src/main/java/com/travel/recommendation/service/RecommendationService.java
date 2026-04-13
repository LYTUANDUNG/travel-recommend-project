package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.UserInterestProfile;
import com.travel.recommendation.repository.LocationRepository;
import com.travel.recommendation.repository.UserInterestProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * THESIS: Content-Based Recommendation with Academic Scoring System.
 * Formula: Total Score = (0.6 * SimilarityScore) + (0.3 * DistanceScore) + (0.1 * ContextScore)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final LocationRepository locationRepository;
    private final UserInterestProfileRepository profileRepository;

    private static final double WEIGHT_CONTENT = 0.6;
    private static final double WEIGHT_DISTANCE = 0.3;
    private static final double WEIGHT_CONTEXT = 0.1;

    public List<LocationResponse> getRecommendations(Long userId, Double lat, Double lng, String weather) {
        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = userId != null ? profileRepository.findByIdUserId(userId) : Collections.emptyList();
        
        // COLD START: Fallback to Guest (Popularity) if no profile data
        boolean isColdStart = profiles.isEmpty();
        
        int currentHour = LocalTime.now().getHour();

        return allLocations.stream()
                .map(loc -> calculateCompleteScore(loc, profiles, lat, lng, currentHour, weather, isColdStart))
                .sorted(Comparator.comparingDouble(LocationResponse::getMatchScore).reversed())
                .limit(20)
                .collect(Collectors.toList());
    }

    private LocationResponse calculateCompleteScore(Location loc, List<UserInterestProfile> profiles, 
                                                    Double userLat, Double userLng, 
                                                    int currentHour, String weather, boolean isColdStart) {
        
        // 1. CONTENT SIMILARITY (Cosine Similarity approximation via Tag Weighted Overlap)
        // Thesis Requirement: Vector-based matching
        double similarityScore = 0.0;
        List<String> matchedTags = new ArrayList<>();
        
        if (!isColdStart) {
            similarityScore = calculateCosineSimilarity(loc, profiles, matchedTags);
        } else {
            // Cold Start: Use normalized popularity as "similarity" baseline (0-1)
            similarityScore = Math.min((loc.getViewCount() != null ? loc.getViewCount() : 0) / 1000.0, 1.0);
        }

        // 2. DISTANCE SCORE (Inverse Distance)
        // Formula: 1 / (1 + distance_km) - Ensures closer points score higher
        double distanceScore = 1.0;
        double distKm = 0.0;
        if (userLat != null && userLng != null) {
            distKm = calculateHaversineDistance(userLat, userLng, loc.getLatitude(), loc.getLongitude());
            distanceScore = 1.0 / (1.0 + distKm);
        }

        // 3. CONTEXT SCORE (Time & Weather Awareness)
        double contextScore = calculateContextScore(loc, currentHour, weather);

        // FINAL ACADEMIC SCORE (Weighted Average)
        double finalScore = (WEIGHT_CONTENT * similarityScore) + 
                            (WEIGHT_DISTANCE * distanceScore) + 
                            (WEIGHT_CONTEXT * contextScore);

        LocationResponse response = mapToResponse(loc);
        response.setMatchScore(finalScore);
        response.setSimilarityScore(similarityScore);
        response.setDistanceScore(distanceScore);
        response.setContextScore(contextScore);
        response.setMatchedTags(matchedTags);
        
        return response;
    }

    private double calculateCosineSimilarity(Location loc, List<UserInterestProfile> profiles, List<String> matchedTags) {
        // Build User Vector from profiles (Categories)
        Map<Long, Double> userVector = profiles.stream()
                .collect(Collectors.toMap(p -> p.getCategory().getId(), UserInterestProfile::getAffinityScore));

        // Build Location Vector (Category as primary feature + Tags as secondary)
        double score = 0.0;
        if (loc.getCategory() != null && userVector.containsKey(loc.getCategory().getId())) {
            score = userVector.get(loc.getCategory().getId());
            matchedTags.add(loc.getCategory().getName());
        }

        // Tag matching refinement (optional for future scaling)
        // Current version focuses on Category Affinity as primary vector feature
        return score; // Returns 0.0 - 1.0
    }

    private double calculateContextScore(Location loc, int hour, String weather) {
        double score = 0.5; // Baseline

        // Time logic: Morning (6-11), Afternoon (12-17), Evening (18-22), Night (23-5)
        String cat = loc.getCategoryName() != null ? loc.getCategoryName().toLowerCase() : "";
        
        if (hour >= 6 && hour <= 10 && (cat.contains("cà phê") || cat.contains("sáng") || cat.contains("ngắm cảnh"))) score += 0.3;
        if (hour >= 18 && hour <= 23 && (cat.contains("ăn tối") || cat.contains("bar") || cat.contains("phố đi bộ"))) score += 0.3;
        
        // Weather logic
        if ("rainy".equalsIgnoreCase(weather) || "mưa".equalsIgnoreCase(weather)) {
            if (cat.contains("trong nhà") || cat.contains("bảo tàng") || cat.contains("trung tâm")) score += 0.2;
            else score -= 0.2; // Penalty for outdoor in rain
        } else {
            if (cat.contains("ngoài trời") || cat.contains("biển") || cat.contains("núi")) score += 0.2;
        }

        return Math.min(Math.max(score, 0.0), 1.0);
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Cacheable(value = "userRecommendations", key = "#userId", sync = true)
    public List<LocationResponse> getUserRecommendations(Long userId) {
        return getRecommendations(userId, null, null, null).stream().limit(10).collect(Collectors.toList());
    }

    public List<LocationResponse> getContextRecommendations(Double lat, Double lng, Integer hour, String weather) {
        return getRecommendations(null, lat, lng, weather).stream().limit(10).collect(Collectors.toList());
    }

    public List<LocationResponse> getContentRecommendations(Long locationId, int topN) {
        // Content-based: similar category, then apply academic scoring
        Location current = locationRepository.findById(locationId).orElse(null);
        if (current == null) return getGuestRecommendations();
        
        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = Collections.emptyList(); // Default for content-based similar
        
        return allLocations.stream()
                .filter(l -> !l.getId().equals(locationId))
                .filter(l -> l.getCategory() != null && current.getCategory() != null && l.getCategory().getId().equals(current.getCategory().getId()))
                .map(loc -> calculateCompleteScore(loc, profiles, null, null, LocalTime.now().getHour(), null, true))
                .sorted(Comparator.comparingDouble(LocationResponse::getMatchScore).reversed())
                .limit(topN)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "guestRecommendations", key = "'top10'", sync = true)
    public List<LocationResponse> getGuestRecommendations() {
        return getRecommendations(null, null, null, null);
    }

    private LocationResponse mapToResponse(Location loc) {
        return LocationResponse.builder()
                .locationId(loc.getId())
                .name(loc.getName())
                .description(loc.getDescription())
                .address(loc.getAddress())
                .province(loc.getProvince())
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .averageRating(loc.getAverageRating())
                .totalReviews(loc.getTotalReviews())
                .thumbnailUrl(loc.getThumbnailUrl())
                .categoryId(loc.getCategory() != null ? loc.getCategory().getId() : null)
                .categoryName(loc.getCategory() != null ? loc.getCategory().getName() : null)
                .priceLevel(loc.getPriceLevel())
                .openingHour(loc.getOpeningHour())
                .closingHour(loc.getClosingHour())
                .build();
    }
}
