package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Banner;
import com.travel.recommendation.adapter.out.persistence.BannerRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BannerController {

    private final BannerRepository bannerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Banner>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(bannerRepository.findAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Banner>>> getActiveBanners() {
        return ResponseEntity.ok(ApiResponse.success(bannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Banner>> create(@Valid @RequestBody Banner banner) {
        if (banner.getIsActive() == null) banner.setIsActive(true);
        if (banner.getDisplayOrder() == null) banner.setDisplayOrder(0);
        return ResponseEntity.ok(ApiResponse.success(bannerRepository.save(banner)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        bannerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null));
    }
}
