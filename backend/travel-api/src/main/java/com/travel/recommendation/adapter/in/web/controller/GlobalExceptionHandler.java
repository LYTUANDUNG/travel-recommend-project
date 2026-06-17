package com.travel.recommendation.adapter.in.web.controller;

import com.travel.recommendation.domain.dto.ApiResponse;
import com.travel.recommendation.domain.exception.BadRequestException;
import com.travel.recommendation.domain.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Không tìm thấy tài nguyên: {}", ex.getMessage());
        ApiResponse<Object> body = ApiResponse.error(ex.getMessage());
        body.setStatusCode(404);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(BadRequestException ex) {
        log.warn("Yêu cầu không hợp lệ (Bad Request): {}", ex.getMessage());
        ApiResponse<Object> body = ApiResponse.error(ex.getMessage());
        body.setStatusCode(400);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        ApiResponse<Object> body = ApiResponse.error("Validation failed", errors);
        body.setStatusCode(422);
        return ResponseEntity.unprocessableEntity().body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        ApiResponse<Object> body = ApiResponse.error(ex.getMessage());
        body.setStatusCode(400);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntime(RuntimeException ex) {
        log.warn("Business logic exception: {}", ex.getMessage());
        ApiResponse<Object> body = ApiResponse.error(ex.getMessage());
        body.setStatusCode(400); // Return as Bad Request to indicate logic failure
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        log.error("Database integrity violation: {}", ex.getMessage());
        String msg = "Lỗi dữ liệu: Có thể bạn đã đánh giá địa điểm này hoặc dữ liệu nhập vào không hợp lệ.";
        ApiResponse<Object> body = ApiResponse.error(msg);
        body.setStatusCode(409);
        return ResponseEntity.status(409).body(body);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraint(jakarta.validation.ConstraintViolationException ex) {
        log.warn("Constraint violation: {}", ex.getMessage());
        ApiResponse<Object> body = ApiResponse.error("Dữ liệu không hợp lệ: " + ex.getMessage());
        body.setStatusCode(400);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception: type={}, message={}", ex.getClass().getName(), ex.getMessage(), ex);
        ApiResponse<Object> body = ApiResponse.error("Internal server error: " + ex.getMessage());
        body.setStatusCode(500);
        return ResponseEntity.internalServerError().body(body);
    }
}
