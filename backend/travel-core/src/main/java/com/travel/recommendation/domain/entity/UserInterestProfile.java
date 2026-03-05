package com.travel.recommendation.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_interest_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInterestProfile {

    @EmbeddedId
    @Builder.Default
    private UserInterestProfileId id = new UserInterestProfileId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("categoryId")
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "affinity_score")
    @Builder.Default
    private Double affinityScore = 0.5;
}
