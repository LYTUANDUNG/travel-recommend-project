package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.LocationRequest;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.exception.ResourceNotFoundException;
import com.travel.recommendation.security.SecurityUtils;
import com.travel.recommendation.service.LocationService;
import com.travel.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@Slf4j
public class LocationController {

    private final LocationService locationService;
    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getAllLocations() {
        log.info("Lấy danh sách tất cả các địa điểm");
        return ResponseEntity.ok(ApiResponse.success(locationService.getAllLocations(), "Lấy danh sách địa điểm thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> getLocationById(@PathVariable Long id) {
        log.info("Lấy thông tin địa điểm ID: {}", id);
        LocationResponse loc = locationService.getLocationById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa điểm với ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(loc, "Lấy thông tin địa điểm thành công"));
    }

    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getLocationsByIds(@RequestParam List<Long> ids) {
        log.info("Lấy danh sách địa điểm theo các ID: {}", ids);
        return ResponseEntity.ok(ApiResponse.success(locationService.getLocationsByIds(ids), "Lấy danh sách địa điểm thành công"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationResponse>> createLocation(@Valid @RequestBody LocationRequest locationRequest) {
        log.info("Admin tạo địa điểm mới: {}", locationRequest.getName());
        return ResponseEntity.ok(ApiResponse.success(locationService.saveLocation(locationRequest), "Tạo địa điểm thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(@PathVariable Long id, @Valid @RequestBody LocationRequest locationRequest) {
        log.info("Admin cập nhật địa điểm ID: {}", id);
        return ResponseEntity.ok(ApiResponse.success(locationService.updateLocation(id, locationRequest), "Cập nhật địa điểm thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id) {
        log.info("Admin xóa địa điểm ID: {}", id);
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa địa điểm thành công"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> searchLocations(@RequestParam String query) {
        log.info("Tìm kiếm địa điểm với từ khóa: {}", query);
        return ResponseEntity.ok(ApiResponse.success(locationService.searchLocations(query), "Tìm kiếm địa điểm thành công"));
    }

    @GetMapping("/search/paginated")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<LocationResponse>>> getLocationsPaginated(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double rating,
            @RequestParam(required = false) String price,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {
        log.info("Tìm kiếm địa điểm phân trang: query={}, province={}, category={}, page={}, size={}", query, province, category, page, size);
        return ResponseEntity.ok(ApiResponse.success(locationService.getLocationsPaginated(query, province, category, rating, price, page, size), "Lấy danh sách địa điểm thành công"));
    }
    
    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<String>>> getProvinces() {
        return ResponseEntity.ok(ApiResponse.success(locationService.getDistinctProvinces(), "Lấy danh sách tỉnh/thành thành công"));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getRecommendations(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        Long userId = null;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
            // Khách vãng lai chưa đăng nhập
        }
        log.info("Lấy gợi ý địa điểm cho người dùng ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getRecommendations(userId), "Lấy danh sách gợi ý thành công"));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/{id}/recommendations")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getRecommendationsByContent(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "5") int topN) {
        Long userId = null;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
            // Không có token hợp lệ
        }
        log.info("Lấy gợi ý các địa điểm tương tự cho địa điểm ID {} (người dùng ID: {})", id, userId);
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getContentRecommendations(id, topN, userId), "Lấy danh sách địa điểm tương tự thành công"));
    }

    @GetMapping("/recommendations/smart")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getSmartRecommendations(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Integer hour,
            @RequestParam(required = false) String weather) {
        Long userId = null;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
            // Khách vãng lai chưa đăng nhập
        }
        log.info("Lấy gợi ý thông minh cho người dùng ID: {}", userId);
        if (userId != null) {
            return ResponseEntity.ok(ApiResponse.success(recommendationService.getUserRecommendations(userId), "Lấy gợi ý địa điểm thông minh thành công"));
        }
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getGuestRecommendations(), "Lấy gợi ý địa điểm thông minh thành công"));
    }
}
