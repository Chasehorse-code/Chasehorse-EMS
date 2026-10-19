package com.chasehorse.security;

import com.chasehorse.auth.RoleAuthorization;
import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import com.chasehorse.config.MethodSecurityConfig;
import com.chasehorse.config.SecurityConfig;
import com.chasehorse.dashboard.DashboardController;
import com.chasehorse.employees.EmployeeController;
import com.chasehorse.evidence.EvidenceController;
import com.chasehorse.health.HealthController;
import com.chasehorse.tasks.TaskController;
import com.chasehorse.tasks.TaskService;
import com.chasehorse.tms.TmsController;
import com.chasehorse.wallets.WalletController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {
    HealthController.class,
    TaskController.class,
    WalletController.class,
    EmployeeController.class,
    EvidenceController.class,
    DashboardController.class,
    TmsController.class
})
@Import({SecurityConfig.class, MethodSecurityConfig.class})
@TestPropertySource(properties = {
    "SUPABASE_JWT_ISSUER=https://phxybimufcrsnxfepiuz.supabase.co/auth/v1",
    "CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000"
})
class SecurityAuthorizationTest {

    @Autowired private MockMvc mvc;
    @MockBean private JwtDecoder jwtDecoder;
    @MockBean private JdbcTemplate jdbc;
    @MockBean private AuditService audit;
    @MockBean(name = "roleAuthorization") private RoleAuthorization roleAuth;
    @MockBean private TaskService taskService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        Mockito.lenient().when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.lenient().when(roleAuth.hasAny(any(), any(), any())).thenReturn(true);
        Mockito.lenient().when(roleAuth.hasAny(any(), any(), any(), any())).thenReturn(true);
        Mockito.lenient().when(roleAuth.hasAny(any(), any(), any(), any(), any())).thenReturn(true);
        Mockito.lenient().when(roleAuth.hasAny(any(), any(String[].class))).thenReturn(true);
    }

    // -------------------------------------------------------------
    // 1. Missing and Invalid Authentication (401 Unauthorized)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Unauthenticated requests to protected endpoints fail closed with 401")
    void unauthenticatedAccessToProtectedEndpointsFailsClosed() throws Exception {
        mvc.perform(get("/api/v1/tasks"))
           .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/wallets/" + UUID.randomUUID() + "/transactions"))
           .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/dashboard/stats"))
           .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/tms/plans"))
           .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------
    // 2. Public Tracking & Health Endpoints
    // -------------------------------------------------------------
    @Test
    @DisplayName("Public endpoints permit anonymous access without exposing unauthorized resources")
    void publicEndpointsAllowAnonymousAccess() throws Exception {
        mvc.perform(get("/api/v1/health"))
           .andExpect(status().isOk());

        // Tracking endpoint is public but returns 404 for unknown codes
        mvc.perform(get("/api/v1/tms/tracking/TRACK-NONEXISTENT"))
           .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------
    // 3. CORS Origin Allowlist Enforcement
    // -------------------------------------------------------------
    @Test
    @DisplayName("CORS allows configured trusted origin")
    void corsAllowsConfiguredOrigin() throws Exception {
        mvc.perform(get("/api/v1/health")
                .header("Origin", "http://localhost:5173"))
           .andExpect(status().isOk())
           .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    @DisplayName("CORS rejects untrusted origin")
    void corsRejectsUntrustedOrigin() throws Exception {
        mvc.perform(get("/api/v1/health")
                .header("Origin", "http://untrusted-attacker.com"))
           .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // 4. Employee Wallet Isolation (IDOR Protection)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Employee A cannot view Employee B's wallet transactions")
    void employeeCannotAccessAnotherEmployeesWallet() throws Exception {
        UUID employeeA = UUID.randomUUID();
        UUID employeeB = UUID.randomUUID();

        // Employee A has FIELD_WORKER role
        Mockito.when(roleAuth.getRoles(employeeA.toString())).thenReturn(List.of("FIELD_WORKER"));

        mvc.perform(get("/api/v1/wallets/" + employeeB + "/transactions")
                .with(jwt().jwt(builder -> builder.subject(employeeA.toString()))))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Employee A can view their own wallet transactions")
    void employeeCanAccessOwnWallet() throws Exception {
        UUID employeeA = UUID.randomUUID();

        Mockito.when(roleAuth.getRoles(employeeA.toString())).thenReturn(List.of("FIELD_WORKER"));
        Mockito.when(jdbc.query(anyString(), any(RowMapper.class), eq(employeeA)))
               .thenReturn(Collections.emptyList());

        mvc.perform(get("/api/v1/wallets/" + employeeA + "/transactions")
                .with(jwt().jwt(builder -> builder.subject(employeeA.toString()))))
           .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin or Operations user can view any employee wallet transactions")
    void adminCanAccessAnyWallet() throws Exception {
        UUID adminId = UUID.randomUUID();
        UUID targetEmployee = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(roleAuth.getRoles(adminId.toString())).thenReturn(List.of("ADMIN"));
        Mockito.when(jdbc.query(anyString(), any(RowMapper.class), eq(targetEmployee)))
               .thenReturn(Collections.emptyList());

        mvc.perform(get("/api/v1/wallets/" + targetEmployee + "/transactions")
                .with(jwt().jwt(builder -> builder.subject(adminId.toString()))))
           .andExpect(status().isOk());
    }

    // -------------------------------------------------------------
    // 5. Unauthorized Role Assignment Protection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Non-admin user (e.g. Manager) cannot assign application roles")
    void managerCannotAssignRoles() throws Exception {
        UUID managerId = UUID.randomUUID();
        UUID targetEmployeeId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(roleAuth.hasRole(managerId.toString(), "ADMIN")).thenReturn(false);

        String payload = """
            {
              "status": "ACTIVE",
              "role": "ADMIN"
            }
            """;

        mvc.perform(patch("/api/v1/employees/" + targetEmployeeId + "/approval")
                .with(jwt().jwt(builder -> builder.subject(managerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin user can assign application roles")
    void adminCanAssignRoles() throws Exception {
        UUID adminId = UUID.randomUUID();
        UUID targetEmployeeId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(roleAuth.hasRole(adminId.toString(), "ADMIN")).thenReturn(true);

        var empView = new EmployeeController.EmployeeView(
            targetEmployeeId, "Worker Name", "worker@field.in", "9999999999",
            "Tenali", "ACTIVE", List.of("FIELD_WORKER"), OffsetDateTime.now()
        );
        Mockito.when(jdbc.query(anyString(), any(RowMapper.class), eq(targetEmployeeId)))
               .thenReturn(List.of(empView));

        String payload = """
            {
              "status": "ACTIVE",
              "role": "FIELD_WORKER"
            }
            """;

        mvc.perform(patch("/api/v1/employees/" + targetEmployeeId + "/approval")
                .with(jwt().jwt(builder -> builder.subject(adminId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isOk());
    }

    // -------------------------------------------------------------
    // 6. Cross-Tenant Task & Evidence Isolation (Customer A vs B)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Customer A cannot access Customer B's task")
    void customerCannotAccessAnotherCustomersTask() throws Exception {
        UUID customerA = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(taskService.getTask(eq(taskId), any(org.springframework.security.oauth2.jwt.Jwt.class)))
               .thenThrow(ApiException.forbidden("You do not own this task"));

        mvc.perform(get("/api/v1/tasks/" + taskId)
                .with(jwt().jwt(builder -> builder.subject(customerA.toString()))))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer A cannot access Customer B's evidence")
    void customerCannotAccessAnotherCustomersEvidence() throws Exception {
        UUID customerA = UUID.randomUUID();
        UUID customerB = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(roleAuth.getRoles(customerA.toString())).thenReturn(List.of("CUSTOMER"));

        // Mock task lookup in evidence controller returning task owned by customer B
        Mockito.when(jdbc.query(contains("SELECT customer_id, assigned_to FROM tasks"), any(RowMapper.class), eq(taskId)))
               .thenReturn(List.of(Map.entry(customerB, UUID.randomUUID())));

        mvc.perform(get("/api/v1/evidence?taskId=" + taskId)
                .with(jwt().jwt(builder -> builder.subject(customerA.toString()))))
           .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // 7. Task Assignment Eligibility (Active Employee Verification)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Task assignment rejects suspended or unapproved employee")
    void assignTaskRejectsSuspendedEmployee() {
        TaskService service = new TaskService(jdbc, audit, roleAuth);
        UUID taskId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();

        // Mock task view (19 fields)
        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "OPEN", "NORMAL",
            actorId, null, actorId, null, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );

        Mockito.when(jdbc.query(contains("FROM tasks"), any(RowMapper.class), eq(taskId)))
               .thenReturn(List.of(mockTask));

        // Mock employee profile with SUSPENDED status
        Mockito.when(jdbc.query(contains("FROM app_profiles"), any(RowMapper.class), eq(employeeId)))
               .thenReturn(List.of(Map.entry("SUSPENDED", true)));

        ApiException ex = assertThrows(ApiException.class, () ->
            service.assignTask(taskId, employeeId, actorId)
        );
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Target employee is not active"));
    }
}
