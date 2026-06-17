package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.dto.CategoryDto;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    List<Location> findAllById(Iterable<Long> ids);

    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    List<Location> findAll();

    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    Optional<Location> findById(Long id);

    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    List<Location> findByNameContainingIgnoreCaseOrProvinceContainingIgnoreCase(String name, String province);

    @Query(value = "SELECT *, " +
               "(MATCH(name, address) AGAINST(?1 IN NATURAL LANGUAGE MODE) * 2 + " +
               "(IF(name LIKE CONCAT('%', ?1, '%'), 1, 0))) AS score " +
               "FROM locations " +
               "WHERE MATCH(name, address) AGAINST(?1 IN NATURAL LANGUAGE MODE) " +
               "OR name LIKE CONCAT('%', ?1, '%') " +
               "ORDER BY score DESC", nativeQuery = true)
    List<Location> searchLocationsNative(String query);

    @Query(value = "SELECT * FROM locations WHERE coordinate IS NOT NULL AND ST_Distance_Sphere(coordinate, POINT(?2, ?1)) <= ?3", nativeQuery = true)
    List<Location> findLocationsWithinRadius(double lat, double lng, double radiusInMeters);

    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    @Query("SELECT l FROM Location l LEFT JOIN l.category c WHERE " +
           "(?1 IS NULL OR ?1 = '' OR LOWER(l.name) LIKE LOWER(CONCAT('%', ?1, '%')) OR LOWER(l.address) LIKE LOWER(CONCAT('%', ?1, '%'))) AND " +
           "(?2 IS NULL OR ?2 = 'All' OR l.province = ?2) AND " +
           "(?3 IS NULL OR ?3 = 'All' OR c.name = ?3) AND " +
           "(?4 IS NULL OR l.averageRating >= ?4) AND " +
           "(?5 IS NULL OR ?5 = 'All' OR l.priceRangeStr LIKE CONCAT('%', ?5, '%'))")
    Page<Location> findLocationsPaginated(
        String query,
        String province,
        String category,
        Double rating,
        String price,
        Pageable pageable
    );

    @Query("SELECT DISTINCT l.province FROM Location l WHERE l.province IS NOT NULL")
    List<String> findDistinctProvinces();

    @Query("SELECT l.category FROM Location l WHERE l.category IS NOT NULL GROUP BY l.category")
    List<Category> findActiveCategories();

    @Query("SELECT new com.travel.recommendation.domain.dto.CategoryDto(c.id, c.name, c.slug, c.description, COUNT(l)) " +
           "FROM Location l JOIN l.category c " +
           "GROUP BY c.id, c.name, c.slug, c.description")
    List<CategoryDto> findActiveCategoriesWithCount();

    @Query("SELECT COUNT(l) FROM Location l WHERE l.createdAt > ?1")
    long countByCreatedAtAfter(LocalDateTime date);
}
