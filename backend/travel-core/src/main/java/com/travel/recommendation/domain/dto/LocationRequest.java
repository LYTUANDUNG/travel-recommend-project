package com.travel.recommendation.domain.dto;

import lombok.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequest {
    @NotBlank(message = "Location name is required")
    @Size(max = 200, message = "Location name must not exceed 200 characters")
    private String name;
    @NotBlank(message = "Description is required")
    private String description;
    private String address;
    private String ward;
    private String district;
    private String province;
    @NotNull(message = "Latitude is required")
    private Double latitude;
    @NotNull(message = "Longitude is required")
    private Double longitude;
    @NotNull(message = "Category is required")
    private Long categoryId;
    @Min(value = 1, message = "Price level must be between 1 and 4")
    @Max(value = 4, message = "Price level must be between 1 and 4")
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
