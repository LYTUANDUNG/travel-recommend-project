package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Trip;
import com.travel.recommendation.security.SecurityUtils;
import com.travel.recommendation.service.TripService;
import com.travel.recommendation.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
@Slf4j
public class TripController {

    private final TripService tripService;
    private final MailService mailService;

    @PostMapping("/share")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> shareTrip(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String title = payload.get("title");
        String content = payload.get("content");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Email người nhận không được để trống"));
        }
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Nội dung chia sẻ không được để trống"));
        }

        log.info("Yêu cầu gửi email chia sẻ lộ trình '{}' tới email: {}", title, email);
        try {
            mailService.sendEmail(email, "Chia sẻ lịch trình du lịch: " + (title != null ? title : "Không tiêu đề"), content);
            return ResponseEntity.ok(ApiResponse.success(null, "Gửi email chia sẻ lịch trình thành công"));
        } catch (Exception e) {
            log.error("Lỗi khi gửi email chia sẻ lịch trình", e);
            return ResponseEntity.ok(ApiResponse.error("Không thể gửi email: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Trip>>> getByUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Lấy danh sách chuyến đi của người dùng ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success(tripService.getByUser(userId), "Lấy danh sách chuyến đi thành công"));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Trip>> createTrip(@RequestParam String title) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Người dùng ID {} tạo chuyến đi mới với tiêu đề: {}", userId, title);
        return ResponseEntity.ok(ApiResponse.success(tripService.createTrip(userId, title), "Tạo chuyến đi thành công"));
    }

    @PostMapping("/{tripId}/add")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> addLocation(@PathVariable Long tripId, 
                                                       @RequestParam Long locationId,
                                                       @RequestParam(required = false) Integer day,
                                                       @RequestParam(required = false) Integer order) {
        log.info("Thêm địa điểm ID {} vào chuyến đi ID {}, ngày {}, thứ tự {}", locationId, tripId, day, order);
        tripService.addLocationToTrip(tripId, locationId, day, order);
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm địa điểm thành công"));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> syncTrip(@RequestBody com.fasterxml.jackson.databind.JsonNode payload) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Đồng bộ hành trình cho người dùng ID: {}", userId);
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
