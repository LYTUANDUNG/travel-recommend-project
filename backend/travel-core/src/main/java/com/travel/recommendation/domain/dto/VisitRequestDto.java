package com.travel.recommendation.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitRequestDto {
    private Long id;
    @JsonProperty("user_id")
    private Long userId;
    @JsonProperty("user_name")
    private String userName;
    @JsonProperty("location_id")
    private Long locationId;
    @JsonProperty("location_name")
    private String locationName;
    private String status;
    @JsonProperty("visit_date")
    private LocalDateTime visitDate;
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    // Helper to keep location object if needed by frontend
    private LocationResponse location;
}
