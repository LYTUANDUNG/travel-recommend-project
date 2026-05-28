package com.travel.recommendation.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    @JsonProperty("review_id")
    private Long reviewId;
    @JsonProperty("user_id")
    private Long userId;
    @JsonProperty("user_name")
    private String userName;
    @JsonProperty("user_avatar")
    private String userAvatar;
    @JsonProperty("location_id")
    @NotNull(message = "location_id is required")
    private Long locationId;
    @JsonProperty("location_name")
    private String locationName;
    @NotNull(message = "rating is required")
    @Min(value = 1, message = "rating must be between 1 and 5")
    @Max(value = 5, message = "rating must be between 1 and 5")
    private Integer rating;
    private String comment;
    @JsonProperty("images_json")
    private List<String> images;
    private String verifyStatus;
    @JsonProperty("visit_date")
    private LocalDate visitDate;

    @JsonProperty("is_edited")
    private boolean isEdited;
    private LocalDateTime createdAt;
}
