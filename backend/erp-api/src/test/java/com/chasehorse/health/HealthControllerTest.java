package com.chasehorse.health;

import com.chasehorse.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HealthController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "SUPABASE_JWT_ISSUER=https://phxybimufcrsnxfepiuz.supabase.co/auth/v1")
class HealthControllerTest {
    @Autowired MockMvc mvc;
    @MockBean JwtDecoder jwtDecoder;

    @Test void healthEndpointReturnsOk() throws Exception {
        mvc.perform(get("/api/v1/health"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("ok"));
    }
}