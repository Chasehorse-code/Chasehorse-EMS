package com.chasehorse.tasks;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {
    private final TaskService taskService;
    private final com.chasehorse.auth.RoleAuthorization roleAuth;

    public TaskController(TaskService taskService, com.chasehorse.auth.RoleAuthorization roleAuth) {
        this.taskService = taskService;
        this.roleAuth = roleAuth;
    }

    public record CreateTaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 5000) String description,
        String category,
        String priority,
        UUID checklistTemplateId,
        String areaKey,
        String address,
        OffsetDateTime dueAt,
        @DecimalMin("0.00") BigDecimal rewardAmount
    ) {}

    public record AssignTaskRequest(
        @NotNull UUID employeeId
    ) {}

    public record UpdateStatusRequest(
        @NotBlank String status
    ) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'EMPLOYEE', 'CUSTOMER', 'FIELD_WORKER')")
    public List<TaskService.TaskView> listTasks(
        @RequestParam(required = false) UUID customerId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        return taskService.listTasksScoped(actorId, roles, customerId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'EMPLOYEE', 'CUSTOMER', 'FIELD_WORKER')")
    public TaskService.TaskView getTask(
        @PathVariable UUID id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        return taskService.getTaskScoped(id, actorId, roles);
    }

    @PostMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'CUSTOMER')")
    public TaskService.TaskView createTask(
        @Valid @RequestBody CreateTaskRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return taskService.createTask(new TaskService.CreateTaskCommand(
            request.title(),
            request.description(),
            request.category(),
            request.priority(),
            request.checklistTemplateId(),
            request.areaKey(),
            request.address(),
            request.dueAt(),
            request.rewardAmount(),
            actorId
        ));
    }

    @PostMapping("/{taskId}/accept")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'EMPLOYEE', 'FIELD_WORKER')")
    public TaskService.TaskView acceptTask(
        @PathVariable UUID taskId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return taskService.acceptTaskAtomically(taskId, actorId);
    }

    @PostMapping("/{taskId}/assignment")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS')")
    public TaskService.TaskView assignTask(
        @PathVariable UUID taskId,
        @Valid @RequestBody AssignTaskRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return taskService.assignTask(taskId, request.employeeId(), actorId);
    }

    @PatchMapping("/{taskId}/status")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'CUSTOMER', 'EMPLOYEE', 'FIELD_WORKER')")
    public TaskService.TaskView updateStatus(
        @PathVariable UUID taskId,
        @Valid @RequestBody UpdateStatusRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        return taskService.updateStatusValidated(taskId, request.status(), actorId, roles);
    }
}