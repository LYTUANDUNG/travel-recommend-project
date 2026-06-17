package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.BlogDto;
import com.travel.recommendation.domain.dto.PageResponse;
import com.travel.recommendation.domain.entity.Blog;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.adapter.out.persistence.BlogRepository;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class BlogService {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final NewsletterService newsletterService;

    @org.springframework.cache.annotation.Cacheable(value = "blogs", key = "'all-' + #p0.pageNumber + '-' + #p0.pageSize", sync = true)
    public PageResponse<BlogDto> getAllBlogs(Pageable pageable) {
        return PageResponse.of(blogRepository.findAllWithAuthor(pageable).map(this::mapToDto));
    }

    @org.springframework.cache.annotation.Cacheable(value = "blogs", key = "'cat-' + #p0 + '-' + #p1.pageNumber + '-' + #p1.pageSize", sync = true)
    public PageResponse<BlogDto> getBlogsByCategory(String category, Pageable pageable) {
        return PageResponse.of(blogRepository.findByCategoryWithAuthor(Blog.BlogCategory.valueOf(category.toUpperCase()), pageable)
                .map(this::mapToDto));
    }

    @org.springframework.cache.annotation.Cacheable(value = "blogs", key = "'detail-' + #id", sync = true)
    public BlogDto getBlogById(Long id) {
        return blogRepository.findByIdWithAuthor(id).map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Blog not found"));
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "blogs", allEntries = true)
    public BlogDto createBlog(BlogDto dto, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        log.info("Creating blog: title={}, category={}, authorId={}", dto.getTitle(), dto.getCategory(), authorId);
        
        Blog blog = Blog.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .excerpt(dto.getExcerpt())
                .thumbnailUrl(dto.getThumbnail_url())
                .category(dto.getCategory() != null ? Blog.BlogCategory.valueOf(dto.getCategory().toUpperCase()) : Blog.BlogCategory.NEWS)
                .author(author)
                .build();

        Blog savedBlog = blogRepository.save(blog);
        log.info("Blog saved successfully with ID: {}, Author: {}", savedBlog.getId(), savedBlog.getAuthor().getFullName());
        
        // Phase 4 Note: Async Notification will be triggered here via Event Publisher or Queue
        eventPublisher.publishEvent(new BlogCreatedEvent(this, savedBlog.getTitle()));
        
        // Notify Newsletter Subscribers
        try {
            newsletterService.notifySubscribers(savedBlog);
            log.info("Newsletter notification triggered for blog: {}", savedBlog.getId());
        } catch (Exception e) {
            log.error("Failed to trigger newsletter notification for blog: {}", savedBlog.getId(), e);
        }
        
        return mapToDto(savedBlog);
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "blogs", allEntries = true)
    public BlogDto updateBlog(Long id, BlogDto dto) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));
        
        blog.setTitle(dto.getTitle());
        blog.setContent(dto.getContent());
        blog.setExcerpt(dto.getExcerpt());
        blog.setThumbnailUrl(dto.getThumbnail_url());
        if (dto.getCategory() != null) {
            blog.setCategory(Blog.BlogCategory.valueOf(dto.getCategory().toUpperCase()));
        }
        
        return mapToDto(blogRepository.save(blog));
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "blogs", allEntries = true)
    public void deleteBlog(Long id) {
        if (!blogRepository.existsById(id)) {
            throw new RuntimeException("Blog not found");
        }
        blogRepository.deleteById(id);
    }

    private BlogDto mapToDto(Blog blog) {
        return BlogDto.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .content(blog.getContent())
                .excerpt(blog.getExcerpt())
                .thumbnail_url(blog.getThumbnailUrl())
                .category(blog.getCategory().name())
                .author_id(blog.getAuthor().getId())
                .author_name(blog.getAuthor().getFullName())
                .created_at(blog.getCreatedAt())
                .build();
    }
}
