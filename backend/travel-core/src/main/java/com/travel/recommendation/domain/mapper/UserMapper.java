package com.travel.recommendation.domain.mapper;

import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) return null;
        
        return UserDto.builder()
                .user_id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .full_name(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .created_at(user.getCreatedAt())
                .avatar_url(user.getAvatarUrl())
                .phone_number(user.getPhoneNumber())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .birth_year(user.getBirthYear())
                .nationality(user.getNationality())
                .is_active(user.getIsActive())
                .interests(user.getInterests() != null ? Arrays.asList(user.getInterests().split(",")) : Collections.emptyList())
                .build();
    }
}
