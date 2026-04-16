package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    List<Location> findAll();

    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    Optional<Location> findById(Long id);

    @EntityGraph(attributePaths = {"category", "locationTags", "locationTags.tag"})
    List<Location> findByNameContainingIgnoreCaseOrProvinceContainingIgnoreCase(String name, String province);

    @Query(value = "SELECT *, " +
               "(MATCH(name, address) AGAINST(:query IN NATURAL LANGUAGE MODE) * 2 + " +
               "(IF(name LIKE CONCAT('%', :query, '%'), 1, 0))) AS score " +
               "FROM locations " +
               "WHERE MATCH(name, address) AGAINST(:query IN NATURAL LANGUAGE MODE) " +
               "OR name LIKE CONCAT('%', :query, '%') " +
               "ORDER BY score DESC", nativeQuery = true)
    List<Location> searchLocationsNative(@Param("query") String query);

    @Query(value = "SELECT * FROM locations WHERE coordinate IS NOT NULL AND ST_Distance_Sphere(coordinate, POINT(:lng, :lat)) <= :radiusInMeters", nativeQuery = true)
    List<Location> findLocationsWithinRadius(@Param("lat") double lat, @Param("lng") double lng,
            @Param("radiusInMeters") double radiusInMeters);

    @Query("SELECT l FROM Location l LEFT JOIN l.category c WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(l.address) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:province IS NULL OR :province = 'All' OR l.province = :province) AND " +
           "(:category IS NULL OR :category = 'All' OR c.name = :category) AND " +
           "(:rating IS NULL OR l.averageRating >= :rating) AND " +
           "(:price IS NULL OR :price = 'All' OR l.priceRangeStr LIKE CONCAT('%', :price, '%'))")
    Page<Location> findLocationsPaginated(
        @Param("query") String query,
        @Param("province") String province,
        @Param("category") String category,
        @Param("rating") Double rating,
        @Param("price") String price,
        Pageable pageable
    );

    @Query("SELECT DISTINCT l.province FROM Location l WHERE l.province IS NOT NULL")
    List<String> findDistinctProvinces();

    @Query("SELECT DISTINCT l.category FROM Location l WHERE l.category IS NOT NULL")
    List<com.travel.recommendation.domain.entity.Category> findActiveCategories();
}
