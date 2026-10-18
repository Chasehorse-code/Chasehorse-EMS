package com.chasehorse.tasks;

import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TaskService {
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public TaskService(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    public record TaskView(
        UUID id, String title, String description, String category, String status,
        String priority, UUID createdBy, UUID assignedTo, UUID customerId,
        UUID checklistTemplateId, BigDecimal locationLat, BigDecimal locationLng,
        String locationArea, String locationAddress, OffsetDateTime dueAt,
        BigDecimal rewardAmount, String currency, OffsetDateTime createdAt, OffsetDateTime updatedAt
    ) {}

    public record CreateTaskCommand(
        String title, String description, String category, String priority,
        UUID checklistTemplateId, String locationArea, String locationAddress,
        OffsetDateTime dueAt, BigDecimal rewardAmount, UUID actorId
    ) {}

    public List<TaskView> listTasks(UUID customerId) {
        String sql = """
            SELECT id, title, description, category, status, priority, created_by,
                   assigned_to, customer_id, checklist_template_id, location_lat,
                   location_lng, location_area, location_address, due_at,
                   reward_amount, currency, created_at, updated_at
            FROM tasks
            """ + (customerId != null ? " WHERE customer_id = ? " : "") +
            " ORDER BY created_at DESC LIMIT 500";

        Object[] params = customerId != null ? new Object[]{customerId} : new Object[]{};
        return jdbc.query(sql, (rs, n) -> mapRow(rs), params);
    }

    public TaskView getTask(UUID id) {
        var results = jdbc.query("""
            SELECT id, title, description, category, status, priority, created_by,
                   assigned_to, customer_id, checklist_template_id, location_lat,
                   location_lng, location_area, location_address, due_at,
                   reward_amount, currency, created_at, updated_at
            FROM tasks WHERE id = ?
            """, (rs, n) -> mapRow(rs), id);

        if (results.isEmpty()) throw ApiException.notFound("Task", id);
        return results.get(0);
    }

    @Transactional
    public TaskView createTask(CreateTaskCommand cmd) {
        BigDecimal reward = cmd.rewardAmount() != null ? cmd.rewardAmount() : BigDecimal.ZERO;
        String category = cmd.category() != null ? cmd.category() : "Shelf audit";
        String priority = cmd.priority() != null ? cmd.priority().toUpperCase() : "NORMAL";

        UUID taskId = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO tasks (id, title, description, category, status, priority, created_by,
                               customer_id, checklist_template_id, location_area, location_address,
                               due_at, reward_amount, currency)
            VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, ?, ?, ?, 'INR')
            """,
            taskId, cmd.title().trim(), cmd.description(), category, priority, cmd.actorId(),
            cmd.actorId(), cmd.checklistTemplateId(), cmd.locationArea(), cmd.locationAddress(),
            cmd.dueAt() != null ? cmd.dueAt() : OffsetDateTime.now().plusDays(1), reward);

        audit.log(cmd.actorId(), "TASK_CREATED", "TASK", taskId,
            Map.of("title", cmd.title(), "reward", reward.toString()));

        return getTask(taskId);
    }

    @Transactional
    public TaskView assignTask(UUID taskId, UUID employeeId, UUID actorId) {
        TaskView task = getTask(taskId);
        if ("APPROVED".equalsIgnoreCase(task.status()) || "CANCELLED".equalsIgnoreCase(task.status())) {
            throw ApiException.badRequest("Cannot assign task in terminal state: " + task.status());
        }

        jdbc.update("""
            UPDATE tasks SET assigned_to = ?, status = 'ASSIGNED', updated_at = now()
            WHERE id = ?
            """, employeeId, taskId);

        jdbc.update("""
            INSERT INTO task_assignments (task_id, employee_id, action)
            VALUES (?, ?, 'OFFERED')
            """, taskId, employeeId);

        audit.log(actorId, "TASK_ASSIGNED", "TASK", taskId,
            Map.of("assigned_to", employeeId.toString()));

        return getTask(taskId);
    }

    @Transactional
    public TaskView updateStatus(UUID taskId, String newStatus, UUID actorId) {
        TaskView task = getTask(taskId);
        jdbc.update("""
            UPDATE tasks SET status = ?, updated_at = now() WHERE id = ?
            """, newStatus.toUpperCase(), taskId);

        audit.log(actorId, "TASK_STATUS_CHANGED", "TASK", taskId,
            Map.of("old_status", task.status(), "new_status", newStatus.toUpperCase()));

        return getTask(taskId);
    }

    private TaskView mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new TaskView(
            rs.getObject("id", UUID.class),
            rs.getString("title"),
            rs.getString("description"),
            rs.getString("category"),
            rs.getString("status"),
            rs.getString("priority"),
            rs.getObject("created_by", UUID.class),
            rs.getObject("assigned_to", UUID.class),
            rs.getObject("customer_id", UUID.class),
            rs.getObject("checklist_template_id", UUID.class),
            rs.getBigDecimal("location_lat"),
            rs.getBigDecimal("location_lng"),
            rs.getString("location_area"),
            rs.getString("location_address"),
            rs.getObject("due_at", OffsetDateTime.class),
            rs.getBigDecimal("reward_amount"),
            rs.getString("currency") != null ? rs.getString("currency").trim() : "INR",
            rs.getObject("created_at", OffsetDateTime.class),
            rs.getObject("updated_at", OffsetDateTime.class)
        );
    }
}
