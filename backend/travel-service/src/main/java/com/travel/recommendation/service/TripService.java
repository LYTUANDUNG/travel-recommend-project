package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.Trip;
import com.travel.recommendation.domain.entity.TripLocation;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.repository.LocationRepository;
import com.travel.recommendation.repository.TripLocationRepository;
import com.travel.recommendation.repository.TripRepository;
import com.travel.recommendation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripLocationRepository tripLocationRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

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
        
        // Clear existing locations
        tripLocationRepository.deleteByTripId(trip.getId());
        
        // Add new locations in order
        for (int i = 0; i < locationIds.size(); i++) {
            Long locId = locationIds.get(i);
            Location loc = locationRepository.findById(locId).orElseThrow();
            TripLocation item = TripLocation.builder()
                    .trip(trip)
                    .location(loc)
                    .day(1)
                    .sortOrder(i)
                    .build();
            tripLocationRepository.save(item);
        }
    }
}
