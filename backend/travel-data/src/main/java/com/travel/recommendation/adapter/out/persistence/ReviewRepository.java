package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByLocation_IdAndVerifyStatusNot(Long locationId, Review.VerifyStatus status);
    List<Review> findByLocation_IdAndVerifyStatus(Long locationId, Review.VerifyStatus status);

    @Query("SELECT COUNT(r), AVG(r.rating) FROM Review r WHERE r.location.id = :locationId AND r.verifyStatus = 'APPROVED'")
    List<Object[]> getReviewStats(@Param("locationId") Long locationId);

    boolean existsByUser_IdAndLocation_Id(Long userId, Long locationId);
}
