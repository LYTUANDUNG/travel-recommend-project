package com.travel.recommendation.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    @JsonProperty("user_id")
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "full_name", length = 100)
    @JsonProperty("full_name")
    private String fullName;

    @Column(name = "phone_number", length = 20)
    @JsonProperty("phone_number")
    private String phoneNumber;

    @Column(name = "avatar_url")
    @JsonProperty("avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @JsonProperty("gender")
    private Gender gender;

    @Column(name = "birth_year")
    @JsonProperty("birth_year")
    private Integer birthYear;

    @Column(length = 100)
    @JsonProperty("city")
    private String city;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("interests")
    private String interests;

    @Column(length = 50)
    @JsonProperty("nationality")
    @Builder.Default
    private String nationality = "Việt Nam";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "last_avatar_update")
    @JsonProperty("last_avatar_update")
    private LocalDateTime lastAvatarUpdate;

    public enum Role {
        USER, ADMIN, PARTNER
    }

    public enum Gender {
        MALE, FEMALE, OTHER
    }
}
