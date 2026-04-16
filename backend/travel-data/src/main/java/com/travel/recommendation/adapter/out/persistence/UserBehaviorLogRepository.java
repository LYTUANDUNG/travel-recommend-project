package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBehaviorLogRepository extends JpaRepository<UserBehaviorLog, Long> {
}
