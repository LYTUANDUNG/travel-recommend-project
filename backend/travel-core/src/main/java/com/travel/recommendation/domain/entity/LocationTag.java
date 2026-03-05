package com.travel.recommendation.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "location_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationTag {

    @EmbeddedId
    @Builder.Default
    private LocationTagId id = new LocationTagId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("locationId")
    @JoinColumn(name = "location_id")
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id")
    private Tag tag;

    @Builder.Default
    private Double score = 1.0;
}
