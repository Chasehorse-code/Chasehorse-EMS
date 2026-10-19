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
        return listTasksScoped(null, List.of("ADMIN"), customerId);
    }

    public List<TaskView> listTasksScoped(UUID actorId, List<String> roles, UUID requestedCustomerId) {
        boolean isAdminOrOps = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        String baseSql = """
            SELECT id, title, description, category, status, priority, created_by,
                   assigned_to, customer_id, checklist_template_id, location_lat,
                   location_lng, location_area, location_address, due_at,
                   reward_amount, currency, created_at, updated_at
            FROM tasks
            """;

        if (!isAdminOrOps) {
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                // Customer can ONLY see their own tasks
                String sql = baseSql + " WHERE customer_id = ? ORDER BY created_at DESC LIMIT 500";
                return jdbc.query(sql, (rs, n) -> mapRow(rs), actorId);
            }
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                // Workers can see OPEN tasks or tasks assigned to them
                String sql = baseSql + " WHERE status = 'OPEN' OR assigned_to = ? ORDER BY created_at DESC LIMIT 500";
                return jdbc.query(sql, (rs, n) -> mapRow(rs), actorId);
            }
        }

        // Admin, Manager, Operations
        if (requestedCustomerId != null) {
            String sql = baseSql + " WHERE customer_id = ? ORDER BY created_at DESC LIMIT 500";
            return jdbc.query(sql, (rs, n) -> mapRow(rs), requestedCustomerId);
        }

        String sql = baseSql + " ORDER BY created_at DESC LIMIT 500";
        return jdbc.query(sql, (rs, n) -> mapRow(rs));
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

    public TaskView getTaskScoped(UUID id, UUID actorId, List<String> roles) {
        TaskView task = getTask(id);
        boolean isAdminOrOps = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        if (!isAdminOrOps) {
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                if (task.customerId() == null || !task.customerId().equals(actorId)) {
                    throw ApiException.forbidden("You do not have permission to view tasks for another customer");
                }
            } else if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                boolean isOpen = "OPEN".equalsIgnoreCase(task.status());
                boolean isAssignedToMe = task.assignedTo() != null && task.assignedTo().equals(actorId);
                if (!isOpen && !isAssignedToMe) {
                    throw ApiException.forbidden("You do not have permission to view this task");
                }
            }
        }
        return task;
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
        if ("APPROVED".equalsIgnoreCase(task.status()) || "CANCELLED".equalsIgnoreCase(task.status()) || "REJECTED".equalsIgnoreCase(task.status())) {
            throw ApiException.badRequest("Cannot assign task in terminal state: " + task.status());
        }

        jdbc.update("""
            UPDATE tasks SET assigned_to = ?, status = 'ASSIGNED', updated_at = now()
            WHERE id = ?
            """, employeeId, taskId);

        jdbc.update("""
            INSERT INTO task_assignments (id, task_id, employee_id, action)
            VALUES (?, ?, ?, 'OFFERED')
            """, UUID.randomUUID(), taskId, employeeId);

        audit.log(actorId, "TASK_ASSIGNED", "TASK", taskId,
            Map.of("assigned_to", employeeId.toString()));

        return getTask(taskId);
    }

    /**
     * Atomically claims an open task for an employee.
     * Prevents race conditions and double-claims using conditional UPDATE.
     */
    @Transactional
    public TaskView acceptTaskAtomically(UUID taskId, UUID employeeId) {
        int rows = jdbc.update("""
            UPDATE tasks
            SET status = 'IN_PROGRESS', assigned_to = ?, updated_at = now()
            WHERE id = ? AND (status = 'OPEN' OR (status = 'ASSIGNED' AND assigned_to = ?))
            """, employeeId, taskId, employeeId);

        if (rows == 0) {
            TaskView existing = getTask(taskId);
            throw new ApiException(org.springframework.http.HttpStatus.CONFLICT,
                "Task cannot be accepted; current status is " + existing.status() +
                (existing.assignedTo() != null ? " and already assigned to another user" : ""));
        }

        jdbc.update("""
            INSERT INTO task_assignments (id, task_id, employee_id, action)
            VALUES (?, ?, ?, 'ACCEPTED')
            """, UUID.randomUUID(), taskId, employeeId);

        audit.log(employeeId, "TASK_ACCEPTED", "TASK", taskId,
            Map.of("assigned_to", employeeId.toString(), "status", "IN_PROGRESS"));

        return getTask(taskId);
    }

    /**
     * Strict state machine for task status transitions.
     */
    @Transactional
    public TaskView updateStatus(UUID taskId, String newStatus, UUID actorId) {
        return updateStatusValidated(taskId, newStatus, actorId, List.of("ADMIN"));
    }

    @Transactional
    public TaskView updateStatusValidated(UUID taskId, String requestedStatus, UUID actorId, List<String> roles) {
        String nextStatus = requestedStatus.toUpperCase().trim();
        var validStatuses = List.of("OPEN", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "CANCELLED");
        if (!validStatuses.contains(nextStatus)) {
            throw ApiException.badRequest("Invalid task status: " + requestedStatus);
        }

        TaskView task = getTask(taskId);
        String currentStatus = task.status().toUpperCase();

        if (currentStatus.equals(nextStatus)) {
            return task;
        }

        // Terminal states cannot be changed
        if (List.of("APPROVED", "REJECTED", "CANCELLED").contains(currentStatus)) {
            throw ApiException.badRequest("Cannot transition task from terminal state: " + currentStatus);
        }

        boolean isAdminOrOps = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        if (!isAdminOrOps) {
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                if (task.customerId() == null || !task.customerId().equals(actorId)) {
                    throw ApiException.forbidden("You do not own this task");
                }
                // Customer may only cancel open tasks
                if ("CANCELLED".equals(nextStatus) && "OPEN".equals(currentStatus)) {
                    // Allowed
                } else {
                    throw ApiException.forbidden("Customers can only cancel OPEN tasks");
                }
            } else if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                if (task.assignedTo() == null || !task.assignedTo().equals(actorId)) {
                    throw ApiException.forbidden("You are not assigned to this task");
                }
                // Worker can only transition:
                // ASSIGNED -> IN_PROGRESS
                // IN_PROGRESS -> SUBMITTED
                boolean validWorkerTransition =
                    ("ASSIGNED".equals(currentStatus) && "IN_PROGRESS".equals(nextStatus)) ||
                    ("IN_PROGRESS".equals(currentStatus) && "SUBMITTED".equals(nextStatus));
                if (!validWorkerTransition) {
                    throw ApiException.forbidden("Workers cannot transition task from " + currentStatus + " to " + nextStatus);
                }
            }
        }

        jdbc.update("""
            UPDATE tasks SET status = ?, updated_at = now() WHERE id = ?
            """, nextStatus, taskId);

        audit.log(actorId, "TASK_STATUS_CHANGED", "TASK", taskId,
            Map.of("old_status", currentStatus, "new_status", nextStatus));

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
