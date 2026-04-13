package com.travel.recommendation.domain.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.*;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class LocationResponse {
    private Long locationId;
    private String name;
    private String description;
    private String previewExperience;
    private String address;
    private String ward;
    private String district;
    private String province;
    private Double latitude;
    private Double longitude;
    private Long categoryId;
    private String categoryName;
    private Integer priceLevel;
    private String priceRangeStr;
    private LocalTime openingHour;
    private LocalTime closingHour;
    private String thumbnailUrl;
    private List<String> images;
    private Double averageRating;
    private Integer totalReviews;
    private List<TagResponse> tags;
    private Double matchScore;
    private Double similarityScore;
    private Double distanceScore;
    private Double contextScore;
    private List<String> matchedTags;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagResponse {
        private Long tagId;
        private String name;
        private Double weight;
    }
}
