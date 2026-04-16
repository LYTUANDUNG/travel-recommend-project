package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.ReviewDto;
import com.travel.recommendation.domain.entity.Review;
import com.travel.recommendation.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/location/{locationId}")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getReviewsByLocation(@PathVariable Long locationId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewsByLocation(locationId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> addReview(@Valid @RequestBody ReviewDto reviewDto) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.saveReview(reviewDto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getAllReviews() {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getAllReviews()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReviewDto>> updateReview(@PathVariable Long id, @RequestBody ReviewDto dto) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.updateReview(id, dto), "Cập nhật đánh giá thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReviewDto>> updateStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String statusStr = payload.get("status");
        Review.VerifyStatus status = Review.VerifyStatus.valueOf(statusStr);
        return ResponseEntity.ok(ApiResponse.success(reviewService.updateStatus(id, status)));
    }
}
