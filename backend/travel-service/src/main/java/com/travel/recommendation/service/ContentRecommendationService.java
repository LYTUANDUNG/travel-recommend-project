package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.UserInterestProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ContentRecommendationService {

    public double similarityScore(Location loc, List<UserInterestProfile> profiles, List<String> matchedTags, boolean coldStart) {
        if (coldStart) {
            return Math.min((loc.getViewCount() != null ? loc.getViewCount() : 0) / 1000.0, 1.0);
        }

        Map<Long, Double> userVector = profiles.stream()
                .collect(Collectors.toMap(p -> p.getCategory().getId(), UserInterestProfile::getAffinityScore));

        if (loc.getCategory() != null && userVector.containsKey(loc.getCategory().getId())) {
            matchedTags.add(loc.getCategory().getName());
            return userVector.get(loc.getCategory().getId());
        }
        return 0.0;
    }

    public List<LocationResponse> fallbackByCategory(Location current, List<Location> allLocations, int topN, java.util.function.Function<Location, LocationResponse> mapper) {
        if (current == null) return List.of();
        return allLocations.stream()
                .filter(l -> !l.getId().equals(current.getId()))
                .filter(l -> l.getCategory() != null && current.getCategory() != null && l.getCategory().getId().equals(current.getCategory().getId()))
                .map(mapper)
                .limit(topN)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
