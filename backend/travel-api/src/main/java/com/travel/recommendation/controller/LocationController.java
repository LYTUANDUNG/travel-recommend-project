package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows React to call
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Location>>> getAllLocations() {
        return ResponseEntity.ok(ApiResponse.success(locationService.getAllLocations()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Location>> getLocationById(@PathVariable Long id) {
        return locationService.getLocationById(id)
                .map(loc -> ResponseEntity.ok(ApiResponse.success(loc)))
                .orElse(ResponseEntity.ok(ApiResponse.error("Not found")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Location>> createLocation(@RequestBody Location location) {
        return ResponseEntity.ok(ApiResponse.success(locationService.saveLocation(location)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Location>> updateLocation(@PathVariable Long id, @RequestBody Location location) {
        return locationService.getLocationById(id).map(existingLocation -> {
            location.setId(id);
            return ResponseEntity.ok(ApiResponse.success(locationService.saveLocation(location)));
        }).orElse(ResponseEntity.ok(ApiResponse.error("Not found to update")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Location>>> searchLocations(@RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success(locationService.searchLocations(query)));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<Location>>> getRecommendations(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getRecommendations(userId, lat, lng)));
    }
}
