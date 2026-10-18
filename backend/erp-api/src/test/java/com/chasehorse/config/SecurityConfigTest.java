package com.chasehorse.config;

import com.chasehorse.auth.CurrentUserController;
import com.chasehorse.profiles.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CurrentUserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "SUPABASE_JWT_ISSUER=https://phxybimufcrsnxfepiuz.supabase.co/auth/v1")
class SecurityConfigTest {
    @Autowired MockMvc mvc;
    @MockBean JwtDecoder jwtDecoder;
    @MockBean ProfileService profileService;

    @Test void protectedEndpointRejectsAnonymousRequest() throws Exception {
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    }
}