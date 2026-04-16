package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.LocationTag;
import com.travel.recommendation.domain.entity.LocationTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationTagRepository extends JpaRepository<LocationTag, LocationTagId> {
}
