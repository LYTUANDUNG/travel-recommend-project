package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.BehaviorLogRequest;
import com.travel.recommendation.service.BehaviorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/behavior")
@RequiredArgsConstructor
public class BehaviorController {

    private final BehaviorLogService behaviorLogService;

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<Void>> logBehavior(@RequestBody BehaviorLogRequest request) {
        try {
            behaviorLogService.logBehavior(request);
            return ResponseEntity.ok(ApiResponse.success(null, "Behavior logged successfully"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to log behavior: " + e.getMessage()));
        }
    }
}
