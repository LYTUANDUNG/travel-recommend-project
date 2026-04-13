package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.VisitRequestDto;
import com.travel.recommendation.domain.entity.VisitRequest;
import com.travel.recommendation.domain.entity.VisitRequest;
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
@CrossOrigin(origins = "*")
@Slf4j
public class VisitRequestController {

    private final VisitRequestService visitRequestService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VisitRequestDto>> requestVisit(
            @RequestParam Long locationId,
            @RequestParam(required = false) String visitDateStr) {

        Long userId = Long.valueOf(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName());
        LocalDateTime visitDate = visitDateStr != null ? LocalDateTime.parse(visitDateStr) : LocalDateTime.now();
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.requestVisit(userId, locationId, visitDate)));
    }

    @PutMapping("/{requestId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VisitRequestDto>> updateStatus(
            @PathVariable Long requestId,
            @RequestBody java.util.Map<String, String> body) {
        VisitRequest.VisitStatus status = VisitRequest.VisitStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.updateStatus(requestId, status)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VisitRequestDto>>> getAllRequests() {
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.getAllRequests()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<VisitRequestDto>>> getUserRequests(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(visitRequestService.getUserRequests(userId)));
    }

    @GetMapping("/can-review")
    public ResponseEntity<ApiResponse<Boolean>> canUserReview(
            @RequestParam Long userId,
            @RequestParam Long locationId) {
        boolean canReview = visitRequestService.canUserReview(userId, locationId);
        return ResponseEntity.ok(ApiResponse.success(canReview));
    }

    @PostMapping("/verify-qr")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> verifyQr(@RequestBody java.util.Map<String, String> body) {
        String token = body.get("token");
        if (token == null || !tokenProvider.validateToken(token)) {
            return ResponseEntity.ok(ApiResponse.error("Invalid or expired QR token"));
        }

        Claims claims = tokenProvider.getClaimsFromToken(token);
        String visitIdStr = claims.get("visitId", String.class);

        if (visitIdStr == null) {
            return ResponseEntity.ok(ApiResponse.error("Token does not contain visit information"));
        }

        Long visitId = Long.parseLong(visitIdStr);
        boolean success = visitRequestService.verifyQrAndComplete(visitId);

        if (success) {
            log.info("EVENT=QR_VERIFY status=SUCCESS adminId={} visitId={}", 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName(),
                visitId);
            return ResponseEntity.ok(ApiResponse.success("Visit verified successfully", "Visit marked as completed"));
        } else {
            log.warn("EVENT=QR_VERIFY status=REUSE_ATTEMPT visitId={}", visitId);
            return ResponseEntity.ok(ApiResponse.error("Token exhausted or already verified"));
        }
    }
}
