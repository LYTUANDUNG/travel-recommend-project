package com.travel.recommendation.adapter.out.persistence;

import com.travel.recommendation.domain.entity.Blog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogRepository extends JpaRepository<Blog, Long> {
    
    @Query("SELECT b FROM Blog b JOIN FETCH b.author ORDER BY b.id DESC")
    Page<Blog> findAllWithAuthor(Pageable pageable);

    @Query("SELECT b FROM Blog b JOIN FETCH b.author WHERE b.category = :category ORDER BY b.id DESC")
    Page<Blog> findByCategoryWithAuthor(@Param("category") Blog.BlogCategory category, Pageable pageable);

    @Query("SELECT b FROM Blog b JOIN FETCH b.author WHERE b.id = :id")
    java.util.Optional<Blog> findByIdWithAuthor(@Param("id") Long id);
}
