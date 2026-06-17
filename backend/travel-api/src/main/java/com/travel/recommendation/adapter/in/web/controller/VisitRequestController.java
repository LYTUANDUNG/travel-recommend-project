package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.VisitRequestDto;
import com.travel.recommendation.domain.entity.VisitRequest;
import com.travel.recommendation.security.SecurityUtils;
import com.travel.recommendation.service.VisitRequestService;
import com.travel.recommendation.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/visits")
@RequiredArgsConstructor
@Slf4j
public class VisitRequestController {

    private final VisitRequestService visitRequestService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VisitRequestDto>> requestVisit(
            @RequestParam Long locationId,
            @RequestParam(required = false) String visitDateStr) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Người dùng ID {} yêu cầu viếng thăm địa điểm ID {}", userId, locationId);
        LocalDateTime visitDate = visitDateStr != null ? LocalDateTime.parse(visitDateStr) : LocalDateTime.now();
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.requestVisit(userId, locationId, visitDate), "Gửi yêu cầu viếng thăm thành công"));
    }

    @PutMapping("/{requestId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VisitRequestDto>> updateStatus(
            @PathVariable Long requestId,
            @RequestBody java.util.Map<String, String> body) {
        VisitRequest.VisitStatus status = VisitRequest.VisitStatus.valueOf(body.get("status"));
        log.info("Cập nhật trạng thái yêu cầu viếng thăm ID {} thành {}", requestId, status);
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.updateStatus(requestId, status), "Cập nhật trạng thái thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VisitRequestDto>>> getAllRequests() {
        log.info("Lấy danh sách toàn bộ yêu cầu viếng thăm");
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.getAllRequests(), "Lấy danh sách yêu cầu viếng thăm thành công"));
    }

    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<VisitRequestDto>>> getPaginatedRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Lấy danh sách yêu cầu viếng thăm phân trang: page={}, size={}", page, size);
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.getPaginatedRequests(page, size), "Lấy danh sách phân trang thành công"));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<VisitRequestDto>>> getUserRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Lấy lịch sử viếng thăm của người dùng ID {}", userId);
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.getUserRequests(userId), "Lấy lịch sử viếng thăm thành công"));
    }

    @GetMapping("/can-review")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> canUserReview(
            @RequestParam Long locationId) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Kiểm tra quyền đánh giá của người dùng ID {} đối với địa điểm ID {}", userId, locationId);
        boolean canReview = visitRequestService.canUserReview(userId, locationId);
        return ResponseEntity.ok(ApiResponse.success(canReview, "Kiểm tra quyền đánh giá thành công"));
    }

    @PostMapping("/verify-qr")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> verifyQr(@RequestBody java.util.Map<String, String> body) {
        String token = body.get("token");
        if (token == null || !tokenProvider.validateToken(token)) {
            return ResponseEntity.ok(ApiResponse.error("Mã QR không hợp lệ hoặc đã hết hạn"));
        }

        Claims claims = tokenProvider.getClaimsFromToken(token);
        String visitIdStr = claims.get("visitId", String.class);

        if (visitIdStr == null) {
            return ResponseEntity.ok(ApiResponse.error("Mã QR thiếu thông tin chuyến đi"));
        }

        Long visitId = Long.parseLong(visitIdStr);
        boolean success = visitRequestService.verifyQrAndComplete(visitId);

        if (success) {
            log.info("EVENT=QR_VERIFY status=SUCCESS adminId={} visitId={}", 
                SecurityUtils.getCurrentUserId(),
                visitId);
            return ResponseEntity.ok(ApiResponse.success("Xác thực viếng thăm thành công", "Xác thực viếng thăm thành công"));
        } else {
            log.warn("EVENT=QR_VERIFY status=REUSE_ATTEMPT visitId={}", visitId);
            return ResponseEntity.ok(ApiResponse.error("Mã QR đã được sử dụng hoặc xác thực trước đó"));
        }
    }
}

