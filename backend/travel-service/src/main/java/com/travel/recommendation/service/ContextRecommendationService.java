package com.travel.recommendation.service;

import com.travel.recommendation.domain.entity.Location;
import org.springframework.stereotype.Service;

@Service
public class ContextRecommendationService {

    public double distanceScore(Double userLat, Double userLng, Location loc) {
        if (userLat == null || userLng == null || loc.getLatitude() == null || loc.getLongitude() == null) {
            return 1.0;
        }
        double distKm = haversine(userLat, userLng, loc.getLatitude(), loc.getLongitude());
        return 1.0 / (1.0 + distKm);
    }

    public double contextScore(Location loc, int hour, String weather) {
        double score = 0.5;
        String cat = loc.getCategoryName() != null ? loc.getCategoryName().toLowerCase() : "";

        if (hour >= 6 && hour <= 10 && (cat.contains("cà phê") || cat.contains("sáng") || cat.contains("ngắm cảnh"))) score += 0.3;
        if (hour >= 18 && hour <= 23 && (cat.contains("ăn tối") || cat.contains("bar") || cat.contains("phố đi bộ"))) score += 0.3;

        if ("rainy".equalsIgnoreCase(weather) || "mưa".equalsIgnoreCase(weather)) {
            if (cat.contains("trong nhà") || cat.contains("bảo tàng") || cat.contains("trung tâm")) score += 0.2;
            else score -= 0.2;
        } else if (weather != null) {
            if (cat.contains("ngoài trời") || cat.contains("biển") || cat.contains("núi")) score += 0.2;
        }

        return Math.min(Math.max(score, 0.0), 1.0);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int r = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }
}
