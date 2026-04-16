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
public class UpdateCurrentUserRequest {
    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String gender;

    @JsonProperty("birth_year")
    private Integer birthYear;

    private String nationality;
}
