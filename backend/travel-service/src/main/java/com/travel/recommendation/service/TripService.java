package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.Trip;
import com.travel.recommendation.domain.entity.TripLocation;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.TripLocationRepository;
import com.travel.recommendation.adapter.out.persistence.TripRepository;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripLocationRepository tripLocationRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

    public record TripLocationSyncItem(Long locationId, Integer day, Integer order) {}

    public List<Trip> getByUser(Long userId) {
        return tripRepository.findByUserId(userId);
    }

    @Transactional
    public Trip createTrip(Long userId, String title) {
        User user = userRepository.findById(userId).orElseThrow();
        Trip trip = Trip.builder()
                .user(user)
                .title(title)
                .build();
        return tripRepository.save(trip);
    }

    @Transactional
    public void addLocationToTrip(Long tripId, Long locationId, Integer day, Integer order) {
        Trip trip = tripRepository.findById(tripId).orElseThrow();
        Location location = locationRepository.findById(locationId).orElseThrow();
        
        TripLocation item = TripLocation.builder()
                .trip(trip)
                .location(location)
                .day(day != null ? day : 1)
                .sortOrder(order != null ? order : 0)
                .build();
        tripLocationRepository.save(item);
    }

    @Transactional
    public void syncTrip(Long userId, List<Long> locationIds) {
        syncTripItems(userId, locationIds.stream()
                .map(id -> new TripLocationSyncItem(id, 1, null))
                .collect(Collectors.toList()));
    }

    @Transactional
    public void syncTripItems(Long userId, List<TripLocationSyncItem> items) {
        User user = userRepository.findById(userId).orElseThrow();
        
        // Find or create a default trip for the user
        List<Trip> trips = tripRepository.findByUserId(userId);
        Trip trip;
        if (trips.isEmpty()) {
            trip = Trip.builder()
                    .user(user)
                    .title("My Trip")
                    .build();
            trip = tripRepository.save(trip);
        } else {
            trip = trips.get(0);
        }
        
        tripLocationRepository.deleteByTripId(trip.getId());

        List<Long> locationIds = items.stream()
                .map(TripLocationSyncItem::locationId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Location> locationById = locationRepository.findAllById(locationIds).stream()
                .collect(Collectors.toMap(Location::getId, loc -> loc));

        List<TripLocation> tripLocations = new java.util.ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            TripLocationSyncItem syncItem = items.get(i);
            Location loc = locationById.get(syncItem.locationId());
            if (loc == null) continue;

            tripLocations.add(TripLocation.builder()
                    .trip(trip)
                    .location(loc)
                    .day(syncItem.day() != null ? syncItem.day() : 1)
                    .sortOrder(syncItem.order() != null ? syncItem.order() : i)
                    .build());
        }
        tripLocationRepository.saveAll(tripLocations);
    }
}
