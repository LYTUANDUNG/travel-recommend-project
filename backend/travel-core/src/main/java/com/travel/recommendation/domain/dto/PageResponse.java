package com.travel.recommendation.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> implements Serializable {
    private List<T> content;
    
    @JsonProperty("total_elements")
    private long totalElements;
    
    @JsonProperty("total_pages")
    private int totalPages;
    
    @JsonProperty("page_number")
    private int pageNumber;
    
    @JsonProperty("page_size")
    private int pageSize;
    
    public long getTotalElements() {
        return totalElements;
    }
    
    public int getTotalPages() {
        return totalPages;
    }
    
    public int getPageNumber() {
        return pageNumber;
    }
    
    public int getPageSize() {
        return pageSize;
    }

    public static <T> PageResponse<T> of(org.springframework.data.domain.Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
