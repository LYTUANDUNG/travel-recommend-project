package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.TripLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripLocationRepository extends JpaRepository<TripLocation, Long> {
    List<TripLocation> findByTripId(Long tripId);
    void deleteByTripId(Long tripId);
}
