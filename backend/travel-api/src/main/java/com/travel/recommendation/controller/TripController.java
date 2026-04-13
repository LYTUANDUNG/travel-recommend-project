package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Trip;
import com.travel.recommendation.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Trip>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getByUser(userId), "Lấy danh sách chuyến đi thành công"));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Trip>> createTrip(@RequestParam Long userId, @RequestParam String title) {
        return ResponseEntity.ok(ApiResponse.success(tripService.createTrip(userId, title), "Tạo chuyến đi thành công"));
    }

    @PostMapping("/{tripId}/add")
    public ResponseEntity<ApiResponse<Void>> addLocation(@PathVariable Long tripId, 
                                                       @RequestParam Long locationId,
                                                       @RequestParam(required = false) Integer day,
                                                       @RequestParam(required = false) Integer order) {
        tripService.addLocationToTrip(tripId, locationId, day, order);
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm địa điểm thành công"));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Void>> syncTrip(@RequestParam Long userId, @RequestBody List<Long> locationIds) {
        tripService.syncTrip(userId, locationIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Đồng bộ hành trình thành công"));
    }
}
