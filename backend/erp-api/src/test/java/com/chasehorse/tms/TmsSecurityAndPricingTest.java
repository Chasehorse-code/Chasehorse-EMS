package com.chasehorse.tms;

import com.chasehorse.auth.RoleAuthorization;
import com.chasehorse.common.AuditService;
import com.chasehorse.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TmsController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "SUPABASE_JWT_ISSUER=https://phxybimufcrsnxfepiuz.supabase.co/auth/v1")
class TmsSecurityAndPricingTest {

    @Autowired private MockMvc mvc;
    @MockBean private JdbcTemplate jdbc;
    @MockBean private AuditService audit;
    @MockBean(name = "roleAuthorization") private RoleAuthorization roleAuthorization;
    @MockBean private JwtDecoder jwtDecoder;

    @Test
    void publicTrackingReturnsSanitizedViewWithoutTotalPrice() throws Exception {
        UUID bookingId = UUID.randomUUID();
        TmsController.PublicTrackingView publicView = new TmsController.PublicTrackingView(
            bookingId, "CH-TRK-7711", "IN_TRANSIT", "Vijayawada Central",
            "Guntur Terminal", "Agricultural Fertilisers", BigDecimal.valueOf(1200.0),
            OffsetDateTime.now(), List.of()
        );

        when(jdbc.query(anyString(), any(RowMapper.class), eq("CH-TRK-7711")))
            .thenReturn(List.of(publicView));
        when(jdbc.query(contains("tms_tracking_events"), any(RowMapper.class), eq(bookingId)))
            .thenReturn(List.of());

        mvc.perform(get("/api/v1/tms/tracking/CH-TRK-7711"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.bookingRef").value("CH-TRK-7711"))
           .andExpect(jsonPath("$.status").value("IN_TRANSIT"))
           .andExpect(jsonPath("$.originAddress").value("Vijayawada Central"))
           .andExpect(jsonPath("$.totalPrice").doesNotExist());
    }

    @Test
    void unauthenticatedAccessToShipmentsIsRejected() throws Exception {
        mvc.perform(get("/api/v1/tms/shipments"))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCanAccessTheirScopedShipments() throws Exception {
        UUID customerId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(customerId.toString())).thenReturn(List.of("CUSTOMER"));
        when(jdbc.query(contains("WHERE customer_id = ?"), any(RowMapper.class), eq(customerId)))
            .thenReturn(List.of());

        mvc.perform(get("/api/v1/tms/shipments")
                .with(jwt().jwt(j -> j.subject(customerId.toString()))))
           .andExpect(status().isOk());
    }
}
