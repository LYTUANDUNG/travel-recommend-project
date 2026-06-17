package com.travel.recommendation.security;

import com.travel.recommendation.domain.exception.BadRequestException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {
        // Prevent instantiation of utility class
    }

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() 
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("Người dùng chưa được xác thực hoặc token đã hết hạn");
        }
        
        String name = authentication.getName();
        try {
            return Long.valueOf(name);
        } catch (NumberFormatException e) {
            throw new BadRequestException("Định danh người dùng trong token không hợp lệ");
        }
    }
}
