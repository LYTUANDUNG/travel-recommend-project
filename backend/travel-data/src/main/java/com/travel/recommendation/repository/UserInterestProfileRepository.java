package com.travel.recommendation.repository;

import com.travel.recommendation.domain.entity.UserInterestProfile;
import com.travel.recommendation.domain.entity.UserInterestProfileId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserInterestProfileRepository extends JpaRepository<UserInterestProfile, UserInterestProfileId> {
    List<UserInterestProfile> findByIdUserId(Long userId);
}
