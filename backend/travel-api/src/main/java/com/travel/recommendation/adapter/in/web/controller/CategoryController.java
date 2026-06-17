package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.CategoryDto;
import com.travel.recommendation.domain.entity.Category;
import com.travel.recommendation.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getActiveCategoriesWithCount()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getById(@PathVariable("id") Long id) {
        return categoryService.getCategoryById(id)
                .map(category -> ResponseEntity.ok(ApiResponse.success(category)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> create(@Valid @RequestBody Category category) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.saveCategory(category)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> update(@PathVariable("id") Long id, @Valid @RequestBody Category categoryDetails) {
        return categoryService.getCategoryById(id)
                .map(category -> {
                    category.setName(categoryDetails.getName());
                    category.setDescription(categoryDetails.getDescription());
                    return ResponseEntity.ok(ApiResponse.success(categoryService.saveCategory(category)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null));
    }
}
