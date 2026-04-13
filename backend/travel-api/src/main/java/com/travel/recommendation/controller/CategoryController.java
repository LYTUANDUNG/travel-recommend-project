package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Category;
import com.travel.recommendation.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getById(@PathVariable("id") Long id) {
        return categoryRepository.findById(id)
                .map(category -> ResponseEntity.ok(ApiResponse.success(category)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> create(@RequestBody Category category) {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.save(category)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> update(@PathVariable("id") Long id, @RequestBody Category categoryDetails) {
        return categoryRepository.findById(id)
                .map(category -> {
                    category.setName(categoryDetails.getName());
                    category.setDescription(categoryDetails.getDescription());
                    category.setSlug(categoryDetails.getSlug());
                    return ResponseEntity.ok(ApiResponse.success(categoryRepository.save(category)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null));
    }
}
