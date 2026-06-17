package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.AuthRequest;
import com.travel.recommendation.domain.dto.RegisterRequest;
import com.travel.recommendation.domain.dto.UserDto;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.domain.exception.BadRequestException;
import com.travel.recommendation.domain.mapper.UserMapper;
import com.travel.recommendation.service.UserService;
import com.travel.recommendation.service.EmailService;
import com.travel.recommendation.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody AuthRequest request) {
        log.info("Yêu cầu đăng nhập từ email: {}", request.getEmail());
        
        User user = userService.findByEmail(request.getEmail())
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> userService.matchesPassword(request.getPassword(), u.getPassword()))
                .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu không chính xác"));

        userService.updateLastLogin(user.getId());
        String token = tokenProvider.generateToken(user.getId(), "ROLE_" + user.getRole().name());
        
        UserDto dto = userMapper.toDto(user);
        dto.setToken(token);
        
        return ResponseEntity.ok(ApiResponse.success(dto, "Đăng nhập thành công"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        User savedUser = userService.registerNewUser(request);
        String token = tokenProvider.generateToken(savedUser.getId(), "ROLE_" + savedUser.getRole().name());
        
        UserDto dto = userMapper.toDto(savedUser);
        dto.setToken(token);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Đăng ký tài khoản thành công"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) throw new BadRequestException("Vui lòng cung cấp email");
        
        String token = userService.createPasswordResetToken(email);
        emailService.sendPasswordResetEmail(email, token);
        return ResponseEntity.ok(ApiResponse.success(null, "Email khôi phục đã được gửi. Vui lòng kiểm tra hộp thư."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("new_password");
        
        if (token == null || newPassword == null) {
            throw new BadRequestException("Yêu cầu cung cấp mã khôi phục và mật khẩu mới");
        }
        
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok(ApiResponse.success(null, "Mật khẩu đã được thay đổi thành công."));
    }

    @PostMapping("/contact-email")
    public ResponseEntity<ApiResponse<Void>> contactEmail(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String subject = body.get("subject");
        String message = body.get("message");

        if (name == null || email == null || message == null) {
            throw new BadRequestException("Vui lòng nhập đầy đủ họ tên, email và nội dung tin nhắn");
        }

        String mailSubject = "VinaTravel - Tin nhắn liên hệ mới: " + (subject != null ? subject : "Không có tiêu đề");
        String mailBody = "Họ tên người gửi: " + name + "\n" +
                "Email người gửi: " + email + "\n" +
                "Tiêu đề: " + (subject != null ? subject : "Không có tiêu đề") + "\n\n" +
                "Nội dung lời nhắn:\n" + message + "\n\n" +
                "-----------------------------------------\n" +
                "Email này được gửi tự động từ hệ thống VinaTravel.";

        try {
            emailService.sendEmail("lydung853@gmail.com", mailSubject, mailBody);
        } catch (Exception e) {
            log.error("Không thể gửi email thông báo cho admin: {}", e.getMessage());
        }

        String receiptSubject = "Xác nhận tiếp nhận liên hệ - VinaTravel";
        String receiptBody = "Chào " + name + ",\n\n" +
                "Chúng tôi đã tiếp nhận lời nhắn của bạn gửi đến hệ thống VinaTravel với nội dung sau:\n\n" +
                "Tiêu đề: " + (subject != null ? subject : "Không có tiêu đề") + "\n" +
                "Nội dung: " + message + "\n\n" +
                "Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi lại bạn sớm nhất có thể.\n\n" +
                "Trân trọng,\n" +
                "Đội ngũ VinaTravel";
        try {
            emailService.sendEmail(email, receiptSubject, receiptBody);
        } catch (Exception e) {
            log.error("Không thể gửi email xác nhận cho khách hàng: {}", e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Gửi tin nhắn liên hệ thành công"));
    }
}
