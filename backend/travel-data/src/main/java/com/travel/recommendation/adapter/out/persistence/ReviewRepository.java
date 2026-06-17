package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    @EntityGraph(attributePaths = {"user", "location"})
    List<Review> findByLocation_Id(Long locationId);

    @EntityGraph(attributePaths = {"user", "location"})
    List<Review> findByUser_Id(Long userId);
    
    @EntityGraph(attributePaths = {"user", "location"})
    List<Review> findByLocation_IdAndVerifyStatus(Long locationId, Review.VerifyStatus verifyStatus);

    @EntityGraph(attributePaths = {"user", "location"})
    List<Review> findByLocation_IdAndVerifyStatusNot(Long locationId, Review.VerifyStatus verifyStatus);

    @Override
    @EntityGraph(attributePaths = {"user", "location"})
    List<Review> findAll();
    
    @Query("SELECT AVG(r.rating) FROM Review r")
    Double getAverageRating();

    @Query("SELECT COUNT(r) FROM Review r WHERE r.createdAt > ?1")
    long countByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT COUNT(r), AVG(r.rating) FROM Review r WHERE r.location.id = ?1")
    List<Object[]> getReviewStats(Long locationId);

    boolean existsByUser_IdAndLocation_Id(Long userId, Long locationId);

    @EntityGraph(attributePaths = {"user", "location"})
    @Query("SELECT r FROM Review r WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(r.comment) LIKE LOWER(:query) OR " +
           "LOWER(r.user.fullName) LIKE LOWER(:query) OR " +
           "LOWER(r.location.name) LIKE LOWER(:query))")
    org.springframework.data.domain.Page<Review> searchReviews(@Param("query") String query, org.springframework.data.domain.Pageable pageable);
}
