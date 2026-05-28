package com.travel.recommendation.service;

import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.UserBehaviorLogRepository;
import com.travel.recommendation.adapter.out.persistence.UserInterestProfileRepository;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import com.travel.recommendation.domain.dto.BehaviorLogRequest;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.domain.entity.UserBehaviorLog;
import com.travel.recommendation.domain.entity.UserInterestProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BehaviorLogService {

    private final UserBehaviorLogRepository logRepository;
    private final UserInterestProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

    @Transactional
    public void logBehavior(BehaviorLogRequest request) {
        User user = userRepository.findById(request.getUserId()).orElse(null);
        Location location = locationRepository.findById(request.getLocationId()).orElse(null);

        if (user == null || location == null) return;

        // 1. Save Log
        UserBehaviorLog log = UserBehaviorLog.builder()
                .user(user)
                .location(location)
                .actionType(UserBehaviorLog.ActionType.valueOf(request.getAction()))
                .sessionId(request.getSessionId())
                .deviceType(request.getDeviceType())
                .timeSpentSeconds(request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds() : 0)
                .build();
        logRepository.save(log);

        // 2. Increment Location View Count if action is VIEW_DETAILS
        if ("VIEW_DETAILS".equals(request.getAction())) {
            location.setViewCount(location.getViewCount() + 1);
            locationRepository.save(location);
        }

        // 3. Update Interest Profile
        updateInterestProfile(user, location, request.getAction());
    }

    private void updateInterestProfile(User user, Location location, String action) {
        if (location.getCategory() == null) return;

        double weight = switch (action) {
            case "ADD_FAVORITE" -> 0.5;
            case "CLICK_BOOKING" -> 0.8;
            case "VIEW_MAP" -> 0.2;
            default -> 0.1; // VIEW_DETAILS
        };

        UserInterestProfile profile = profileRepository.findByUserIdAndCategoryId(user.getId(), location.getCategory().getId())
                .orElse(UserInterestProfile.builder()
                        .user(user)
                        .category(location.getCategory())
                        .affinityScore(0.0)
                        .build());

        profile.setAffinityScore(profile.getAffinityScore() + weight);
        profileRepository.save(profile);
    }
}
