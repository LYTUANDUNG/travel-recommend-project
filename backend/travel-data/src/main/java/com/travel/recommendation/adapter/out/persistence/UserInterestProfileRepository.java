package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.UserInterestProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserInterestProfileRepository extends JpaRepository<UserInterestProfile, Long> {
    java.util.Optional<UserInterestProfile> findByUserIdAndCategoryId(Long userId, Long categoryId);
    java.util.List<UserInterestProfile> findByUserId(Long userId);
}
