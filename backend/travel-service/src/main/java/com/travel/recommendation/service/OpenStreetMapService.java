package com.travel.recommendation.service;

import java.util.Locale;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.recommendation.domain.dto.LocationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class OpenStreetMapService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Use a secondary endpoint or increase connection timeout
    private static final String OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

    // Build specialized RestTemplate inside the bean or inject
    public OpenStreetMapService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(60000); // 1 minute read timeout for heavy scanning
        this.restTemplate = new RestTemplate(factory);
    }

    public List<LocationResponse> scanLocations(Double lat, Double lng, Double radiusInMeters) {
        String query = String.format(Locale.US,
                "[out:json][timeout:90];" +
                        "(" +
                        "  node[\"tourism\"](around:%f,%f,%f);" +
                        "  node[\"historic\"](around:%f,%f,%f);" +
                        "  node[\"amenity\"~\"restaurant|food_court|place_of_worship|theatre|cinema|marketplace\"](around:%f,%f,%f);"
                        +
                        "  node[\"leisure\"~\"park|nature_reserve|resort\"](around:%f,%f,%f);" +
                        "  node[\"natural\"~\"beach|peak|waterfall|cave_entrance\"](around:%f,%f,%f);" +
                        "  node[\"shop\"~\"mall|department_store\"](around:%f,%f,%f);" +
                        ");" +
                        "out body;",
                radiusInMeters, lat, lng,
                radiusInMeters, lat, lng,
                radiusInMeters, lat, lng,
                radiusInMeters, lat, lng,
                radiusInMeters, lat, lng,
                radiusInMeters, lat, lng);

        log.info("Querying Overpass API with lat={}, lng={}, radius={}", lat, lng, radiusInMeters);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<String> entity = new HttpEntity<>("data=" + query, headers);

            String response = restTemplate.postForObject(OVERPASS_API_URL, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode elements = root.path("elements");

            List<LocationResponse> locations = new ArrayList<>();
            for (JsonNode element : elements) {
                if (!element.has("tags"))
                    continue;

                JsonNode tags = element.get("tags");
                String name = tags.has("name") ? tags.get("name").asText()
                        : tags.has("name:en") ? tags.get("name:en").asText() : "Unnamed Location";

                Double eLat = element.has("lat") ? element.get("lat").asDouble() : null;
                Double eLng = element.has("lon") ? element.get("lon").asDouble() : null;

                if (eLat == null || eLng == null)
                    continue;

                String address = tags.has("addr:street") ? tags.get("addr:street").asText() : "";
                if (tags.has("addr:housenumber"))
                    address = tags.get("addr:housenumber").asText() + " " + address;

                // Structured Address Extraction
                String ward = tags.has("addr:suburb") ? tags.get("addr:suburb").asText()
                        : tags.has("suburb") ? tags.get("suburb").asText() : "";
                String district = tags.has("addr:district") ? tags.get("addr:district").asText()
                        : tags.has("district") ? tags.get("district").asText() : "";
                String province = tags.has("addr:city") ? tags.get("addr:city").asText()
                        : tags.has("addr:province") ? tags.get("addr:province").asText() : "Việt Nam";

                String categoryName = "Khám phá";
                String thumbnailUrl = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80";
                Integer priceLevel = 1; // Default
                String priceRangeStr = "Dưới 100k";

                if (tags.has("amenity")) {
                    String amenity = tags.get("amenity").asText();
                    if (amenity.matches("restaurant|food_court|cafe|bar")) {
                        categoryName = "Ăn uống";
                        thumbnailUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80";
                        priceLevel = 2; // Restaurants usually higher
                        priceRangeStr = "100k - 500k";
                    } else if (amenity.equals("place_of_worship")) {
                        categoryName = "Văn hóa - Tâm linh";
                        thumbnailUrl = "https://images.unsplash.com/photo-1542640244-7e672d62024b?auto=format&fit=crop&q=80";
                    } else if (amenity.matches("theatre|cinema")) {
                        categoryName = "Giải trí";
                        thumbnailUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80";
                        priceLevel = 3;
                        priceRangeStr = "200k - 1tr";
                    } else if (amenity.equals("marketplace")) {
                        categoryName = "Mua sắm";
                        thumbnailUrl = "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80";
                    }
                } else if (tags.has("shop")) {
                    categoryName = "Mua sắm";
                    thumbnailUrl = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80";
                } else if (tags.has("natural") || tags.has("leisure")) {
                    categoryName = "Sinh thái & Nghỉ dưỡng";
                    thumbnailUrl = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80";
                } else if (tags.has("historic")) {
                    categoryName = "Văn hóa - Tâm linh";
                    thumbnailUrl = "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&q=80";
                } else if (tags.has("tourism")) {
                    String tourism = tags.get("tourism").asText();
                    if (tourism.matches("hotel|hostel|resort")) {
                        categoryName = "Lưu trú";
                        thumbnailUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80";
                    } else if (tourism.matches("museum|gallery")) {
                        categoryName = "Nghệ thuật";
                        thumbnailUrl = "https://images.unsplash.com/photo-1518998053401-d41bedd3d789?auto=format&fit=crop&q=80";
                    } else {
                        categoryName = "Tham quan trải nghiệm";
                        thumbnailUrl = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80";
                    }
                }

                String desc = tags.has("description") ? tags.get("description").asText()
                        : String.format(
                                "Địa điểm %s nổi bật tại khu vực này. Một địa điểm lý tưởng để bạn bổ sung vào lịch trình trải nghiệm của mình.",
                                categoryName.toLowerCase());

                LocationResponse loc = LocationResponse.builder()
                        .name(name)
                        .latitude(eLat)
                        .longitude(eLng)
                        .address(address)
                        .district(district)
                        .province(province)
                        .description(desc)
                        .categoryName(categoryName)
                        .thumbnailUrl(thumbnailUrl)
                        .openingHour(java.time.LocalTime.of(8, 0))
                        .closingHour(java.time.LocalTime.of(22, 0))
                        .priceLevel(priceLevel)
                        .priceRangeStr(priceRangeStr)
                        .build();

                locations.add(loc);
            }
            return locations;
        } catch (Exception e) {
            log.error("Error scanning OSM locations", e);
            throw new RuntimeException("Failed to scan locations from OpenStreetMap: " + e.getMessage());
        }
    }
}
