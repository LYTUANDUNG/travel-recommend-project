package com.travel.recommendation.service;

import com.travel.recommendation.domain.dto.VisitRequestDto;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.domain.entity.VisitRequest;
import com.travel.recommendation.adapter.out.persistence.LocationRepository;
import com.travel.recommendation.adapter.out.persistence.UserRepository;
import com.travel.recommendation.adapter.out.persistence.VisitRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VisitRequestService {

    private final VisitRequestRepository visitRequestRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final LocationService locationService;

    @Transactional
    public VisitRequestDto requestVisit(Long userId, Long locationId, LocalDateTime visitDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        VisitRequest request = VisitRequest.builder()
                .user(user)
                .location(location)
                .visitDate(visitDate)
                .status(VisitRequest.VisitStatus.PENDING)
                .build();
        return mapToDto(visitRequestRepository.save(request));
    }

    @Transactional
    public VisitRequestDto updateStatus(Long requestId, VisitRequest.VisitStatus newStatus) {
        VisitRequest request = visitRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(newStatus);
        return mapToDto(visitRequestRepository.save(request));
    }

    @Transactional
    public boolean verifyQrAndComplete(Long visitId) {
        int updated = visitRequestRepository.markAsCompletedIfPending(visitId, VisitRequest.VisitStatus.COMPLETED);
        return updated > 0;
    }

    @Transactional(readOnly = true)
    public List<VisitRequestDto> getAllRequests() {
        return visitRequestRepository.findAll().stream()
                .map(v -> mapToDto(v, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<VisitRequestDto> getPaginatedRequests(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("id").descending());
        return visitRequestRepository.findAllPaginated(pageable)
                .map(v -> mapToDto(v, false));
    }

    @Transactional(readOnly = true)
    public List<VisitRequestDto> getUserRequests(Long userId) {
        return visitRequestRepository.findByUser_Id(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public VisitRequestDto mapToDto(VisitRequest request) {
        return mapToDto(request, true);
    }

    public VisitRequestDto mapToDto(VisitRequest request, boolean includeInsight) {
        return VisitRequestDto.builder()
                .id(request.getId())
                .userId(request.getUser() != null ? request.getUser().getId() : null)
                .userName(request.getUser() != null ? request.getUser().getFullName() : null)
                .locationId(request.getLocation() != null ? request.getLocation().getId() : null)
                .locationName(request.getLocation() != null ? request.getLocation().getName() : null)
                .status(request.getStatus() != null ? request.getStatus().name() : null)
                .visitDate(request.getVisitDate())
                .createdAt(request.getCreatedAt())
                .location(request.getLocation() != null ? (includeInsight ? locationService.mapToResponse(request.getLocation()) : null) : null)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean canUserReview(Long userId, Long locationId) {
        return visitRequestRepository.existsByUser_IdAndLocation_IdAndStatusIn(
                userId, locationId, java.util.Arrays.asList(VisitRequest.VisitStatus.APPROVED, VisitRequest.VisitStatus.COMPLETED));
    }

    @Transactional
    public void completeApprovedVisitAfterReview(Long userId, Long locationId) {
        visitRequestRepository.findFirstByUser_IdAndLocation_IdAndStatusOrderByCreatedAtDesc(
                userId, locationId, VisitRequest.VisitStatus.APPROVED)
                .ifPresent(request -> {
                    request.setStatus(VisitRequest.VisitStatus.COMPLETED);
                    visitRequestRepository.save(request);
                });
    }
}
