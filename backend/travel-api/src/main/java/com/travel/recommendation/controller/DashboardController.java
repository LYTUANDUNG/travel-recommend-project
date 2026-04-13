package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.repository.LocationRepository;
import com.travel.recommendation.repository.UserRepository;
import com.travel.recommendation.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalLocations = locationRepository.count();
        long totalUsers = userRepository.count();
        long totalReviews = reviewRepository.count();
        
        stats.put("total_locations", totalLocations);
        stats.put("total_users", totalUsers);
        stats.put("total_reviews", totalReviews);
        stats.put("total_photos", totalLocations * 3);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
