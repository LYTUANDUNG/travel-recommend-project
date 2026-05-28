package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Trip;
import com.travel.recommendation.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Trip>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getByUser(userId), "Lấy danh sách chuyến đi thành công"));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Trip>> createTrip(@RequestParam Long userId, @RequestParam String title) {
        return ResponseEntity.ok(ApiResponse.success(tripService.createTrip(userId, title), "Tạo chuyến đi thành công"));
    }

    @PostMapping("/{tripId}/add")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> addLocation(@PathVariable Long tripId, 
                                                       @RequestParam Long locationId,
                                                       @RequestParam(required = false) Integer day,
                                                       @RequestParam(required = false) Integer order) {
        tripService.addLocationToTrip(tripId, locationId, day, order);
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm địa điểm thành công"));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> syncTrip(@RequestParam Long userId, @RequestBody com.fasterxml.jackson.databind.JsonNode payload) {
        List<com.travel.recommendation.service.TripService.TripLocationSyncItem> items = new java.util.ArrayList<>();
        if (payload != null && payload.isArray()) {
            int index = 0;
            for (com.fasterxml.jackson.databind.JsonNode node : payload) {
                if (node.isNumber()) {
                    items.add(new com.travel.recommendation.service.TripService.TripLocationSyncItem(node.asLong(), 1, index));
                } else {
                    Long locationId = node.has("location_id") ? node.get("location_id").asLong() : (node.has("locationId") ? node.get("locationId").asLong() : null);
                    Integer day = node.has("day") ? node.get("day").asInt() : 1;
                    Integer order = node.has("order_index") ? node.get("order_index").asInt() : (node.has("order") ? node.get("order").asInt() : index);
                    if (locationId != null) {
                        items.add(new com.travel.recommendation.service.TripService.TripLocationSyncItem(locationId, day, order));
                    }
                }
                index++;
            }
        }
        tripService.syncTripItems(userId, items);
        return ResponseEntity.ok(ApiResponse.success(null, "Đồng bộ hành trình thành công"));
    }
}
