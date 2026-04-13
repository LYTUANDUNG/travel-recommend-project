package com.travel.recommendation.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogDto {
    private Long id;
    private String title;
    private String content;
    private String excerpt;
    private String thumbnail_url;
    private String category;
    private Long author_id;
    private String author_name;
    private LocalDateTime created_at;
}
