package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.entity.Tag;
import com.travel.recommendation.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Tag>>> getAllTags() {
        return ResponseEntity.ok(ApiResponse.success(tagService.getAllTags()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Tag>> createTag(@RequestBody Tag tag) {
        // Simple check for existing tag name
        if (tagService.getTagByName(tag.getName()).isPresent()) {
            return ResponseEntity.ok(ApiResponse.error("Tag name already exists"));
        }
        return ResponseEntity.ok(ApiResponse.success(tagService.saveTag(tag)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tag deleted successfully"));
    }
}
