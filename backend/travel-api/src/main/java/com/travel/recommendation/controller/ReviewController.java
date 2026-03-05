package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Review;
import com.travel.recommendation.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/location/{locationId}")
    public ResponseEntity<ApiResponse<List<Review>>> getReviewsByLocation(@PathVariable Long locationId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewsByLocation(locationId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Review>> addReview(@RequestBody Review review) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.saveReview(review)));
    }
}
