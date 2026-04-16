package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.VisitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisitRequestRepository extends JpaRepository<VisitRequest, Long> {
    List<VisitRequest> findByUser_Id(Long userId);

    List<VisitRequest> findByLocation_Id(Long locationId);

    Optional<VisitRequest> findByUser_IdAndLocation_IdAndStatus(Long userId, Long locationId,
            VisitRequest.VisitStatus status);

    boolean existsByUser_IdAndLocation_IdAndStatusIn(Long userId, Long locationId,
            java.util.Collection<VisitRequest.VisitStatus> statuses);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE VisitRequest v SET v.status = :completedStatus WHERE v.id = :id AND v.status != :completedStatus")
    int markAsCompletedIfPending(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("completedStatus") VisitRequest.VisitStatus completedStatus);
}
