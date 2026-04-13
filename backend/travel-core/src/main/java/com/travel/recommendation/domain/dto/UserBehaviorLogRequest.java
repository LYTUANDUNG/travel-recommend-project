package com.travel.recommendation.domain.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class UserBehaviorLogRequest {
    private Long userId; // Nullable for anonymous
    private String sessionId;
    private Long locationId;
    private String actionType; // VIEW_DETAILS, CLICK_BOOKING, ADD_FAVORITE, VIEW_MAP
    private Integer timeSpentSeconds; // Dwell time
    private String deviceType;
}
