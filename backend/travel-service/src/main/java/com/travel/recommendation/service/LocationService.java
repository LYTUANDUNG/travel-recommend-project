package com.travel.recommendation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.recommendation.domain.dto.LocationRequest;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Category;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.Tag;
import com.travel.recommendation.repository.CategoryRepository;
import com.travel.recommendation.repository.LocationRepository;
import com.travel.recommendation.repository.LocationTagRepository;
import com.travel.recommendation.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final TagRepository tagRepository;
    private final LocationTagRepository locationTagRepository;
    private final CategoryRepository categoryRepository;
    private final com.travel.recommendation.repository.ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations"}, allEntries = true)
    public void syncStats(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        java.util.List<Object[]> statsList = reviewRepository.getReviewStats(locationId);
        if (statsList != null && !statsList.isEmpty() && statsList.get(0) != null) {
            Object[] stats = statsList.get(0);
            Long count = (Long) stats[0];
            Double avg = (Double) stats[1];
            location.setTotalReviews(count.intValue());
            location.setAverageRating(avg != null ? avg : 0.0);
            locationRepository.save(location);
        } else {
            location.setTotalReviews(0);
            location.setAverageRating(0.0);
            locationRepository.save(location);
        }
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.Optional<LocationResponse> getLocationById(Long id) {
        return locationRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations"}, allEntries = true)
    public LocationResponse saveLocation(LocationRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
        }

        Location location = Location.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .ward(request.getWard())
                .district(request.getDistrict())
                .province(request.getProvince())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .category(category)
                .priceLevel(request.getPriceLevel())
                .priceRangeStr(request.getPriceRangeStr())
                .openingHour(request.getOpeningHour() != null ? LocalTime.parse(request.getOpeningHour()) : null)
                .closingHour(request.getClosingHour() != null ? LocalTime.parse(request.getClosingHour()) : null)
                .thumbnailUrl(request.getThumbnailUrl())
                .imagesJson(serializeImages(request.getImages()))
                .build();

        Location savedLocation = locationRepository.save(location);

        if (request.getTags() != null) {
            for (LocationRequest.TagDto tagDto : request.getTags()) {
                Tag tag = tagRepository.findByName(tagDto.getName())
                        .orElseGet(() -> tagRepository.save(Tag.builder()
                                .name(tagDto.getName())
                                .weight(tagDto.getWeight() != null ? tagDto.getWeight() : 1.0)
                                .build()));

                com.travel.recommendation.domain.entity.LocationTag locationTag = com.travel.recommendation.domain.entity.LocationTag.builder()
                        .location(savedLocation)
                        .tag(tag)
                        .score(1.0)
                        .build();
                locationTagRepository.save(locationTag);
            }
        }

        return mapToResponse(savedLocation);
    }

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations"}, allEntries = true)
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
        }

        location.setName(request.getName());
        location.setDescription(request.getDescription());
        location.setAddress(request.getAddress());
        location.setWard(request.getWard());
        location.setDistrict(request.getDistrict());
        location.setProvince(request.getProvince());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setCategory(category);
        location.setPriceLevel(request.getPriceLevel());
        location.setPriceRangeStr(request.getPriceRangeStr());
        location.setOpeningHour(request.getOpeningHour() != null ? LocalTime.parse(request.getOpeningHour()) : null);
        location.setClosingHour(request.getClosingHour() != null ? LocalTime.parse(request.getClosingHour()) : null);
        location.setThumbnailUrl(request.getThumbnailUrl());
        location.setImagesJson(serializeImages(request.getImages()));

        Location updatedLocation = locationRepository.save(location);
        return mapToResponse(updatedLocation);
    }

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations"}, allEntries = true)
    public void deleteLocation(Long id) {
        locationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> searchLocations(String query) {
        return locationRepository.searchLocationsNative(query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<LocationResponse> getLocationsPaginated(
            String query, String province, String category, Double rating, String price, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return locationRepository.findLocationsPaginated(query, province, category, rating, price, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctProvinces() {
        return locationRepository.findDistinctProvinces();
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getRecommendations(Long userId, Double lat, Double lng) {
        // Simple implementation: iflat/lng provided, use spatial query, else just some locations
        List<Location> locations;
        if (lat != null && lng != null) {
            locations = locationRepository.findLocationsWithinRadius(lat, lng, 50000.0); // 50km
        } else {
            locations = locationRepository.findAll();
        }
        return locations.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public LocationResponse mapToResponse(Location loc) {
        return LocationResponse.builder()
                .locationId(loc.getId())
                .name(loc.getName())
                .description(loc.getDescription())
                .address(loc.getAddress())
                .ward(loc.getWard())
                .district(loc.getDistrict())
                .province(loc.getProvince())
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .categoryId(loc.getCategory() != null ? loc.getCategory().getId() : null)
                .categoryName(loc.getCategory() != null ? loc.getCategory().getName() : null)
                .priceLevel(loc.getPriceLevel())
                .priceRangeStr(loc.getPriceRangeStr())
                .openingHour(loc.getOpeningHour())
                .closingHour(loc.getClosingHour())
                .thumbnailUrl(loc.getThumbnailUrl())
                .averageRating(loc.getAverageRating())
                .totalReviews(loc.getTotalReviews())
                .images(deserializeImages(loc.getImagesJson()))
                .tags(loc.getLocationTags() != null ? loc.getLocationTags().stream()
                        .map(lt -> LocationResponse.TagResponse.builder()
                                .tagId(lt.getTag().getId())
                                .name(lt.getTag().getName())
                                .weight(lt.getTag().getWeight())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .build();
    }

    private String serializeImages(List<String> images) {
        if (images == null) return null;
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> deserializeImages(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty()) return List.of();
        try {
            String[] images = objectMapper.readValue(imagesJson, String[].class);
            return List.of(images);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
