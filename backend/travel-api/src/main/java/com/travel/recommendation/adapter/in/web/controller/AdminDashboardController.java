package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.ReviewRepository;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import com.travel.recommendation.adapter.out.persistence.UserBehaviorLogRepository;
import com.travel.recommendation.domain.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final ReviewRepository reviewRepository;
    private final UserBehaviorLogRepository behaviorLogRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            stats.put("total_users", userRepository.count());
            stats.put("total_locations", locationRepository.count());
            stats.put("total_reviews", reviewRepository.count());
            
            LocalDateTime lastMonth = LocalDateTime.now().minusDays(30);
            
            // Basic counts
            long totalUsers = userRepository.count();
            long totalLocations = locationRepository.count();
            long totalReviews = reviewRepository.count();
            
            stats.put("total_users", totalUsers);
            stats.put("total_locations", totalLocations);
            stats.put("total_reviews", totalReviews);
            stats.put("total_visits", behaviorLogRepository.count());
            
            // Simple trends (Count new items in last 7 days)
            LocalDateTime lastWeek = LocalDateTime.now().minusDays(7);
            long newUsers = userRepository.countByCreatedAtAfter(lastWeek);
            long newLocations = locationRepository.countByCreatedAtAfter(lastWeek);
            long newReviews = reviewRepository.countByCreatedAtAfter(lastWeek);
            
            stats.put("user_trend", calculateTrend(totalUsers, newUsers));
            stats.put("location_trend", calculateTrend(totalLocations, newLocations));
            stats.put("review_trend", calculateTrend(totalReviews, newReviews));
            
            Double avgRating = reviewRepository.getAverageRating();
            stats.put("avg_rating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
            
            // Efficient charting (Show last 30 days)
            List<UserBehaviorLogRepository.BehaviorStats> behaviorStats = behaviorLogRepository.getActionStatsByDate(lastMonth);
            stats.put("activity_stats", behaviorStats);
            
            // Add AI Metrics from Python Service evaluation results
            try {
                // Use absolute path to ensure stability across different CWDs
                String metricsPath = "d:/TLTN/FE/python_ai_service/evaluation_results/metrics.json";
                java.io.File metricsFile = new java.io.File(metricsPath);
                if (metricsFile.exists()) {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, Object> aiMetrics = mapper.readValue(metricsFile, Map.class);
                    stats.put("ai_metrics", aiMetrics);
                } else {
                    System.err.println("AI Metrics file not found at: " + metricsFile.getAbsolutePath());
                }
            } catch (Exception e) {
                System.err.println("Could not load AI metrics: " + e.getMessage());
            }
            
            String metricsInfo = stats.containsKey("ai_metrics") ? " (with AI metrics)" : " (metrics not found)";
            return ResponseEntity.ok(ApiResponse.success(stats, "Dashboard statistics fetched successfully" + metricsInfo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(ApiResponse.success(new HashMap<>(), "Warning: Stats failed: " + e.getMessage()));
        }
    }

    private String calculateTrend(long total, long newCount) {
        if (total == 0 || newCount == 0) return "+0.0%";
        if (total == newCount) return "+100.0%";
        double percentage = (double) newCount / (total - newCount) * 100;
        if (percentage > 100) return "+100.0%"; // Cap for clean UI
        return String.format("+%.1f%%", percentage);
    }
}
