package com.travel.recommendation.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteDto {
    private Long id;
    @JsonProperty("user_id")
    private Long userId;
    @JsonProperty("location_id")
    private Long locationId;
    private LocationResponse location;
}
