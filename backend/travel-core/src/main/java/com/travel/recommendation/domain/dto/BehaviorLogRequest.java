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
public class BehaviorLogRequest {
    @JsonProperty("user_id")
    private Long userId;
    
    @JsonProperty("location_id")
    private Long locationId;
    
    private String action; // VIEW_DETAILS, CLICK_BOOKING, ADD_FAVORITE, VIEW_MAP
    private String sessionId;
    
    @JsonProperty("device_type")
    private String deviceType;
    
    @JsonProperty("time_spent_seconds")
    private Integer timeSpentSeconds;
}
