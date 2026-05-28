package com.travel.recommendation.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "reviews",
        indexes = {
                @Index(name = "idx_reviews_location", columnList = "location_id"),
                @Index(name = "idx_reviews_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    @JsonProperty("review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @JsonProperty("user_id")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @JsonProperty("location_id")
    public Long getLocationId() {
        return location != null ? location.getId() : null;
    }

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "images_json", columnDefinition = "JSON")
    private String imagesJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "verify_status", length = 30)
    @Builder.Default
    private VerifyStatus verifyStatus = VerifyStatus.APPROVED;

    @Column(name = "visit_date")
    @Builder.Default
    private LocalDate visitDate = LocalDate.now();



    @Column(name = "is_edited")
    @Builder.Default
    private Boolean isEdited = false;

    public enum VerifyStatus {
        APPROVED, HIDDEN
    }
}
