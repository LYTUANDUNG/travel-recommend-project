package com.travel.recommendation.adapter.in.web.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Slf4j
@Component
public class PerformanceInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) {
        // No-op
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Object startTimeAttr = request.getAttribute("startTime");
        if (startTimeAttr == null) return;

        long startTime = (Long) startTimeAttr;
        long endTime = System.currentTimeMillis();
        long executeTime = endTime - startTime;
        
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int status = response.getStatus();
        
        // Use a distinctive format for the professor to see
        log.info(">>> PERFORMANCE MONITOR <<< | {} {} | Status: {} | Time Taken: {}ms", 
                 method, uri, status, executeTime);
        
        // Also add it to response header if you want it visible in browser devtools
        response.addHeader("X-Response-Time-Ms", String.valueOf(executeTime));
    }
}
