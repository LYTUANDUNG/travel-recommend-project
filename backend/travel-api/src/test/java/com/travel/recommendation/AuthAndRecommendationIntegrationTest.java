package com.travel.recommendation;

import com.travel.recommendation.adapter.in.web.controller.AuthController;
import com.travel.recommendation.adapter.in.web.controller.GlobalExceptionHandler;
import com.travel.recommendation.adapter.in.web.controller.LocationController;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.recommendation.domain.dto.AuthRequest;
import com.travel.recommendation.domain.dto.LocationResponse;
import com.travel.recommendation.domain.entity.User;
import com.travel.recommendation.security.JwtTokenProvider;
import com.travel.recommendation.service.LocationService;
import com.travel.recommendation.service.RecommendationService;
import com.travel.recommendation.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AuthController.class, LocationController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class AuthAndRecommendationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private RecommendationService recommendationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private LocationService locationService;

    @Test
    void login_shouldReturnEnvelopeWithToken() throws Exception {
        User user = User.builder()
                .id(1L)
                .email("demo@example.com")
                .username("demo")
                .password("$2a$10$abc")
                .role(User.Role.USER)
                .isActive(true)
                .build();
        user.setCreatedAt(LocalDateTime.now());

        when(userService.findByEmail("demo@example.com")).thenReturn(Optional.of(user));
        when(userService.matchesPassword("password123", user.getPassword())).thenReturn(true);
        when(jwtTokenProvider.generateToken(1L, "ROLE_USER")).thenReturn("jwt-token");

        AuthRequest request = new AuthRequest();
        request.setEmail("demo@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status_code").value(200))
                .andExpect(jsonPath("$.data.token").value("jwt-token"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void smartRecommendations_shouldReturnStandardEnvelope() throws Exception {
        LocationResponse item = LocationResponse.builder()
                .locationId(10L)
                .name("Da Nang Beach")
                .bestTimeToVisit("Evening (18:00-22:00)")
                .bestTimeReason("Behavior 80%, weather 70%, category 90% favor evening")
                .build();
        when(recommendationService.getGuestRecommendations()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/locations/recommendations/smart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status_code").value(200))
                .andExpect(jsonPath("$.data[0].location_id").value(10))
                .andExpect(jsonPath("$.data[0].best_time_to_visit").exists());
    }

    @Test
    void register_withInvalidPayload_shouldReturn422() throws Exception {
        String payload = """
                {
                  "username": "",
                  "email": "not-an-email",
                  "password": "123",
                  "full_name": ""
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status_code").value(422))
                .andExpect(jsonPath("$.errors.email").exists());
    }
}
