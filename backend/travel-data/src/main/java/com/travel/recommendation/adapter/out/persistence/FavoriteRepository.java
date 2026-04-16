package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.Favorite;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser_Id(Long userId);
    Optional<Favorite> findByUserAndLocation(User user, Location location);
    boolean existsByUser_IdAndLocation_Id(Long userId, Long locationId);
}
