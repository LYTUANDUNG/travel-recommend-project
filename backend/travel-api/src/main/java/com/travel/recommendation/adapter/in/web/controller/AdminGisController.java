package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.service.OpenStreetMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/gis")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGisController {

    private final OpenStreetMapService osmService;

    @GetMapping("/scan")
    public ApiResponse<List<LocationResponse>> scan(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "1000") Double radius) {
        try {
            List<LocationResponse> locations = osmService.scanLocations(lat, lng, radius);
            return ApiResponse.success(locations, "Quét thành công " + locations.size() + " địa điểm từ OpenStreetMap");
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
