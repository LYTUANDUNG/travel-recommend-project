package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.BlogDto;
import com.travel.recommendation.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlogController {

    private final BlogService blogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogDto>>> getAllBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BlogDto> blogs;
        
        if (category != null && !category.isEmpty()) {
            blogs = blogService.getBlogsByCategory(category, pageRequest);
        } else {
            blogs = blogService.getAllBlogs(pageRequest);
        }
        
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogDto>> getBlogById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blogService.getBlogById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BlogDto>> createBlog(@RequestBody BlogDto dto) {
        Long authorId = Long.valueOf(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName());
        return ResponseEntity.ok(ApiResponse.success(blogService.createBlog(dto, authorId), "Blog created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BlogDto>> updateBlog(@PathVariable Long id, @RequestBody BlogDto dto) {
        return ResponseEntity.ok(ApiResponse.success(blogService.updateBlog(id, dto), "Blog updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBlog(@PathVariable Long id) {
        blogService.deleteBlog(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Blog deleted successfully"));
    }
}
