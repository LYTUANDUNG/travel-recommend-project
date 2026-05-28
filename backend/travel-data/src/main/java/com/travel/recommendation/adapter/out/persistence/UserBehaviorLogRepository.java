package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserBehaviorLogRepository extends JpaRepository<UserBehaviorLog, Long> {

    List<UserBehaviorLog> findByCreatedAtAfter(LocalDateTime startDate);

    @Query(value = "SELECT DATE(created_at) as logDate, action_type as actionName, COUNT(*) as actionCount " +
           "FROM user_behavior_logs " +
           "WHERE created_at >= ?1 " +
           "GROUP BY DATE(created_at), action_type", nativeQuery = true)
    List<BehaviorStats> getActionStatsByDate(LocalDateTime startDate);

    interface BehaviorStats {
        String getLogDate();
        String getActionName();
        Long getActionCount();
    }
}
