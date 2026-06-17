package com.travel.recommendation.domain.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.service.VisitTimeInsightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class LocationMapper {

    private final ObjectMapper objectMapper;
    private final VisitTimeInsightService visitTimeInsightService;

    public LocationResponse toResponse(Location loc) {
        if (loc == null) return null;

        VisitTimeInsightService.VisitTimeInsight insight = visitTimeInsightService.computeBestTime(loc);
        
        return LocationResponse.builder()
                .locationId(loc.getId())
                .name(loc.getName())
                .description(loc.getDescription())
                .address(loc.getAddress())
                .district(loc.getDistrict())
                .province(loc.getProvince())
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .categoryId(loc.getCategory() != null ? loc.getCategory().getId() : null)
                .categoryName(loc.getCategory() != null ? loc.getCategory().getName() : null)
                .priceLevel(loc.getPriceLevel())
                .priceRangeStr(loc.getPriceRangeStr())
                .openingHour(loc.getOpeningHour())
                .closingHour(loc.getClosingHour())
                .thumbnailUrl(loc.getThumbnailUrl())
                .averageRating(loc.getAverageRating())
                .totalReviews(loc.getTotalReviews())
                .viewCount(loc.getViewCount())
                .images(deserializeImages(loc.getImagesJson()))
                .tags(loc.getLocationTags() != null ? loc.getLocationTags().stream()
                        .map(lt -> LocationResponse.TagResponse.builder()
                                .tagId(lt.getTag().getId())
                                .name(lt.getTag().getName())
                                .weight(lt.getTag().getWeight())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .bestTimeToVisit(insight.bestTimeToVisit())
                .bestTimeReason(insight.bestTimeReason())
                .build();
    }

    public String serializeImages(List<String> images) {
        if (images == null) return null;
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            log.error("Lỗi chuyển đổi danh sách ảnh sang chuỗi JSON: {}", e.getMessage());
            return "[]";
        }
    }

    public List<String> deserializeImages(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty()) return List.of();
        try {
            String[] images = objectMapper.readValue(imagesJson, String[].class);
            return List.of(images);
        } catch (JsonProcessingException e) {
            log.error("Lỗi phân tích cú pháp JSON danh sách ảnh: {}", e.getMessage());
            return List.of();
        }
    }
}
