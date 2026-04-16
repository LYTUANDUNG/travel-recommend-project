package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationResponse;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CollaborativeRecommendationService {

    public List<LocationResponse> mapAiRankedItems(List<AiRecommendationClient.AiRankedItem> rankedItems,
                                                   java.util.function.Function<List<Long>, List<LocationResponse>> finderByIds) {
        if (rankedItems == null || rankedItems.isEmpty()) return List.of();

        Map<Long, Double> scoreById = rankedItems.stream()
                .collect(Collectors.toMap(AiRecommendationClient.AiRankedItem::placeId, AiRecommendationClient.AiRankedItem::score, (a, b) -> a));

        Map<Long, Integer> orderIndex = new java.util.HashMap<>();
        for (int i = 0; i < rankedItems.size(); i++) {
            orderIndex.put(rankedItems.get(i).placeId(), i);
        }

        List<LocationResponse> mapped = finderByIds.apply(rankedItems.stream().map(AiRecommendationClient.AiRankedItem::placeId).toList());
        mapped.forEach(loc -> loc.setMatchScore(scoreById.getOrDefault(loc.getLocationId(), 0.0)));
        mapped.forEach(loc -> loc.setRecommendationReason("AI ranked by collaborative/content similarity"));
        return mapped.stream()
                .sorted(Comparator.comparingInt(loc -> orderIndex.getOrDefault(loc.getLocationId(), Integer.MAX_VALUE)))
                .toList();
    }
}
