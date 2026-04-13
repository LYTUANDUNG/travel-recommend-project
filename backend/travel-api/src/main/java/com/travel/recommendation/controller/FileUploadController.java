package com.travel.recommendation.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.service.FileUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = fileUploadService.uploadFile(file);
            return ResponseEntity.ok(ApiResponse.success(url, "Upload thành công"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Lỗi khi upload ảnh: " + e.getMessage()));
        }
    }
}
