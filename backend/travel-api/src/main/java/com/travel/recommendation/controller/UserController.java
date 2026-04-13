package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
 
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(
            userService.findAll().stream().map(this::mapToDto).collect(Collectors.toList()),
            "Users fetched successfully"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(@PathVariable Long id) {
        return userService.findById(id)
                .map(user -> ResponseEntity.ok(ApiResponse.success(mapToDto(user), "User fetched successfully")))
                .orElse(ResponseEntity.ok(ApiResponse.<UserDto>error("User not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUserProfile(@PathVariable Long id, @RequestBody User request) {
        return userService.findById(id)
                .map(existingUser -> {
                    // Update allowed fields
                    if (request.getFullName() != null)
                        existingUser.setFullName(request.getFullName());
                    if (request.getPhoneNumber() != null)
                        existingUser.setPhoneNumber(request.getPhoneNumber());
                    if (request.getAvatarUrl() != null)
                        existingUser.setAvatarUrl(request.getAvatarUrl());
                    if (request.getGender() != null)
                        existingUser.setGender(request.getGender());
                    if (request.getBirthYear() != null)
                        existingUser.setBirthYear(request.getBirthYear());
                    if (request.getNationality() != null)
                        existingUser.setNationality(request.getNationality());

                    User updatedUser = userService.registerUser(existingUser); // Acts as save
                    return ResponseEntity
                            .ok(ApiResponse.success(mapToDto(updatedUser), "Profile updated successfully"));
                })
                .orElse(ResponseEntity.ok(ApiResponse.<UserDto>error("User not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<UserDto>> uploadAvatar(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String avatarUrl = body.get("avatar_url");
        if (avatarUrl == null) return ResponseEntity.ok(ApiResponse.error("Avatar URL is required"));
        
        try {
            User updatedUser = userService.updateAvatar(id, avatarUrl);
            return ResponseEntity.ok(ApiResponse.success(mapToDto(updatedUser), "Avatar updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/interests")
    public ResponseEntity<ApiResponse<Void>> saveUserInterests(@PathVariable Long id, @RequestBody List<Long> categoryIds) {
        userService.saveUserInterests(id, categoryIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Interests saved successfully"));
    }

    @GetMapping("/{id}/interests")
    public ResponseEntity<ApiResponse<List<Long>>> getUserInterests(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserInterestIds(id), "Fetched"));
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .user_id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .full_name(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .created_at(user.getCreatedAt())
                .avatar_url(user.getAvatarUrl())
                // Basic demographics
                .phone_number(user.getPhoneNumber())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .birth_year(user.getBirthYear())
                .nationality(user.getNationality())
                .interests(Collections.emptyList())
                .build();
    }
}
