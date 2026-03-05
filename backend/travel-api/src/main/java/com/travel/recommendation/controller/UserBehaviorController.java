package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.UserBehaviorLogRequest;
import com.travel.recommendation.service.UserBehaviorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/behavior")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserBehaviorController {

    private final UserBehaviorService userBehaviorService;

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<Void>> logBehavior(@RequestBody UserBehaviorLogRequest request) {
        try {
            userBehaviorService.logBehavior(request);
            return ResponseEntity.ok(ApiResponse.success(null, "Log saved"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }
}
