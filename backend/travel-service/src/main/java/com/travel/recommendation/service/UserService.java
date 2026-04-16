package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.PasswordResetToken;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import com.travel.recommendation.adapter.out.persistence.UserInterestProfileRepository;
import com.travel.recommendation.adapter.out.persistence.CategoryRepository;
import com.travel.recommendation.adapter.out.persistence.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserInterestProfileRepository userInterestProfileRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public java.util.List<User> findAll() {
        return userRepository.findAll();
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
                // User must wait 30 days
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
            String nationality) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (fullName != null) user.setFullName(fullName);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        if (gender != null) user.setGender(gender);
        if (birthYear != null) user.setBirthYear(birthYear);
        if (nationality != null) user.setNationality(nationality);

        return userRepository.save(user);
    }

    @Transactional
    public void saveUserInterests(Long userId, List<Long> categoryIds) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        // Delete old
        List<com.travel.recommendation.domain.entity.UserInterestProfile> oldProfiles = userInterestProfileRepository.findByIdUserId(userId);
        userInterestProfileRepository.deleteAll(oldProfiles);
        
        // Setup new
        for (Long catId : categoryIds) {
            com.travel.recommendation.domain.entity.Category category = categoryRepository.findById(catId).orElse(null);
            if (category != null) {
                com.travel.recommendation.domain.entity.UserInterestProfileId id = new com.travel.recommendation.domain.entity.UserInterestProfileId(userId, catId);
                com.travel.recommendation.domain.entity.UserInterestProfile profile = com.travel.recommendation.domain.entity.UserInterestProfile.builder()
                        .id(id)
                        .user(user)
                        .category(category)
                        .affinityScore(5.0) // Strong explicit baseline
                        .build();
                userInterestProfileRepository.save(profile);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getUserInterestIds(Long userId) {
        return userInterestProfileRepository.findByIdUserId(userId).stream()
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
        
        // Remove old token if any
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
