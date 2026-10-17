package com.chasehorse.tasks;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {
    private final JdbcTemplate jdbc;

    public TaskController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record TaskView(
        UUID id, String title, String description, String status, UUID createdBy,
        UUID assignedTo, BigDecimal rewardAmount, String currency,
        OffsetDateTime createdAt, OffsetDateTime updatedAt
    ) {}

    public record CreateTaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 5000) String description,
        @DecimalMin("0.00") BigDecimal rewardAmount
    ) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS')")
    public List<TaskView> listTasks() {
        return jdbc.query("""
            select id, title, description, status, created_by, assigned_to,
                   reward_amount, currency, created_at, updated_at
            from tasks order by created_at desc limit 500
            """,
            (rs, rowNum) -> new TaskView(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("status"),
                rs.getObject("created_by", UUID.class),
                rs.getObject("assigned_to", UUID.class),
                rs.getBigDecimal("reward_amount"),
                rs.getString("currency").trim(),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class)
            )
        );
    }

    @PostMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'CUSTOMER')")
    public TaskView createTask(@Valid @RequestBody CreateTaskRequest request,
                               @AuthenticationPrincipal Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        BigDecimal reward = request.rewardAmount() == null ? BigDecimal.ZERO : request.rewardAmount();
        return jdbc.queryForObject("""
            insert into tasks (title, description, status, created_by, reward_amount, currency)
            values (?, ?, 'OPEN', ?, ?, 'INR')
            returning id, title, description, status, created_by, assigned_to,
                      reward_amount, currency, created_at, updated_at
            """,
            (rs, rowNum) -> new TaskView(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("status"),
                rs.getObject("created_by", UUID.class),
                rs.getObject("assigned_to", UUID.class),
                rs.getBigDecimal("reward_amount"),
                rs.getString("currency").trim(),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class)
            ),
            request.title().trim(),
            request.description(),
            actorId,
            reward
        );
    }
}