package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    @Transactional(readOnly = true)
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Location> getLocationById(Long id) {
        return locationRepository.findById(id);
    }

    @Transactional
    public Location saveLocation(Location location) {
        return locationRepository.save(location);
    }

    @Transactional
    public void deleteLocation(Long id) {
        locationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Location> searchLocations(String query) {
        return locationRepository.findByNameContainingIgnoreCaseOrProvinceContainingIgnoreCase(query, query);
    }

    @Transactional(readOnly = true)
    public List<Location> getRecommendations(Long userId, Double lat, Double lng) {
        // Mock Implementation for now (Phase 2 & 3 will connect to AI Model)
        // Currently returns all locations sorted implicitly by DB (in reality we would
        // score them)
        return locationRepository.findAll();
    }
}
