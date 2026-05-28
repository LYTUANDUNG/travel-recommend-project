package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.UpdateCurrentUserRequest;
import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.service.UserService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(
            userService.findAll().stream().map(this::mapToDto).collect(Collectors.toList()),
            "Users fetched successfully"
        ));
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<UserDto>>> getPaginatedUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
            userService.findPaginated(query, pageable).map(this::mapToDto),
            "Users fetched successfully"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(@PathVariable Long id) {
        return userService.findById(id)
                .map(user -> ResponseEntity.ok(ApiResponse.success(mapToDto(user), "User fetched successfully")))
                .orElse(ResponseEntity.ok(ApiResponse.<UserDto>error("User not found")));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUserProfile() {
        Long userId = getCurrentUserId();

        return userService.findById(userId)
                .map(user -> ResponseEntity.ok(ApiResponse.success(mapToDto(user), "Current user fetched successfully")))
                .orElse(ResponseEntity.ok(ApiResponse.<UserDto>error("User not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUserProfile(@PathVariable Long id, @RequestBody User request) {
        return userService.findById(id)
                .map(existingUser -> {
                    User updatedUser = userService.updateSelfProfile(
                            existingUser.getId(),
                            request.getFullName(),
                            request.getPhoneNumber(),
                            request.getAvatarUrl(),
                            request.getGender(),
                            request.getBirthYear(),
                            request.getNationality(),
                            request.getInterests()
                    );
                    return ResponseEntity
                            .ok(ApiResponse.success(mapToDto(updatedUser), "Profile updated successfully"));
                })
                .orElse(ResponseEntity.ok(ApiResponse.<UserDto>error("User not found")));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateCurrentUserProfile(@RequestBody UpdateCurrentUserRequest request) {
        Long userId = getCurrentUserId();

        User.Gender gender = null;
        if (request.getGender() != null && !request.getGender().isBlank()) {
            gender = User.Gender.valueOf(request.getGender().toUpperCase());
        }

        User updatedUser = userService.updateSelfProfile(
                userId,
                request.getFullName(),
                request.getPhoneNumber(),
                request.getAvatarUrl(),
                gender,
                request.getBirthYear(),
                request.getNationality(),
                request.getInterests()
        );

        return ResponseEntity.ok(ApiResponse.success(mapToDto(updatedUser), "Profile updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateActiveStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> body) {
        Boolean isActive = body.get("is_active");
        if (isActive == null) {
            return ResponseEntity.ok(ApiResponse.error("is_active is required"));
        }
        User updatedUser = userService.setActiveStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.success(mapToDto(updatedUser), "User status updated successfully"));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateRole(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null) return ResponseEntity.ok(ApiResponse.error("Role is required"));
        
        try {
            User.Role role = User.Role.valueOf(roleStr.toUpperCase());
            User updatedUser = userService.updateRole(id, role);
            return ResponseEntity.ok(ApiResponse.success(mapToDto(updatedUser), "Role updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(ApiResponse.error("Invalid role"));
        }
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody java.util.Map<String, String> body) {
        String oldPassword = body.get("old_password");
        String newPassword = body.get("new_password");
        
        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.ok(ApiResponse.error("Old and new passwords are required"));
        }
        
        try {
            userService.changePassword(getCurrentUserId(), oldPassword, newPassword);
            return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<UserDto>> uploadAvatar(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, @NotBlank String> body) {
        String avatarUrl = body.get("avatar_url");
        if (avatarUrl == null) return ResponseEntity.ok(ApiResponse.error("Avatar URL is required"));
        
        try {
            User updatedUser = userService.updateAvatar(id, avatarUrl);
            return ResponseEntity.ok(ApiResponse.success(mapToDto(updatedUser), "Avatar updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<?> getAvatar(@PathVariable Long id) {
        return userService.findById(id)
                .map(user -> {
                    String avatarUrl = user.getAvatarUrl();
                    if (avatarUrl == null || avatarUrl.isBlank()) {
                        return ResponseEntity.notFound().build();
                    }
                    // Redirect to the actual image URL
                    return ResponseEntity.status(302)
                            .location(java.net.URI.create(avatarUrl))
                            .build();
                })
                .orElse(ResponseEntity.notFound().build());
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
                .is_active(user.getIsActive())
                .interests(user.getInterests() != null ? java.util.Arrays.asList(user.getInterests().split(",")) : java.util.Collections.emptyList())
                .build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String name = authentication.getName();
        try {
            return Long.valueOf(name);
        } catch (NumberFormatException e) {
            // If name is not a number (e.g. username), find user by username or email
            return userService.findByEmail(name)
                    .map(User::getId)
                    .orElseThrow(() -> new RuntimeException("User not found for: " + name));
        }
    }
}
