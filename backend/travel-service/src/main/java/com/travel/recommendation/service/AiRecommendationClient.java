package com.travel.recommendation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiRecommendationClient {

    private final RestTemplate restTemplate;

    @Value("${AI_SERVICE_BASE_URL:http://localhost:8000}")
    private String aiServiceBaseUrl;

    public List<AiRankedItem> collaborative(Long userId, int topN) {
        String url = String.format("%s/recommend/collaborative?user_id=%d&top_n=%d", aiServiceBaseUrl, userId, topN);
        return fetchRankedItems(url);
    }

    public List<AiRankedItem> content(Long locationId, int topN) {
        String url = String.format("%s/recommend/content?location_id=%d&top_n=%d", aiServiceBaseUrl, locationId, topN);
        return fetchRankedItems(url);
    }

    private List<AiRankedItem> fetchRankedItems(String url) {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
                    }
            );
            Object data = response.getBody() != null ? response.getBody().get("data") : null;
            if (!(data instanceof List<?> list)) {
                return List.of();
            }

            List<AiRankedItem> ranked = new ArrayList<>();
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> map)) continue;
                Object placeIdObj = map.get("placeId");
                Object scoreObj = map.get("score");
                if (placeIdObj instanceof Number placeId) {
                    double score = scoreObj instanceof Number n ? n.doubleValue() : 0.0;
                    ranked.add(new AiRankedItem(placeId.longValue(), score));
                }
            }
            return ranked;
        } catch (Exception ex) {
            log.warn("AI recommendation call failed: {}", ex.getMessage());
            return List.of();
        }
    }

    public record AiRankedItem(Long placeId, Double score) {
    }
}
