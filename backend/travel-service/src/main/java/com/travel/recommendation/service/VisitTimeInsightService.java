package com.travel.recommendation.service;

import com.travel.recommendation.adapter.out.persistence.ReviewRepository;
import com.travel.recommendation.domain.entity.Location;
import com.travel.recommendation.domain.entity.Review;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitTimeInsightService {
    private static long lastRateLimitTime = 0;
    private static final long COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

    private final ReviewRepository reviewRepository;
    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private VisitTimeInsightService self;

    public VisitTimeInsight computeBestTime(Location location) {
        try {
            Map<String, Double> scores = new HashMap<>();
            scores.put("morning", 0.0);
            scores.put("afternoon", 0.0);
            scores.put("evening", 0.0);

            Map<String, Double> behavior = behaviorScore(location.getId());
            Map<String, Double> weather = self.weatherScore(location.getLatitude(), location.getLongitude());
            Map<String, Double> category = categoryScore(location.getCategory() != null ? location.getCategory().getName() : null);

            for (String slot : scores.keySet()) {
                double weighted = behavior.getOrDefault(slot, 0.0) * 0.5
                        + weather.getOrDefault(slot, 0.0) * 0.3
                        + category.getOrDefault(slot, 0.0) * 0.2;
                scores.put(slot, weighted);
            }

            String bestSlot = scores.entrySet().stream()
                    .max(Comparator.comparingDouble(Map.Entry::getValue))
                    .map(Map.Entry::getKey)
                    .orElse("afternoon");

            String reason = String.format(
                    "Behavior %.0f%%, weather %.0f%%, category %.0f%% favor %s",
                    behavior.getOrDefault(bestSlot, 0.0) * 100.0,
                    weather.getOrDefault(bestSlot, 0.0) * 100.0,
                    category.getOrDefault(bestSlot, 0.0) * 100.0,
                    humanize(bestSlot)
            );
            return new VisitTimeInsight(humanize(bestSlot), reason);
        } catch (Exception e) {
            log.error("Error computing visit time insight for location {}: {}", location.getId(), e.getMessage());
            return new VisitTimeInsight("Afternoon (12:00-17:00)", "Dựa trên xu hướng tham quan phổ biến.");
        }
    }

    private Map<String, Double> behaviorScore(Long locationId) {
        Map<String, Double> slotCounts = new HashMap<>();
        slotCounts.put("morning", 1.0);
        slotCounts.put("afternoon", 1.0);
        slotCounts.put("evening", 1.0);

        List<Review> reviews = reviewRepository.findByLocation_IdAndVerifyStatus(locationId, Review.VerifyStatus.APPROVED);
        for (Review review : reviews) {
            LocalDateTime created = review.getCreatedAt();
            if (created == null) continue;
            String slot = toSlot(created.getHour());
            slotCounts.put(slot, slotCounts.getOrDefault(slot, 0.0) + 1);
        }

        double max = slotCounts.values().stream().mapToDouble(v -> v).max().orElse(1.0);
        Map<String, Double> normalized = new HashMap<>();
        for (Map.Entry<String, Double> e : slotCounts.entrySet()) {
            normalized.put(e.getKey(), e.getValue() / max);
        }
        return normalized;
    }

    @org.springframework.cache.annotation.Cacheable(value = "weatherScores", key = "T(java.lang.String).format('%.2f_%.2f', #p0, #p1)", unless = "#result == null")
    public java.util.HashMap<String, Double> weatherScore(Double lat, Double lng) {
        java.util.HashMap<String, Double> fallback = new java.util.HashMap<>(Map.of("morning", 0.6, "afternoon", 0.6, "evening", 0.6));
        if (lat == null || lng == null) return fallback;

        // Circuit Breaker: If we hit a rate limit recently, don't try again
        if (System.currentTimeMillis() - lastRateLimitTime < COOLDOWN_MS) {
            return fallback;
        }

        try {
            String url = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&hourly=temperature_2m,precipitation_probability&forecast_days=1&timezone=auto",
                    lat, lng
            );
            ResponseEntity<Map<String, Object>> res = restTemplate.exchange(url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            Map<String, Object> body = res.getBody();
            if (body == null || !(body.get("hourly") instanceof Map<?, ?> hourly)) return fallback;

            List<Double> temps = toNumberList(hourly.get("temperature_2m"));
            List<Double> rains = toNumberList(hourly.get("precipitation_probability"));
            if (temps.isEmpty() || rains.isEmpty()) return fallback;

            return new java.util.HashMap<>(Map.of(
                    "morning", computeWeatherSlot(temps, rains, 6, 11),
                    "afternoon", computeWeatherSlot(temps, rains, 12, 17),
                    "evening", computeWeatherSlot(temps, rains, 18, 22)
            ));
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            log.warn("Weather API Rate Limit hit. Entering cooldown.");
            lastRateLimitTime = System.currentTimeMillis();
            return fallback;
        } catch (Exception e) {
            log.warn("Weather insight fallback: {}", e.getMessage());
            return fallback;
        }
    }

    private Map<String, Double> categoryScore(String categoryName) {
        String cat = categoryName != null ? categoryName.toLowerCase() : "";
        double morning = 0.5, afternoon = 0.5, evening = 0.5;
        if (cat.contains("cà phê") || cat.contains("cafe") || cat.contains("sinh thái")) morning = 0.9;
        if (cat.contains("bảo tàng") || cat.contains("tham quan") || cat.contains("văn hóa")) afternoon = 0.85;
        if (cat.contains("ẩm thực") || cat.contains("bar") || cat.contains("phố")) evening = 0.9;
        return Map.of("morning", morning, "afternoon", afternoon, "evening", evening);
    }

    private double computeWeatherSlot(List<Double> temps, List<Double> rains, int fromHour, int toHour) {
        double score = 0.0;
        int count = 0;
        for (int h = fromHour; h <= toHour && h < temps.size() && h < rains.size(); h++) {
            double t = temps.get(h);
            double r = rains.get(h);
            double tempScore = 1.0 - Math.min(Math.abs(t - 26.0) / 20.0, 1.0);
            double rainScore = 1.0 - Math.min(r / 100.0, 1.0);
            score += (tempScore * 0.6) + (rainScore * 0.4);
            count++;
        }
        return count == 0 ? 0.6 : score / count;
    }

    private List<Double> toNumberList(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        return list.stream()
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .map(Number::doubleValue)
                .collect(java.util.stream.Collectors.toList());
    }

    private String toSlot(int hour) {
        if (hour >= 6 && hour <= 11) return "morning";
        if (hour >= 12 && hour <= 17) return "afternoon";
        return "evening";
    }

    private String humanize(String slot) {
        return switch (slot) {
            case "morning" -> "Morning (06:00-11:00)";
            case "afternoon" -> "Afternoon (12:00-17:00)";
            default -> "Evening (18:00-22:00)";
        };
    }

    public record VisitTimeInsight(String bestTimeToVisit, String bestTimeReason) {
    }
}
