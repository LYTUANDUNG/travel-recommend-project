package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt > ?1")
    long countByCreatedAtAfter(LocalDateTime date);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
           "(?1 IS NULL OR ?1 = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', ?1, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', ?1, '%')))")
    org.springframework.data.domain.Page<User> searchPaginated(String query, org.springframework.data.domain.Pageable pageable);
}
