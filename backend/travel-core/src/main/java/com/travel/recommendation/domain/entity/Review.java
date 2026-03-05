package com.travel.recommendation.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "images_json", columnDefinition = "JSON")
    private String imagesJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "verify_status")
    @Builder.Default
    private VerifyStatus verifyStatus = VerifyStatus.PENDING;

    @Column(name = "visit_date")
    private LocalDate visitDate;

    @Column(name = "trip_type", length = 50)
    private String tripType;

    public enum VerifyStatus {
        PENDING, APPROVED, REJECTED
    }
}
