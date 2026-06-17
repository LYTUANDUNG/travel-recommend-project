package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.PasswordResetToken;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import com.travel.recommendation.adapter.out.persistence.UserInterestProfileRepository;
import com.travel.recommendation.adapter.out.persistence.CategoryRepository;
import com.travel.recommendation.adapter.out.persistence.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.travel.recommendation.domain.dto.RegisterRequest;
import com.travel.recommendation.domain.exception.BadRequestException;
import com.travel.recommendation.domain.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserInterestProfileRepository userInterestProfileRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final @Lazy PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
    }

    @Transactional(readOnly = true)
    public java.util.List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<User> findPaginated(String query, org.springframework.data.domain.Pageable pageable) {
        return userRepository.searchPaginated(query, pageable);
    }

    @Transactional
    public User registerNewUser(RegisterRequest request) {
        log.info("Bắt đầu xử lý đăng ký tài khoản cho email: {}", request.getEmail());
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email này đã được sử dụng trên hệ thống");
        }

        // Tự sinh username duy nhất nếu người dùng để trống hoặc không hợp lệ
        String requestedUsername = request.getUsername();
        if (requestedUsername == null || requestedUsername.trim().isEmpty()) {
            requestedUsername = request.getEmail().split("@")[0];
        }
        if (requestedUsername.length() < 3) {
            requestedUsername = (requestedUsername + "123").substring(0, 3);
        }

        String uniqueUsername = requestedUsername;
        int count = 1;
        while (userRepository.findByUsername(uniqueUsername).isPresent() || uniqueUsername.length() < 3) {
            uniqueUsername = requestedUsername + count++;
            if (uniqueUsername.length() > 50) {
                uniqueUsername = uniqueUsername.substring(0, 45) + count;
            }
        }

        User user = User.builder()
                .username(uniqueUsername)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFull_name())
                .birthYear(request.getBirth_year())
                .city(request.getProvince())
                .interests(request.getInterests() != null ? String.join(",", request.getInterests()) : null)
                .role(User.Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Đăng ký tài khoản thành công cho user: {}, ID: {}", savedUser.getUsername(), savedUser.getId());
        return savedUser;
    }

    @Transactional
    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean matchesPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    @Transactional
    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    @Transactional
    public User updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getLastAvatarUpdate() != null) {
            LocalDateTime nextAllowed = user.getLastAvatarUpdate().plusDays(30);
            if (LocalDateTime.now().isBefore(nextAllowed)) {
                // Người dùng phải đợi đủ 30 ngày
                long daysLeft = java.time.Duration.between(LocalDateTime.now(), nextAllowed).toDays();
                throw new RuntimeException("Bạn chỉ có thể đổi ảnh đại diện sau 30 ngày. Còn " + daysLeft + " ngày nữa.");
            }
        }

        user.setAvatarUrl(avatarUrl);
        user.setLastAvatarUpdate(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public User updateProfile(Long userId, String fullName, String phoneNumber, User.Gender gender, Integer birthYear, String nationality) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (fullName != null) user.setFullName(fullName);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
        if (gender != null) user.setGender(gender);
        if (birthYear != null) user.setBirthYear(birthYear);
        if (nationality != null) user.setNationality(nationality);
        
        return userRepository.save(user);
    }

    @Transactional
    public User updateSelfProfile(
            Long userId,
            String fullName,
            String phoneNumber,
            String avatarUrl,
            User.Gender gender,
            Integer birthYear,
            String nationality,
            String interests) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (fullName != null) user.setFullName(fullName);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        if (gender != null) user.setGender(gender);
        if (birthYear != null) user.setBirthYear(birthYear);
        if (nationality != null) user.setNationality(nationality);
        if (interests != null) user.setInterests(interests);

        return userRepository.save(user);
    }

    @Transactional
    public void saveUserInterests(Long userId, List<Long> categoryIds) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        // Xóa dữ liệu sở thích cũ
        List<com.travel.recommendation.domain.entity.UserInterestProfile> oldProfiles = userInterestProfileRepository.findByUserId(userId);
        userInterestProfileRepository.deleteAll(oldProfiles);
        
        // Thiết lập dữ liệu sở thích mới
        for (Long catId : categoryIds) {
            com.travel.recommendation.domain.entity.Category category = categoryRepository.findById(catId).orElse(null);
            if (category != null) {
                com.travel.recommendation.domain.entity.UserInterestProfileId id = new com.travel.recommendation.domain.entity.UserInterestProfileId(userId, catId);
                com.travel.recommendation.domain.entity.UserInterestProfile profile = com.travel.recommendation.domain.entity.UserInterestProfile.builder()
                        .id(id)
                        .user(user)
                        .category(category)
                        .affinityScore(5.0) // Mức độ ưu thích cơ sở rõ ràng
                        .build();
                userInterestProfileRepository.save(profile);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getUserInterestIds(Long userId) {
        return userInterestProfileRepository.findByUserId(userId).stream()
                .map(p -> p.getCategory().getId())
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public User setActiveStatus(Long userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(isActive);
        return userRepository.save(user);
    }

    @Transactional
    public User updateRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public String createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));
        
        // Xóa mã khôi phục cũ nếu có
        tokenRepository.deleteByUser(user);
        
        String token = java.util.UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .build();
        
        tokenRepository.save(resetToken);
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Mã khôi phục không hợp lệ"));
        
        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Mã khôi phục đã hết hạn");
        }
        
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        tokenRepository.delete(resetToken);
    }
}
