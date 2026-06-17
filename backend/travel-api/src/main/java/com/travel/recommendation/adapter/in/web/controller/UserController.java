package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.UpdateCurrentUserRequest;
import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.domain.exception.BadRequestException;
import com.travel.recommendation.domain.mapper.UserMapper;
import com.travel.recommendation.security.SecurityUtils;
import com.travel.recommendation.service.UserService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
 
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        log.info("Lấy toàn bộ danh sách người dùng (Admin)");
        List<UserDto> users = userService.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users, "Lấy danh sách người dùng thành công"));
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<UserDto>>> getPaginatedUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Lấy danh sách người dùng phân trang: page={}, size={}, query={}", page, size, query);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
            userService.findPaginated(query, pageable).map(userMapper::toDto),
            "Lấy danh sách phân trang thành công"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(user), "Lấy thông tin người dùng thành công"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUserProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(user), "Lấy thông tin cá nhân thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUserProfile(@PathVariable Long id, @RequestBody User request) {
        User existingUser = userService.getUserById(id);
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
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(updatedUser), "Cập nhật thông tin thành công"));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateCurrentUserProfile(@RequestBody UpdateCurrentUserRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();

        User.Gender gender = null;
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                gender = User.Gender.valueOf(request.getGender().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Giới tính cung cấp không hợp lệ");
            }
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

        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(updatedUser), "Cập nhật thông tin cá nhân thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        log.info("Xóa người dùng ID: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa người dùng thành công"));
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateActiveStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> body) {
        Boolean isActive = body.get("is_active");
        if (isActive == null) {
            throw new BadRequestException("Trường is_active là bắt buộc");
        }
        User updatedUser = userService.setActiveStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(updatedUser), "Cập nhật trạng thái người dùng thành công"));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateRole(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null) throw new BadRequestException("Trường role là bắt buộc");
        
        try {
            User.Role role = User.Role.valueOf(roleStr.toUpperCase());
            User updatedUser = userService.updateRole(id, role);
            return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(updatedUser), "Cập nhật quyền người dùng thành công"));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Quyền (role) cung cấp không hợp lệ");
        }
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody java.util.Map<String, String> body) {
        String oldPassword = body.get("old_password");
        String newPassword = body.get("new_password");
        
        if (oldPassword == null || newPassword == null) {
            throw new BadRequestException("Mật khẩu cũ và mật khẩu mới là bắt buộc");
        }
        
        userService.changePassword(SecurityUtils.getCurrentUserId(), oldPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<UserDto>> uploadAvatar(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, @NotBlank String> body) {
        String avatarUrl = body.get("avatar_url");
        if (avatarUrl == null) throw new BadRequestException("Đường dẫn ảnh đại diện là bắt buộc");
        
        User updatedUser = userService.updateAvatar(id, avatarUrl);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(updatedUser), "Cập nhật ảnh đại diện thành công"));
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<?> getAvatar(@PathVariable Long id) {
        User user = userService.getUserById(id);
        String avatarUrl = user.getAvatarUrl();
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        // Điều hướng đến đường dẫn ảnh thật
        return ResponseEntity.status(302)
                .location(java.net.URI.create(avatarUrl))
                .build();
    }

    @PostMapping("/{id}/interests")
    public ResponseEntity<ApiResponse<Void>> saveUserInterests(@PathVariable Long id, @RequestBody List<Long> categoryIds) {
        userService.saveUserInterests(id, categoryIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Lưu danh mục sở thích thành công"));
    }

    @GetMapping("/{id}/interests")
    public ResponseEntity<ApiResponse<List<Long>>> getUserInterests(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserInterestIds(id), "Lấy danh sách sở thích thành công"));
    }
}

