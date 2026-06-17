package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.LocationRequest;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.Category;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.Tag;
import com.travel.recommendation.domain.exception.ResourceNotFoundException;
import com.travel.recommendation.domain.mapper.LocationMapper;
import com.travel.recommendation.adapter.out.persistence.CategoryRepository;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.LocationTagRepository;
import com.travel.recommendation.adapter.out.persistence.TagRepository;
import com.travel.recommendation.adapter.out.persistence.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final LocationRepository locationRepository;
    private final TagRepository tagRepository;
    private final LocationTagRepository locationTagRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final LocationMapper locationMapper;

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = {"userRecommendations", "guestRecommendations"}, allEntries = true),
        @CacheEvict(value = "locations", key = "#p0")
    })
    public void syncStats(Long locationId) {
        log.info("Đồng bộ số liệu đánh giá cho địa điểm ID: {}", locationId);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa điểm với ID: " + locationId));

        List<Object[]> statsList = reviewRepository.getReviewStats(locationId);
        if (statsList != null && !statsList.isEmpty() && statsList.get(0) != null) {
            Object[] stats = statsList.get(0);
            Long count = (Long) stats[0];
            Double avg = (Double) stats[1];
            location.setTotalReviews(count.intValue());
            location.setAverageRating(avg != null ? avg : 0.0);
        } else {
            location.setTotalReviews(0);
            location.setAverageRating(0.0);
        }
        locationRepository.save(location);
    }

    @Cacheable(value = "locations", key = "'all'", sync = true)
    @Transactional(readOnly = true)
    public List<LocationResponse> getAllLocations() {
        log.info("Lấy danh sách tất cả các địa điểm");
        return locationRepository.findAll().stream()
                .map(locationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "locations", key = "#p0", sync = true)
    @Transactional(readOnly = true)
    public Optional<LocationResponse> getLocationById(Long id) {
        log.info("Lấy thông tin địa điểm theo ID: {}", id);
        return locationRepository.findById(id).map(locationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getLocationsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        log.info("Lấy danh sách địa điểm theo loạt ID: {}", ids);

        java.util.Map<Long, Integer> requestedOrder = new java.util.HashMap<>();
        for (int i = 0; i < ids.size(); i++) {
            requestedOrder.putIfAbsent(ids.get(i), i);
        }

        return locationRepository.findAllById(ids).stream()
                .sorted(java.util.Comparator.comparingInt(loc -> requestedOrder.getOrDefault(loc.getId(), Integer.MAX_VALUE)))
                .map(locationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations", "locations", "categories"}, allEntries = true)
    public LocationResponse saveLocation(LocationRequest request) {
        log.info("Tạo địa điểm mới: {}", request.getName());
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));
        }

        Location location = Location.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
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
                .imagesJson(locationMapper.serializeImages(request.getImages()))
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

        return locationMapper.toResponse(savedLocation);
    }

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations", "locations", "categories"}, allEntries = true)
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        log.info("Cập nhật thông tin địa điểm ID: {}", id);
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa điểm với ID: " + id));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));
        }

        location.setName(request.getName());
        location.setDescription(request.getDescription());
        location.setAddress(request.getAddress());
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
        location.setImagesJson(locationMapper.serializeImages(request.getImages()));

        Location updatedLocation = locationRepository.save(location);
        return locationMapper.toResponse(updatedLocation);
    }

    @Transactional
    @CacheEvict(value = {"userRecommendations", "guestRecommendations", "locations", "categories"}, allEntries = true)
    public void deleteLocation(Long id) {
        log.info("Xóa địa điểm ID: {}", id);
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy địa điểm với ID: " + id);
        }
        locationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> searchLocations(String query) {
        log.info("Tìm kiếm địa điểm: {}", query);
        return locationRepository.searchLocationsNative(query)
                .stream()
                .map(locationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<LocationResponse> getLocationsPaginated(
            String query, String province, String category, Double rating, String price, int page, int size) {
        log.info("Lấy danh sách địa điểm phân trang: page={}, size={}, query={}", page, size, query);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return locationRepository.findLocationsPaginated(query, province, category, rating, price, pageable)
                .map(locationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctProvinces() {
        return locationRepository.findDistinctProvinces();
    }

    public LocationResponse mapToResponse(Location loc) {
        return locationMapper.toResponse(loc);
    }
}
