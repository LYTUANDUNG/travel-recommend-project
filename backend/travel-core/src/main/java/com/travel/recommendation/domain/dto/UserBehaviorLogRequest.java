package com.travel.recommendation.domain.dto;

import lombok.Data;

@Data
public class UserBehaviorLogRequest {
    private Long userId; // Nullable for anonymous
    private String sessionId;
    private Long locationId;
    private String actionType; // VIEW_DETAILS, CLICK_BOOKING, ADD_FAVORITE, VIEW_MAP
    private Integer timeSpentSeconds; // Dwell time
    private String deviceType;
}
