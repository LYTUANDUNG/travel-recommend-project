package com.travel.recommendation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.recommendation.domain.dto.ReviewDto;
import com.travel.recommendation.domain.entity.Review;
import com.travel.recommendation.adapter.out.persistence.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final com.travel.recommendation.adapter.out.persistence.UserRepository userRepository;
    private final com.travel.recommendation.adapter.out.persistence.LocationRepository locationRepository;
    private final VisitRequestService visitRequestService;
    private final LocationService locationService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByLocation(Long locationId) {
        // Show all reviews except HIDDEN ones
        return reviewRepository.findByLocation_IdAndVerifyStatusNot(locationId, Review.VerifyStatus.HIDDEN).stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public ReviewDto saveReview(ReviewDto reviewDto) {
//        log.info("Starting saveReview for user {} at location {}", reviewDto.getUserId(), reviewDto.getLocationId());
        
        // Enforce 1 review per location
        if (reviewRepository.existsByUser_IdAndLocation_Id(reviewDto.getUserId(), reviewDto.getLocationId())) {
//            log.warn("User {} already reviewed location {}", reviewDto.getUserId(), reviewDto.getLocationId());
            throw new RuntimeException("Bạn đã đánh giá địa điểm này rồi. Mỗi người dùng chỉ được đánh giá 1 lần.");
        }

        com.travel.recommendation.domain.entity.User user = userRepository.findById(reviewDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        com.travel.recommendation.domain.entity.Location location = locationRepository.findById(reviewDto.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        // Verification check: User must have an APPROVED visit request for this location
        boolean canReview = visitRequestService.canUserReview(user.getId(), location.getId());
        if (!canReview) {
//            log.warn("User {} is not eligible to review location {}. No approved visit found.", user.getId(), location.getId());
            List<com.travel.recommendation.domain.dto.VisitRequestDto> requests = visitRequestService.getUserRequests(user.getId());
            String existingStatus = requests.stream()
                .filter(r -> r.getLocationId().equals(location.getId()))
                .map(r -> r.getStatus())
                .collect(java.util.stream.Collectors.joining(", "));
            
            throw new RuntimeException("Hệ thống chỉ cho phép đánh giá sau khi bạn đã có yêu cầu tham quan được DUYỆT hoặc HOÀN THÀNH. Trạng thái hiện tại: [" + existingStatus + "]");
        }

//        log.info("Creating review entity for user {} and location {}", user.getFullName(), location.getName());
        Review review = Review.builder()
                .user(user)
                .location(location)
                .rating(reviewDto.getRating())
                .comment(reviewDto.getComment())
                .visitDate(reviewDto.getVisitDate())

                .imagesJson(toJson(reviewDto.getImages()))
                .verifyStatus(Review.VerifyStatus.APPROVED)
                .isEdited(false)
                .build();

        try {
            Review savedReview = reviewRepository.save(review);
            visitRequestService.completeApprovedVisitAfterReview(user.getId(), location.getId());
            locationService.syncStats(savedReview.getLocation().getId());
//            log.info("Successfully saved review (ID: {}) and synced stats.", savedReview.getId());
            return mapToDto(savedReview);
        } catch (Exception e) {
//            log.error("Database error while saving review: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public ReviewDto updateReview(Long id, ReviewDto dto) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        
        // Removed the strict one-edit restriction as requested by user
        // We now just mark it as edited.
        
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setImagesJson(toJson(dto.getImages()));
        review.setIsEdited(true);

        Review saved = reviewRepository.save(review);
        locationService.syncStats(saved.getLocation().getId());
        return mapToDto(saved);
    }

    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        Long locationId = review.getLocation().getId();
        reviewRepository.deleteById(id);
        locationService.syncStats(locationId);
    }

    @Transactional
    public ReviewDto updateStatus(Long id, Review.VerifyStatus status) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setVerifyStatus(status);
        Review saved = reviewRepository.save(review);
        locationService.syncStats(saved.getLocation().getId());
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ReviewDto> findPaginated(String query, org.springframework.data.domain.Pageable pageable) {
        String searchQuery = (query != null && !query.trim().isEmpty()) ? "%" + query.trim() + "%" : null;
        return reviewRepository.searchReviews(searchQuery, pageable).map(this::mapToDto);
    }

    public ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .reviewId(review.getId())
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(review.getUser() != null ? review.getUser().getFullName() : null)
                .userAvatar(review.getUser() != null ? review.getUser().getAvatarUrl() : null)
                .locationId(review.getLocation() != null ? review.getLocation().getId() : null)
                .locationName(review.getLocation() != null ? review.getLocation().getName() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .images(fromJson(review.getImagesJson()))
                .verifyStatus(review.getVerifyStatus() != null ? review.getVerifyStatus().name() : null)
                .visitDate(review.getVisitDate())

                .isEdited(Boolean.TRUE.equals(review.getIsEdited()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private String toJson(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isEmpty()) return new java.util.ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new java.util.ArrayList<>();
        }
    }
}
