package com.travel.recommendation.domain.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequest {
    private String name;
    private String description;
    private String address;
    private String ward;
    private String district;
    private String province;
    private Double latitude;
    private Double longitude;
    private Long categoryId;
    private Integer priceLevel;
    private String priceRangeStr;
    private String openingHour;
    private String closingHour;
    private String thumbnailUrl;
    private List<String> images;
    private List<TagDto> tags;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagDto {
        private String name;
        private Double weight;
    }
}
