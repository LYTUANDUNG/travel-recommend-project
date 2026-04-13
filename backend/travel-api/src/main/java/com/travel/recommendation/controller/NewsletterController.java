package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NewsletterController {

    private final NewsletterService newsletterService;

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<String>> subscribe(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Email is required"));
        }
        newsletterService.subscribe(email);
        return ResponseEntity.ok(ApiResponse.success("Subscribed successfully"));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Boolean>> getStatus(@RequestParam String email) {
        return ResponseEntity.ok(ApiResponse.success(newsletterService.isSubscribed(email)));
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<String>> unsubscribe(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Email is required"));
        }
        newsletterService.unsubscribe(email);
        return ResponseEntity.ok(ApiResponse.success("Unsubscribed successfully"));
    }
}
