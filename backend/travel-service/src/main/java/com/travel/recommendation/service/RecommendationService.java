package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.UserInterestProfile;
import com.travel.recommendation.domain.mapper.LocationMapper;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.UserInterestProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Phân hệ gợi ý dựa trên nội dung (Content-Based Filtering) kết hợp sở thích người dùng.
 * Công thức: Điểm tổng hợp = Điểm tương đồng nội dung * 0.7 + Điểm sở thích * 0.3
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
    private final LocationMapper locationMapper;

    @Cacheable(value = "userRecommendations", key = "#p0 != null ? #p0 : 'guest'", sync = true)
    public List<LocationResponse> getRecommendations(Long userId) {
        List<Location> allLocations = locationRepository.findAll();
        List<UserInterestProfile> profiles = userId != null ? profileRepository.findByUserId(userId) : Collections.emptyList();
        
        final String userInterests = userId != null 
                ? userRepository.findById(userId).map(com.travel.recommendation.domain.entity.User::getInterests).orElse(null) 
                : null;
        
        // Khởi động lạnh (Cold Start): Gợi ý các địa điểm phổ biến nếu chưa có hồ sơ sở thích
        boolean isColdStart = profiles.isEmpty();
        if (allLocations.isEmpty()) return List.of();

        return allLocations.stream()
                .map(loc -> calculateCompleteScore(loc, profiles, userInterests, isColdStart))
                .sorted(Comparator.comparingDouble(LocationResponse::getMatchScore).reversed())
                .limit(20)
                .collect(Collectors.toList());
    }

    private LocationResponse calculateCompleteScore(Location loc, List<UserInterestProfile> profiles, String userInterests, boolean isColdStart) {
        
        // 1. Độ tương đồng nội dung (Tính toán Cosine Similarity qua trọng số của các thẻ Tags trùng lặp)
        List<String> matchedTags = new ArrayList<>();
        double similarityScore = contentRecommendationService.similarityScore(loc, profiles, matchedTags, isColdStart);

        // 2. Độ ưu tiên theo sở thích khai báo lúc đăng ký (Đẩy hạng danh mục ưu thích)
        double interestScore = 0.0;
        if (userInterests != null && loc.getCategory() != null) {
            if (userInterests.toLowerCase().contains(loc.getCategory().getName().toLowerCase())) {
                interestScore = 0.5; // Điểm thưởng khi trùng khớp danh mục sở thích
            }
        }

        // Điểm đánh giá cuối cùng
        double finalScore = (similarityScore * 0.7) + (interestScore * 0.3);

        LocationResponse response = locationMapper.toResponse(loc);
        response.setMatchScore(finalScore);
        response.setSimilarityScore(similarityScore);
        response.setDistanceScore(0.0);
        response.setContextScore(0.0);
        response.setMatchedTags(matchedTags);
        response.setRecommendationReason(String.format(
                "Độ tương đồng %.0f%%",
                similarityScore * 100.0
        ));
        
        return response;
    }

    @Cacheable(value = "userRecommendations", key = "#p0", sync = true)
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

        // Dự phòng khi gọi AI thất bại: Gợi ý theo độ tương đồng danh mục địa điểm và tính điểm tại chỗ
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

    private List<LocationResponse> findResponsesByIds(List<Long> ids) {
        return locationRepository.findAllById(ids).stream()
                .map(locationMapper::toResponse)
                .toList();
    }
}

