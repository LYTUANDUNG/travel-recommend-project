package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.VisitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisitRequestRepository extends JpaRepository<VisitRequest, Long> {
    @EntityGraph(attributePaths = {"user", "location", "location.category", "location.locationTags", "location.locationTags.tag"})
    List<VisitRequest> findByUser_Id(Long userId);

    @EntityGraph(attributePaths = {"user", "location", "location.category", "location.locationTags", "location.locationTags.tag"})
    List<VisitRequest> findByLocation_Id(Long locationId);

    Optional<VisitRequest> findByUser_IdAndLocation_IdAndStatus(Long userId, Long locationId,
            VisitRequest.VisitStatus status);

    Optional<VisitRequest> findFirstByUser_IdAndLocation_IdAndStatusOrderByCreatedAtDesc(Long userId, Long locationId,
            VisitRequest.VisitStatus status);

    boolean existsByUser_IdAndLocation_IdAndStatusIn(Long userId, Long locationId,
            java.util.Collection<VisitRequest.VisitStatus> statuses);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE VisitRequest v SET v.status = ?2 WHERE v.id = ?1 AND v.status != ?2")
    int markAsCompletedIfPending(Long id, VisitRequest.VisitStatus completedStatus);

    @EntityGraph(attributePaths = {"user", "location", "location.category", "location.locationTags", "location.locationTags.tag"})
    @org.springframework.data.jpa.repository.Query("SELECT v FROM VisitRequest v")
    org.springframework.data.domain.Page<VisitRequest> findAllPaginated(org.springframework.data.domain.Pageable pageable);
}
