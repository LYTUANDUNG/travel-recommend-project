package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.UserInterestProfile;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.UserInterestProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * THESIS: Content-Based Recommendation with Academic Scoring System.
 * Formula: Total Score = SimilarityScore
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final LocationRepository locationRepository;
    private final @Lazy UserInterestProfileRepository profileRepository;
    private final @Lazy com.travel.recommendation.adapter.out.persistence.UserRepository userRepository;
    private final AiRecommendationClient aiRecommendationClient;
    private final ContentRecommendationService contentRecommendationService;
    private final CollaborativeRecommendationService collaborativeRecommendationService;
    private final VisitTimeInsightService visitTimeInsightService;

    public List<LocationResponse> getRecommendations(Long userId) {
        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = userId != null ? profileRepository.findByUserId(userId) : Collections.emptyList();
        
        final String userInterests = userId != null 
                ? userRepository.findById(userId).map(com.travel.recommendation.domain.entity.User::getInterests).orElse(null) 
                : null;
        
        // COLD START: Fallback to Guest (Popularity) if no profile data
        boolean isColdStart = profiles.isEmpty();
        if (allLocations.isEmpty()) return List.of();

        return allLocations.stream()
                .map(loc -> calculateCompleteScore(loc, profiles, userInterests, isColdStart))
                .sorted(Comparator.comparingDouble(LocationResponse::getMatchScore).reversed())
                .limit(20)
                .collect(Collectors.toList());
    }

    private LocationResponse calculateCompleteScore(Location loc, List<UserInterestProfile> profiles, String userInterests, boolean isColdStart) {
        
        // 1. CONTENT SIMILARITY (Cosine Similarity approximation via Tag Weighted Overlap)
        List<String> matchedTags = new ArrayList<>();
        double similarityScore = contentRecommendationService.similarityScore(loc, profiles, matchedTags, isColdStart);

        // 2. EXPLICIT INTEREST BOOST (Thesis Requirement: Preference Handling)
        double interestScore = 0.0;
        if (userInterests != null && loc.getCategory() != null) {
            if (userInterests.toLowerCase().contains(loc.getCategory().getName().toLowerCase())) {
                interestScore = 0.5; // Fixed boost for matching declared interest
            }
        }

        // FINAL ACADEMIC SCORE
        double finalScore = (similarityScore * 0.7) + (interestScore * 0.3);

        LocationResponse response = mapToResponse(loc);
        response.setMatchScore(finalScore);
        response.setSimilarityScore(similarityScore);
        response.setDistanceScore(0.0);
        response.setContextScore(0.0);
        response.setMatchedTags(matchedTags);
        response.setRecommendationReason(String.format(
                "Content %.0f%%",
                similarityScore * 100.0
        ));
        
        return response;
    }

    @Cacheable(value = "userRecommendations", key = "#userId", sync = true)
    public List<LocationResponse> getUserRecommendations(Long userId) {
        List<AiRecommendationClient.AiRankedItem> rankedItems = aiRecommendationClient.collaborative(userId, 10);
        if (!rankedItems.isEmpty()) {
            return collaborativeRecommendationService.mapAiRankedItems(rankedItems, this::findResponsesByIds);
        }
        return getRecommendations(userId).stream().limit(10).collect(Collectors.toList());
    }



    @Transactional(readOnly = true)
    public List<LocationResponse> getContentRecommendations(Long locationId, int topN, Long userId) {
        List<AiRecommendationClient.AiRankedItem> rankedItems = aiRecommendationClient.content(locationId, topN, userId);
        if (!rankedItems.isEmpty()) {
            return collaborativeRecommendationService.mapAiRankedItems(rankedItems, this::findResponsesByIds);
        }

        // Fallback content-based: category proximity + local scoring
        Location current = locationRepository.findById(locationId).orElse(null);
        if (current == null) return getGuestRecommendations();

        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = Collections.emptyList();

        return contentRecommendationService.fallbackByCategory(current, allLocations, topN,
                loc -> calculateCompleteScore(loc, profiles, null, true))
                .stream()
                .sorted(Comparator.comparingDouble(LocationResponse::getMatchScore).reversed())
                .toList();
    }

    @Cacheable(value = "guestRecommendations", key = "'top10'", sync = true)
    public List<LocationResponse> getGuestRecommendations() {
        return getRecommendations(null);
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
                .viewCount(loc.getViewCount())
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
