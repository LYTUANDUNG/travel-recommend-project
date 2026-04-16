package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.UserInterestProfile;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.UserInterestProfileRepository;
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
    private final AiRecommendationClient aiRecommendationClient;
    private final ContentRecommendationService contentRecommendationService;
    private final CollaborativeRecommendationService collaborativeRecommendationService;
    private final ContextRecommendationService contextRecommendationService;
    private final VisitTimeInsightService visitTimeInsightService;

    private static final double WEIGHT_CONTENT = 0.6;
    private static final double WEIGHT_DISTANCE = 0.3;
    private static final double WEIGHT_CONTEXT = 0.1;

    public List<LocationResponse> getRecommendations(Long userId, Double lat, Double lng, String weather) {
        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = userId != null ? profileRepository.findByIdUserId(userId) : Collections.emptyList();
        
        // COLD START: Fallback to Guest (Popularity) if no profile data
        boolean isColdStart = profiles.isEmpty();
        
        int currentHour = LocalTime.now().getHour();

        if (allLocations.isEmpty()) return List.of();

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
        List<String> matchedTags = new ArrayList<>();
        double similarityScore = contentRecommendationService.similarityScore(loc, profiles, matchedTags, isColdStart);

        // 2. DISTANCE SCORE (Inverse Distance)
        // Formula: 1 / (1 + distance_km) - Ensures closer points score higher
        double distanceScore = contextRecommendationService.distanceScore(userLat, userLng, loc);

        // 3. CONTEXT SCORE (Time & Weather Awareness)
        double contextScore = contextRecommendationService.contextScore(loc, currentHour, weather);

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
        response.setRecommendationReason(String.format(
                "Content %.0f%% + Distance %.0f%% + Context %.0f%%",
                similarityScore * 100.0, distanceScore * 100.0, contextScore * 100.0
        ));
        
        return response;
    }

    @Cacheable(value = "userRecommendations", key = "#userId", sync = true)
    public List<LocationResponse> getUserRecommendations(Long userId) {
        List<AiRecommendationClient.AiRankedItem> rankedItems = aiRecommendationClient.collaborative(userId, 10);
        if (!rankedItems.isEmpty()) {
            return collaborativeRecommendationService.mapAiRankedItems(rankedItems, this::findResponsesByIds);
        }
        return getRecommendations(userId, null, null, null).stream().limit(10).collect(Collectors.toList());
    }

    public List<LocationResponse> getContextRecommendations(Double lat, Double lng, Integer hour, String weather) {
        return getRecommendations(null, lat, lng, weather).stream().limit(10).collect(Collectors.toList());
    }

    public List<LocationResponse> getContentRecommendations(Long locationId, int topN) {
        List<AiRecommendationClient.AiRankedItem> rankedItems = aiRecommendationClient.content(locationId, topN);
        if (!rankedItems.isEmpty()) {
            return collaborativeRecommendationService.mapAiRankedItems(rankedItems, this::findResponsesByIds);
        }

        // Fallback content-based: category proximity + local scoring
        Location current = locationRepository.findById(locationId).orElse(null);
        if (current == null) return getGuestRecommendations();

        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = Collections.emptyList();

        return contentRecommendationService.fallbackByCategory(current, allLocations, topN,
                loc -> calculateCompleteScore(loc, profiles, null, null, LocalTime.now().getHour(), null, true))
                .stream()
                .sorted(Comparator.comparingDouble(LocationResponse::getMatchScore).reversed())
                .toList();
    }

    @Cacheable(value = "guestRecommendations", key = "'top10'", sync = true)
    public List<LocationResponse> getGuestRecommendations() {
        return getRecommendations(null, null, null, null);
    }

    private LocationResponse mapToResponse(Location loc) {
        VisitTimeInsightService.VisitTimeInsight insight = visitTimeInsightService.computeBestTime(loc);
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
                .bestTimeToVisit(insight.bestTimeToVisit())
                .bestTimeReason(insight.bestTimeReason())
                .build();
    }

    private List<LocationResponse> findResponsesByIds(List<Long> ids) {
        return locationRepository.findAllById(ids).stream()
                .map(this::mapToResponse)
                .toList();
    }
}
