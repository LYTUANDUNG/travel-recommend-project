package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.LocationRequest;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.service.LocationService;
import com.travel.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows React to call
public class LocationController {

    private final LocationService locationService;
    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getAllLocations() {
        return ResponseEntity.ok(ApiResponse.success(locationService.getAllLocations()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> getLocationById(@PathVariable Long id) {
        return locationService.getLocationById(id)
                .map(loc -> ResponseEntity.ok(ApiResponse.success(loc)))
                .orElse(ResponseEntity.ok(ApiResponse.error("Not found")));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationResponse>> createLocation(@Valid @RequestBody LocationRequest locationRequest) {
        return ResponseEntity.ok(ApiResponse.success(locationService.saveLocation(locationRequest)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(@PathVariable Long id, @Valid @RequestBody LocationRequest locationRequest) {
        return ResponseEntity.ok(ApiResponse.success(locationService.updateLocation(id, locationRequest)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> searchLocations(@RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success(locationService.searchLocations(query)));
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
        return ResponseEntity.ok(ApiResponse.success(locationService.getLocationsPaginated(query, province, category, rating, price, page, size)));
    }
    
    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<String>>> getProvinces() {
        return ResponseEntity.ok(ApiResponse.success(locationService.getDistinctProvinces()));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getRecommendations(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getRecommendations(userId, lat, lng)));
    }

    @GetMapping("/{id}/recommendations")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getRecommendationsByContent(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "5") int topN) {
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getContentRecommendations(id, topN)));
    }

    @GetMapping("/recommendations/smart")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getSmartRecommendations(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Integer hour,
            @RequestParam(required = false) String weather) {
            
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        // 1. Context-Aware AI (from OSM & Python) -> Tích hợp cao cấp Luận Văn
        if (lat != null && lng != null) {
            return ResponseEntity.ok(ApiResponse.success(recommendationService.getContextRecommendations(lat, lng, hour, weather)));
        }
        
        // 2. Collaborative Filtering (Registered User)
        if (auth != null && auth.isAuthenticated() && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            try {
                Long userId = Long.valueOf(auth.getName());
                return ResponseEntity.ok(ApiResponse.success(recommendationService.getUserRecommendations(userId)));
            } catch (NumberFormatException e) {
                return ResponseEntity.ok(ApiResponse.success(recommendationService.getGuestRecommendations()));
            }
        } 
        
        // 3. Fallback Guest logic
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getGuestRecommendations()));
    }
}
