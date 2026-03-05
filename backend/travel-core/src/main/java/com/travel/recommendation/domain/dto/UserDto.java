package com.travel.recommendation.domain.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserDto {
    private Long user_id;
    private String username;
    private String email;
    private String full_name;
    private String avatar_url;
    private String role;
    private LocalDateTime created_at;
    private List<String> interests;
}
