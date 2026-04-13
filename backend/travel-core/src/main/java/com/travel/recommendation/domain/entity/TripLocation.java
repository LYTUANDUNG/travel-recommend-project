package com.travel.recommendation.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripLocation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    @Builder.Default
    private Integer day = 1;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(length = 255)
    private String note;
}
