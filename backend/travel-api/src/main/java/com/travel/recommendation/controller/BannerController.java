package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Banner;
import com.travel.recommendation.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<Banner>> create(@RequestBody Banner banner) {
        if (banner.getIsActive() == null) banner.setIsActive(true);
        if (banner.getDisplayOrder() == null) banner.setDisplayOrder(0);
        return ResponseEntity.ok(ApiResponse.success(bannerRepository.save(banner)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        bannerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null));
    }
}
