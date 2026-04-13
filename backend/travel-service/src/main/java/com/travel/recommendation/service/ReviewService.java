package com.travel.recommendation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.recommendation.domain.dto.ReviewDto;
import com.travel.recommendation.domain.entity.Review;
import com.travel.recommendation.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final com.travel.recommendation.repository.UserRepository userRepository;
    private final com.travel.recommendation.repository.LocationRepository locationRepository;
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
        // Enforce 1 review per location
        if (reviewRepository.existsByUser_IdAndLocation_Id(reviewDto.getUserId(), reviewDto.getLocationId())) {
            throw new RuntimeException("Bạn đã đánh giá địa điểm này rồi. Mỗi người dùng chỉ được đánh giá 1 lần.");
        }

        com.travel.recommendation.domain.entity.User user = userRepository.findById(reviewDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        com.travel.recommendation.domain.entity.Location location = locationRepository.findById(reviewDto.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        // Verification check: User must have an APPROVED visit request for this location
        boolean canReview = visitRequestService.canUserReview(user.getId(), location.getId());
        if (!canReview) {
            List<com.travel.recommendation.domain.dto.VisitRequestDto> requests = visitRequestService.getUserRequests(user.getId());
            String existingStatus = requests.stream()
                .filter(r -> r.getLocationId().equals(location.getId()))
                .map(r -> r.getStatus())
                .collect(java.util.stream.Collectors.joining(", "));
            
            throw new RuntimeException("User must have an APPROVED visit request before reviewing. (User ID: " + user.getId() 
                + ", Location ID: " + location.getId() 
                + ", Detected Statuses for this location: [" + existingStatus + "])");
        }

        Review review = Review.builder()
                .user(user)
                .location(location)
                .rating(reviewDto.getRating())
                .comment(reviewDto.getComment())
                .visitDate(reviewDto.getVisitDate())
                .tripType(reviewDto.getTripType())
                .imagesJson(toJson(reviewDto.getImages()))
                .verifyStatus(Review.VerifyStatus.APPROVED)
                .isEdited(false)
                .build();

        Review savedReview = reviewRepository.save(review);
        locationService.syncStats(savedReview.getLocation().getId());
        return mapToDto(savedReview);
    }

    @Transactional
    public ReviewDto updateReview(Long id, ReviewDto dto) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        
        if (Boolean.TRUE.equals(review.getIsEdited())) {
            throw new RuntimeException("Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất.");
        }

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
                .tripType(review.getTripType())
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
