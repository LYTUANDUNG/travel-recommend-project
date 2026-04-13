package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.AuthRequest;
import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.service.UserService;
import com.travel.recommendation.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@RequestBody AuthRequest request) {
        // Simple Phase 1 Login (No JWT yet, checking plaintext or just existing email)
        return userService.findByEmail(request.getEmail())
                .filter(user -> request.getPassword().equals(user.getPassword()))
                .map(user -> {
                    userService.updateLastLogin(user.getId());
                    String token = tokenProvider.generateToken(user.getId(), "ROLE_" + user.getRole().name());
                    UserDto dto = mapToDto(user);
                    dto.setToken(token);
                    return ResponseEntity.ok(ApiResponse.success(dto, "Login successful"));
                })
                .orElse(ResponseEntity.ok(ApiResponse.<UserDto>error("Invalid email or password")));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@RequestBody User user) {
        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.ok(ApiResponse.error("Email already exists"));
        }

        user.setRole(User.Role.USER);
        User savedUser = userService.registerUser(user);
        
        String token = tokenProvider.generateToken(savedUser.getId(), "ROLE_" + savedUser.getRole().name());
        UserDto dto = mapToDto(savedUser);
        dto.setToken(token);
        
        return ResponseEntity.ok(ApiResponse.success(dto, "Registration successful"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
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
                .phone_number(user.getPhoneNumber())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .birth_year(user.getBirthYear())
                .nationality(user.getNationality())
                .interests(Collections.emptyList()) // Fetch from actual relations later
                .build();
    }
}
