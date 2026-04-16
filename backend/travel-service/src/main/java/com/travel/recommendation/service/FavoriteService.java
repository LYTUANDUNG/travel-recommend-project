package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.FavoriteDto;
import com.travel.recommendation.domain.entity.Favorite;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.adapter.out.persistence.FavoriteRepository;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final LocationService locationService;

    @Transactional
    public boolean toggleFavorite(Long userId, Long locationId) {
        User user = userRepository.findById(userId).orElseThrow();
        Location location = locationRepository.findById(locationId).orElseThrow();

        return favoriteRepository.findByUserAndLocation(user, location)
                .map(favorite -> {
                    favoriteRepository.delete(favorite);
                    return false;
                })
                .orElseGet(() -> {
                    favoriteRepository.save(Favorite.builder()
                            .user(user)
                            .location(location)
                            .build());
                    return true;
                });
    }

    @Transactional(readOnly = true)
    public List<FavoriteDto> getUserFavorites(Long userId) {
        return favoriteRepository.findByUser_Id(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public FavoriteDto mapToDto(Favorite f) {
        return FavoriteDto.builder()
                .id(f.getId())
                .userId(f.getUser() != null ? f.getUser().getId() : null)
                .locationId(f.getLocation() != null ? f.getLocation().getId() : null)
                .location(f.getLocation() != null ? locationService.mapToResponse(f.getLocation()) : null)
                .build();
    }
}
