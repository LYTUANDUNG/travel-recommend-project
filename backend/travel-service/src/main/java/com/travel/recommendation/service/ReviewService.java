package com.travel.recommendation.service;

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

    @Transactional(readOnly = true)
    public List<Review> getReviewsByLocation(Long locationId) {
        return reviewRepository.findByLocationId(locationId);
    }

    @Transactional
    public Review saveReview(Review review) {
        return reviewRepository.save(review);
    }
}
