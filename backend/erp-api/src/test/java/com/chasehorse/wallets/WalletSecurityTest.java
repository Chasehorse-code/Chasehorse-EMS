package com.chasehorse.wallets;

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

@WebMvcTest(WalletController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "SUPABASE_JWT_ISSUER=https://phxybimufcrsnxfepiuz.supabase.co/auth/v1")
class WalletSecurityTest {

    @Autowired private MockMvc mvc;
    @MockBean private JdbcTemplate jdbc;
    @MockBean private AuditService audit;
    @MockBean(name = "roleAuthorization") private RoleAuthorization roleAuthorization;
    @MockBean private JwtDecoder jwtDecoder;

    @Test
    void employeeCannotAccessOtherEmployeesWalletTransactions() throws Exception {
        UUID employeeA = UUID.randomUUID();
        UUID employeeB = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(employeeA.toString())).thenReturn(List.of("EMPLOYEE"));

        mvc.perform(get("/api/v1/wallets/" + employeeB + "/transactions")
                .with(jwt().jwt(j -> j.subject(employeeA.toString()))))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.message").value("You are only permitted to view your own wallet transactions"));
    }

    @Test
    void employeeCanAccessOwnWalletTransactions() throws Exception {
        UUID employeeA = UUID.randomUUID();
        UUID txnId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(employeeA.toString())).thenReturn(List.of("EMPLOYEE"));

        WalletController.WalletTransactionView sampleTxn = new WalletController.WalletTransactionView(
            txnId, employeeA, "task_reward", BigDecimal.valueOf(250.00), "completed",
            OffsetDateTime.now(), "Storefront verification bounty", UUID.randomUUID()
        );

        when(jdbc.query(anyString(), any(RowMapper.class), eq(employeeA)))
            .thenReturn(List.of(sampleTxn));

        mvc.perform(get("/api/v1/wallets/" + employeeA + "/transactions")
                .with(jwt().jwt(j -> j.subject(employeeA.toString()))))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].id").value(txnId.toString()))
           .andExpect(jsonPath("$[0].amountInr").value(250.00));
    }

    @Test
    void adminCanAccessAnyEmployeesWalletTransactions() throws Exception {
        UUID adminId = UUID.randomUUID();
        UUID employeeB = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(adminId.toString())).thenReturn(List.of("ADMIN"));
        when(jdbc.query(anyString(), any(RowMapper.class), eq(employeeB)))
            .thenReturn(List.of());

        mvc.perform(get("/api/v1/wallets/" + employeeB + "/transactions")
                .with(jwt().jwt(j -> j.subject(adminId.toString()))))
           .andExpect(status().isOk());
    }
}
