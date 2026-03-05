package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.UserBehaviorLogRequest;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.domain.entity.UserBehaviorLog;
import com.travel.recommendation.repository.LocationRepository;
import com.travel.recommendation.repository.UserBehaviorLogRepository;
import com.travel.recommendation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserBehaviorService {

    private final UserBehaviorLogRepository logRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

    @Transactional
    public void logBehavior(UserBehaviorLogRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));

        UserBehaviorLog log = UserBehaviorLog.builder()
                .user(user)
                .sessionId(request.getSessionId())
                .location(location)
                .actionType(UserBehaviorLog.ActionType.valueOf(request.getActionType()))
                .timeSpentSeconds(request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds() : 0)
                .deviceType(request.getDeviceType())
                .build();

        logRepository.save(log);
    }
}
