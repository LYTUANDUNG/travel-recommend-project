package com.travel.recommendation.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Location extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_id")
    @JsonProperty("location_id")
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "preview_experience", columnDefinition = "TEXT")
    private String previewExperience;

    private String address;

    @Column(length = 100)
    private String ward;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String province;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @JsonIgnore
    @Column(columnDefinition = "POINT SRID 4326")
    private org.locationtech.jts.geom.Point coordinate;

    @PrePersist
    @PreUpdate
    public void updateCoordinate() {
        if (this.longitude != null && this.latitude != null) {
            org.locationtech.jts.geom.GeometryFactory gf = new org.locationtech.jts.geom.GeometryFactory(
                    new org.locationtech.jts.geom.PrecisionModel(), 4326);
            this.coordinate = gf.createPoint(new org.locationtech.jts.geom.Coordinate(this.longitude, this.latitude));
        }
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @JsonProperty("category_id")
    public Long getCategoryId() {
        return category != null ? category.getId() : null;
    }

    @JsonProperty("category_name")
    public String getCategoryName() {
        return category != null ? category.getName() : null;
    }

    @Column(name = "price_level")
    private Integer priceLevel;

    @Column(name = "price_range_str", length = 50)
    private String priceRangeStr;

    @Column(name = "opening_hour")
    private LocalTime openingHour;

    @Column(name = "closing_hour")
    private LocalTime closingHour;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;
    
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "images_json", columnDefinition = "JSON")
    private String imagesJson;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VisitRequest> visitRequests;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Favorite> favorites;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LocationTag> locationTags;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserBehaviorLog> behaviorLogs;

    @Transient
    private List<Tag> tags;
}
