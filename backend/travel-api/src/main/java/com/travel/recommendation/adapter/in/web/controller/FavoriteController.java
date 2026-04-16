package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.dto.FavoriteDto;
import com.travel.recommendation.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/toggle")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> toggleFavorite(
            @RequestParam Long userId,
            @RequestParam Long locationId) {
        return ResponseEntity.ok(ApiResponse.success(favoriteService.toggleFavorite(userId, locationId)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FavoriteDto>>> getUserFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(favoriteService.getUserFavorites(userId)));
    }
}
