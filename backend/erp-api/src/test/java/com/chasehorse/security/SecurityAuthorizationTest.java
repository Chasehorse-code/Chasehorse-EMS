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
import org.springframework.security.oauth2.jwt.Jwt;
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

        Mockito.when(jdbc.query(contains("account_status FROM app_profiles"), any(RowMapper.class), any()))
               .thenReturn(List.of("ACTIVE"));
        Mockito.when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        Mockito.when(jdbc.update(anyString(), any(), any())).thenReturn(1);
        Mockito.when(jdbc.update(anyString(), any(), any(), any())).thenReturn(1);

        var empView = new EmployeeController.EmployeeView(
            targetEmployeeId, "Worker Name", "worker@field.in", "9999999999",
            "Tenali", "ACTIVE", List.of("FIELD_WORKER"), OffsetDateTime.now()
        );
        Mockito.when(jdbc.query(contains("roles_csv"), any(RowMapper.class), any()))
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

    @Test
    @DisplayName("Employee cannot perform self-approval or self-escalation")
    void employeeCannotPerformSelfApproval() throws Exception {
        UUID actorId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);

        String payload = """
            {
              "status": "ACTIVE",
              "role": "ADMIN"
            }
            """;

        mvc.perform(patch("/api/v1/employees/" + actorId + "/approval")
                .with(jwt().jwt(builder -> builder.subject(actorId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Approval rejects nonexistent employee account with 404")
    void approvalRejectsNonexistentEmployee() throws Exception {
        UUID adminId = UUID.randomUUID();
        UUID nonexistentId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(roleAuth.hasRole(adminId.toString(), "ADMIN")).thenReturn(true);
        Mockito.when(jdbc.query(contains("SELECT id, account_status FROM app_profiles"), any(RowMapper.class), eq(nonexistentId)))
               .thenReturn(Collections.emptyList());

        String payload = """
            {
              "status": "ACTIVE"
            }
            """;

        mvc.perform(patch("/api/v1/employees/" + nonexistentId + "/approval")
                .with(jwt().jwt(builder -> builder.subject(adminId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isNotFound());
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
        Mockito.when(taskService.getTask(eq(taskId), any(Jwt.class)))
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

    // -------------------------------------------------------------
    // 8. Task Acceptance and Cancellation
    // -------------------------------------------------------------
    @Test
    @DisplayName("Active field worker can accept an OPEN task")
    void workerCanAcceptOpenTask() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);

        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "ASSIGNED", "NORMAL",
            UUID.randomUUID(), null, UUID.randomUUID(), workerId, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );
        Mockito.when(taskService.acceptTask(eq(taskId), any(Jwt.class)))
               .thenReturn(mockTask);

        mvc.perform(post("/api/v1/tasks/" + taskId + "/accept")
                .with(jwt().jwt(builder -> builder.subject(workerId.toString()))))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("ASSIGNED"));
    }

    @Test
    @DisplayName("Worker cannot accept non-OPEN or already accepted task")
    void workerCannotAcceptNonOpenTask() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(taskService.acceptTask(eq(taskId), any(Jwt.class)))
               .thenThrow(ApiException.badRequest("Task is no longer available in OPEN status for acceptance"));

        mvc.perform(post("/api/v1/tasks/" + taskId + "/accept")
                .with(jwt().jwt(builder -> builder.subject(workerId.toString()))))
           .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Customer can cancel their own OPEN task")
    void customerCanCancelOwnOpenTask() throws Exception {
        UUID customerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);

        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "CANCELLED", "NORMAL",
            customerId, null, customerId, null, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );
        Mockito.when(taskService.cancelTask(eq(taskId), any(Jwt.class)))
               .thenReturn(mockTask);

        mvc.perform(post("/api/v1/tasks/" + taskId + "/cancel")
                .with(jwt().jwt(builder -> builder.subject(customerId.toString()))))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("Customer cannot cancel another customer's task")
    void customerCannotCancelAnotherCustomersTask() throws Exception {
        UUID customerA = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(taskService.cancelTask(eq(taskId), any(Jwt.class)))
               .thenThrow(ApiException.forbidden("You do not own this task"));

        mvc.perform(post("/api/v1/tasks/" + taskId + "/cancel")
                .with(jwt().jwt(builder -> builder.subject(customerA.toString()))))
           .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // 9. Task State Transitions and Ownership Rules
    // -------------------------------------------------------------
    @Test
    @DisplayName("Customer cannot advance task execution status")
    void customerCannotAdvanceTaskStatus() throws Exception {
        UUID customerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(taskService.updateStatus(eq(taskId), eq("IN_PROGRESS"), any(Jwt.class)))
               .thenThrow(ApiException.forbidden("Customers can only cancel tasks they own, not advance execution status"));

        String payload = """
            {
              "status": "IN_PROGRESS"
            }
            """;

        mvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .with(jwt().jwt(builder -> builder.subject(customerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Assigned worker can advance task to IN_PROGRESS")
    void assignedWorkerCanAdvanceTask() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);

        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "IN_PROGRESS", "NORMAL",
            UUID.randomUUID(), null, UUID.randomUUID(), workerId, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );
        Mockito.when(taskService.updateStatus(eq(taskId), eq("IN_PROGRESS"), any(Jwt.class)))
               .thenReturn(mockTask);

        String payload = """
            {
              "status": "IN_PROGRESS"
            }
            """;

        mvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .with(jwt().jwt(builder -> builder.subject(workerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("Worker cannot approve their own task")
    void workerCannotApproveOwnTask() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(taskService.updateStatus(eq(taskId), eq("APPROVED"), any(Jwt.class)))
               .thenThrow(ApiException.forbidden("Field workers cannot transition tasks to APPROVED"));

        String payload = """
            {
              "status": "APPROVED"
            }
            """;

        mvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .with(jwt().jwt(builder -> builder.subject(workerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unassigned worker cannot update task status")
    void unassignedWorkerCannotUpdateTaskStatus() throws Exception {
        UUID unassignedWorkerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.hasAny(any(), any())).thenReturn(true);
        Mockito.when(taskService.updateStatus(eq(taskId), eq("IN_PROGRESS"), any(Jwt.class)))
               .thenThrow(ApiException.forbidden("You are not assigned to this task"));

        String payload = """
            {
              "status": "IN_PROGRESS"
            }
            """;

        mvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .with(jwt().jwt(builder -> builder.subject(unassignedWorkerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
           .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // 10. TaskService State Machine & Concurrency Direct Unit Tests
    // -------------------------------------------------------------
    @Test
    @DisplayName("TaskService rejects invalid state transition (OPEN to SUBMITTED)")
    void taskServiceRejectsInvalidTransition() {
        TaskService service = new TaskService(jdbc, audit, roleAuth);
        UUID taskId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();

        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "OPEN", "NORMAL",
            actorId, null, actorId, null, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );

        Mockito.when(jdbc.query(contains("FROM tasks"), any(RowMapper.class), eq(taskId)))
               .thenReturn(List.of(mockTask));

        Jwt jwt = Mockito.mock(Jwt.class);
        Mockito.when(jwt.getSubject()).thenReturn(actorId.toString());

        ApiException ex = assertThrows(ApiException.class, () ->
            service.updateStatus(taskId, "SUBMITTED", jwt)
        );
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Invalid state transition"));
    }

    @Test
    @DisplayName("TaskService detects concurrent modification on status update")
    void taskServiceDetectsConcurrentStatusUpdate() {
        TaskService service = new TaskService(jdbc, audit, roleAuth);
        UUID taskId = UUID.randomUUID();
        UUID workerId = UUID.randomUUID();

        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "ASSIGNED", "NORMAL",
            UUID.randomUUID(), workerId, UUID.randomUUID(), null, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );

        Mockito.when(jdbc.query(contains("FROM tasks"), any(RowMapper.class), eq(taskId)))
               .thenReturn(List.of(mockTask));
        Mockito.when(roleAuth.getRoles(workerId.toString())).thenReturn(List.of("FIELD_WORKER"));
        // Concurrent modification -> 0 rows updated
        Mockito.when(jdbc.update(contains("UPDATE tasks"), eq("IN_PROGRESS"), eq(taskId), eq("ASSIGNED")))
               .thenReturn(0);

        Jwt jwt = Mockito.mock(Jwt.class);
        Mockito.when(jwt.getSubject()).thenReturn(workerId.toString());

        ApiException ex = assertThrows(ApiException.class, () ->
            service.updateStatus(taskId, "IN_PROGRESS", jwt)
        );
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    @DisplayName("TaskService acceptTask rejects worker if account is not active")
    void acceptTaskRejectsInactiveWorker() {
        TaskService service = new TaskService(jdbc, audit, roleAuth);
        UUID taskId = UUID.randomUUID();
        UUID workerId = UUID.randomUUID();

        var mockTask = new TaskService.TaskView(
            taskId, "Audit Task", "desc", "Shelf audit", "OPEN", "NORMAL",
            UUID.randomUUID(), null, UUID.randomUUID(), null, null, null, "Tenali", "Main Street",
            OffsetDateTime.now().plusDays(1), BigDecimal.TEN, "INR",
            OffsetDateTime.now(), OffsetDateTime.now()
        );

        Mockito.when(jdbc.query(contains("FROM tasks"), any(RowMapper.class), eq(taskId)))
               .thenReturn(List.of(mockTask));
        // Worker profile is SUSPENDED
        Mockito.when(jdbc.query(contains("FROM app_profiles"), any(RowMapper.class), eq(workerId)))
               .thenReturn(List.of(Map.entry("SUSPENDED", true)));

        Jwt jwt = Mockito.mock(Jwt.class);
        Mockito.when(jwt.getSubject()).thenReturn(workerId.toString());

        ApiException ex = assertThrows(ApiException.class, () ->
            service.acceptTask(taskId, jwt)
        );
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("Only active field workers"));
    }

    @Test
    @DisplayName("Employee cannot query another employee's authoritative wallet balance")
    void employeeCannotQueryOtherEmployeeWalletBalance() throws Exception {
        UUID workerA = UUID.randomUUID();
        UUID workerB = UUID.randomUUID();

        Mockito.when(roleAuth.getRoles(workerA.toString())).thenReturn(List.of("FIELD_WORKER"));

        mvc.perform(get("/api/v1/wallets/" + workerB)
               .with(jwt().jwt(j -> j.subject(workerA.toString()))))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unassigned employee cannot submit evidence for another worker's task")
    void unassignedWorkerCannotSubmitEvidence() throws Exception {
        UUID workerA = UUID.randomUUID();
        UUID workerB = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Mockito.when(roleAuth.getRoles(workerA.toString())).thenReturn(List.of("FIELD_WORKER"));
        // Task assigned to workerB
        Mockito.when(jdbc.query(contains("FROM tasks WHERE id = ?"), any(RowMapper.class), eq(taskId)))
               .thenReturn(List.of(Map.of("assignedTo", workerB, "status", "IN_PROGRESS")));

        mvc.perform(post("/api/v1/evidence")
               .with(jwt().jwt(j -> j.subject(workerA.toString())))
               .contentType(MediaType.APPLICATION_JSON)
               .content("""
                   {
                     "taskId": "%s",
                     "storagePath": "evidence/photo.jpg",
                     "fileName": "photo.jpg",
                     "contentType": "image/jpeg"
                   }
                   """.formatted(taskId)))
           .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TMS create shipment computes server price from transport plan")
    void tmsCreateShipmentCalculatesServerPrice() throws Exception {
        UUID customerId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();

        Mockito.when(roleAuth.getRoles(customerId.toString())).thenReturn(List.of("CUSTOMER"));
        Mockito.when(jdbc.query(contains("FROM tms_transport_plans WHERE id = ?"), any(RowMapper.class), eq(planId)))
               .thenReturn(List.of(BigDecimal.valueOf(1850)));

        mvc.perform(post("/api/v1/tms/shipments")
               .with(jwt().jwt(j -> j.subject(customerId.toString())))
               .contentType(MediaType.APPLICATION_JSON)
               .content("""
                   {
                     "originAddress": "123 Warehouse Rd, Tenali",
                     "destinationAddress": "456 Market St, Guntur",
                     "cargoDescription": "Electronics pallet",
                     "cargoWeightKg": 850,
                     "transportPlanId": "%s"
                   }
                   """.formatted(planId)))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("CONFIRMED"))
           .andExpect(jsonPath("$.totalPrice").value(1850));
    }
}
