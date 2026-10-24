package com.chasehorse.tasks;

import com.chasehorse.auth.RoleAuthorization;
import com.chasehorse.common.ApiException;
import com.chasehorse.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "SUPABASE_JWT_ISSUER=https://phxybimufcrsnxfepiuz.supabase.co/auth/v1")
class TaskSecurityAndLifecycleTest {

    @Autowired private MockMvc mvc;
    @MockBean private TaskService taskService;
    @MockBean(name = "roleAuthorization") private RoleAuthorization roleAuthorization;
    @MockBean private JwtDecoder jwtDecoder;

    @Test
    void customerCannotAccessAnotherCustomersTask() throws Exception {
        UUID customerAId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(customerAId.toString())).thenReturn(List.of("CUSTOMER"));
        when(taskService.getTaskScoped(eq(taskId), eq(customerAId), anyList()))
            .thenThrow(ApiException.forbidden("You do not have permission to view tasks for another customer"));

        mvc.perform(get("/api/v1/tasks/" + taskId)
                .with(jwt().jwt(j -> j.subject(customerAId.toString()))))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.message").value("You do not have permission to view tasks for another customer"));
    }

    @Test
    void atomicClaimingConflictReturns409() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(taskService.acceptTaskAtomically(taskId, workerId))
            .thenThrow(new ApiException(HttpStatus.CONFLICT, "Task cannot be accepted; current status is IN_PROGRESS and already assigned to another user"));

        mvc.perform(post("/api/v1/tasks/" + taskId + "/accept")
                .with(jwt().jwt(j -> j.subject(workerId.toString()))))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.message").value("Task cannot be accepted; current status is IN_PROGRESS and already assigned to another user"));
    }

    @Test
    void invalidTaskStatusRejectedWith400() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(workerId.toString())).thenReturn(List.of("FIELD_WORKER"));
        when(taskService.updateStatusValidated(eq(taskId), eq("INVALID_STATE"), eq(workerId), anyList()))
            .thenThrow(ApiException.badRequest("Invalid task status: INVALID_STATE"));

        mvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .with(jwt().jwt(j -> j.subject(workerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INVALID_STATE\"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("Invalid task status: INVALID_STATE"));
    }

    @Test
    void workerCannotApproveTask() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        when(roleAuthorization.getRoles(workerId.toString())).thenReturn(List.of("FIELD_WORKER"));
        when(taskService.updateStatusValidated(eq(taskId), eq("APPROVED"), eq(workerId), anyList()))
            .thenThrow(ApiException.forbidden("Only managers or administrators may approve tasks"));

        mvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .with(jwt().jwt(j -> j.subject(workerId.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"APPROVED\"}"))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.message").value("Only managers or administrators may approve tasks"));
    }

    @Test
    void workerCanAcceptOpenTaskSuccessfully() throws Exception {
        UUID workerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        when(roleAuthorization.hasAny(any(), any())).thenReturn(true);
        TaskService.TaskView view = new TaskService.TaskView(
            taskId, "Shelf Audit", "Count inventory", "Shelf audit", "IN_PROGRESS", "NORMAL",
            UUID.randomUUID(), workerId, UUID.randomUUID(), null, null, null, "Zone 1", "Store 42",
            OffsetDateTime.now().plusDays(1), BigDecimal.valueOf(150.00), "INR", OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(taskService.acceptTaskAtomically(taskId, workerId)).thenReturn(view);

        mvc.perform(post("/api/v1/tasks/" + taskId + "/accept")
                .with(jwt().jwt(j -> j.subject(workerId.toString()))))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.id").value(taskId.toString()))
           .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
           .andExpect(jsonPath("$.assignedTo").value(workerId.toString()));
    }
}
