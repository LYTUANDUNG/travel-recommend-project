package com.travel.recommendation.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    @JsonProperty("image_url")
    private String imageUrl;

    @Column(length = 255)
    private String link;

    @Column(name = "is_active")
    @JsonProperty("is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "display_order")
    @JsonProperty("display_order")
    private Integer displayOrder;
}
