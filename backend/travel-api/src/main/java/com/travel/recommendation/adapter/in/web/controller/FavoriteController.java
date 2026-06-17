package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.FavoriteDto;
import com.travel.recommendation.security.SecurityUtils;
import com.travel.recommendation.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Slf4j
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/toggle")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> toggleFavorite(
            @RequestParam Long locationId) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Người dùng ID {} thay đổi trạng thái yêu thích của địa điểm {}", userId, locationId);
        boolean isFavorite = favoriteService.toggleFavorite(userId, locationId);
        return ResponseEntity.ok(ApiResponse.success(isFavorite, "Thay đổi trạng thái yêu thích thành công"));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FavoriteDto>>> getUserFavorites() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("Lấy danh sách địa điểm yêu thích của người dùng ID {}", userId);
        return ResponseEntity.ok(ApiResponse.success(favoriteService.getUserFavorites(userId), "Lấy danh sách yêu thích thành công"));
    }
}

