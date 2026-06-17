package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.CategoryDto;
import com.travel.recommendation.domain.entity.Category;
import com.travel.recommendation.adapter.out.persistence.CategoryRepository;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;

    @Cacheable(value = "categories", key = "'all'", sync = true)
    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Cacheable(value = "categories", key = "'active'", sync = true)
    @Transactional(readOnly = true)
    public List<CategoryDto> getActiveCategoriesWithCount() {
        return locationRepository.findActiveCategoriesWithCount();
    }

    @Transactional(readOnly = true)
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
