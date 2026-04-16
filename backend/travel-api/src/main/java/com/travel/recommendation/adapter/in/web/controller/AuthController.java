package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.AuthRequest;
import com.travel.recommendation.domain.dto.RegisterRequest;
import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.service.UserService;
import com.travel.recommendation.service.EmailService;
import com.travel.recommendation.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody AuthRequest request) {
        return userService.findByEmail(request.getEmail())
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .filter(user -> userService.matchesPassword(request.getPassword(), user.getPassword()))
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
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.ok(ApiResponse.error("Email already exists"));
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword())
                .fullName(request.getFull_name())
                .birthYear(request.getBirth_year())
                .city(request.getProvince())
                .build();
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

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) return ResponseEntity.ok(ApiResponse.error("Email is required"));
        
        try {
            String token = userService.createPasswordResetToken(email);
            emailService.sendPasswordResetEmail(email, token);
            return ResponseEntity.ok(ApiResponse.success(null, "Email khôi phục đã được gửi. Vui lòng kiểm tra hộp thư."));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("new_password");
        
        if (token == null || newPassword == null) {
            return ResponseEntity.ok(ApiResponse.error("Token and new password are required"));
        }
        
        try {
            userService.resetPassword(token, newPassword);
            return ResponseEntity.ok(ApiResponse.success(null, "Mật khẩu đã được thay đổi thành công."));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
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
                .is_active(user.getIsActive())
                .interests(Collections.emptyList()) // Fetch from actual relations later
                .build();
    }
}
