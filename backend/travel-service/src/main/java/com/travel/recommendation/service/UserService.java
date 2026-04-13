package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.repository.UserRepository;
import com.travel.recommendation.repository.UserInterestProfileRepository;
import com.travel.recommendation.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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
        // Password encoding will be added in Phase 4 (JWT Integration)
        return userRepository.save(user);
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
}
