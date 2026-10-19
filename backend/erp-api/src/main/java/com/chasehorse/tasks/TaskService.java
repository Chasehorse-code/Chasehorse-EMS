package com.chasehorse.tasks;

import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chasehorse.auth.RoleAuthorization;
import org.springframework.security.oauth2.jwt.Jwt;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class TaskService {
    private final JdbcTemplate jdbc;
    private final AuditService audit;
    private final RoleAuthorization roleAuth;

    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
        "OPEN", Set.of("ASSIGNED", "CANCELLED"),
        "ASSIGNED", Set.of("IN_PROGRESS", "OPEN", "CANCELLED"),
        "IN_PROGRESS", Set.of("SUBMITTED", "ASSIGNED", "CANCELLED"),
        "SUBMITTED", Set.of("IN_REVIEW", "APPROVED", "REJECTED"),
        "IN_REVIEW", Set.of("APPROVED", "REJECTED"),
        "REJECTED", Set.of("OPEN", "ASSIGNED"),
        "APPROVED", Set.of(),
        "CANCELLED", Set.of()
    );

    public TaskService(JdbcTemplate jdbc, AuditService audit, RoleAuthorization roleAuth) {
        this.jdbc = jdbc;
        this.audit = audit;
        this.roleAuth = roleAuth;
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
        OffsetDateTime dueAt, BigDecimal rewardAmount, UUID actorId, UUID targetCustomerId
    ) {
        public CreateTaskCommand(
            String title, String description, String category, String priority,
            UUID checklistTemplateId, String locationArea, String locationAddress,
            OffsetDateTime dueAt, BigDecimal rewardAmount, UUID actorId
        ) {
            this(title, description, category, priority, checklistTemplateId,
                 locationArea, locationAddress, dueAt, rewardAmount, actorId, null);
        }
    }

    public List<TaskView> listTasks(UUID customerId) {
        return listTasks(customerId, null);
    }

    public List<TaskView> listTasks(UUID requestedCustomerId, Jwt jwt) {
        StringBuilder sql = new StringBuilder("""
            SELECT id, title, description, category, status, priority, created_by,
                   assigned_to, customer_id, checklist_template_id, location_lat,
                   location_lng, location_area, location_address, due_at,
                   reward_amount, currency, created_at, updated_at
            FROM tasks
            WHERE 1=1
            """);
        List<Object> params = new java.util.ArrayList<>();

        if (jwt != null) {
            UUID actorId = UUID.fromString(jwt.getSubject());
            List<String> roles = roleAuth.getRoles(jwt.getSubject());
            boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
                r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

            if (!isOpsOrAdmin) {
                if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                    // Customer can strictly view only their own tasks
                    sql.append(" AND customer_id = ? ");
                    params.add(actorId);
                } else if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                    // Worker can strictly view assigned tasks or open available tasks
                    sql.append(" AND (assigned_to = ? OR status = 'OPEN') ");
                    params.add(actorId);
                } else {
                    return List.of();
                }
            } else if (requestedCustomerId != null) {
                sql.append(" AND customer_id = ? ");
                params.add(requestedCustomerId);
            }
        } else if (requestedCustomerId != null) {
            sql.append(" AND customer_id = ? ");
            params.add(requestedCustomerId);
        }

        sql.append(" ORDER BY created_at DESC LIMIT 500");
        return jdbc.query(sql.toString(), (rs, n) -> mapRow(rs), params.toArray());
    }

    public TaskView getTask(UUID id) {
        return getTask(id, null);
    }

    public TaskView getTask(UUID id, Jwt jwt) {
        var results = jdbc.query("""
            SELECT id, title, description, category, status, priority, created_by,
                   assigned_to, customer_id, checklist_template_id, location_lat,
                   location_lng, location_area, location_address, due_at,
                   reward_amount, currency, created_at, updated_at
            FROM tasks WHERE id = ?
            """, (rs, n) -> mapRow(rs), id);

        if (results.isEmpty()) throw ApiException.notFound("Task", id);
        TaskView task = results.get(0);

        if (jwt != null) {
            UUID actorId = UUID.fromString(jwt.getSubject());
            List<String> roles = roleAuth.getRoles(jwt.getSubject());
            boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
                r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

            if (!isOpsOrAdmin) {
                if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                    if (!actorId.equals(task.customerId())) {
                        throw ApiException.forbidden("You do not own this task");
                    }
                } else if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                    if (!actorId.equals(task.assignedTo()) && !"OPEN".equalsIgnoreCase(task.status())) {
                        throw ApiException.forbidden("You are not assigned to this task");
                    }
                }
            }
        }

        return task;
    }

    @Transactional
    public TaskView createTask(CreateTaskCommand cmd, Jwt jwt) {
        BigDecimal reward = cmd.rewardAmount() != null ? cmd.rewardAmount() : BigDecimal.ZERO;
        String category = cmd.category() != null ? cmd.category() : "Shelf audit";
        String priority = cmd.priority() != null ? cmd.priority().toUpperCase() : "NORMAL";

        UUID customerId = cmd.actorId();
        if (jwt != null) {
            List<String> roles = roleAuth.getRoles(jwt.getSubject());
            boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
                r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));
            if (isOpsOrAdmin && cmd.targetCustomerId() != null) {
                // Verify target customer exists
                var custCheck = jdbc.query("SELECT id FROM app_profiles WHERE id = ?",
                    (rs, n) -> rs.getObject("id", UUID.class), cmd.targetCustomerId());
                if (!custCheck.isEmpty()) {
                    customerId = cmd.targetCustomerId();
                }
            }
        }

        UUID taskId = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO tasks (id, title, description, category, status, priority, created_by,
                               customer_id, checklist_template_id, location_area, location_address,
                               due_at, reward_amount, currency)
            VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, ?, ?, ?, 'INR')
            """,
            taskId, cmd.title().trim(), cmd.description(), category, priority, cmd.actorId(),
            customerId, cmd.checklistTemplateId(), cmd.locationArea(), cmd.locationAddress(),
            cmd.dueAt() != null ? cmd.dueAt() : OffsetDateTime.now().plusDays(1), reward);

        audit.log(cmd.actorId(), "TASK_CREATED", "TASK", taskId,
            Map.of("title", cmd.title(), "reward", reward.toString()));

        return getTask(taskId);
    }

    @Transactional
    public TaskView createTask(CreateTaskCommand cmd) {
        return createTask(cmd, null);
    }

    @Transactional
    public TaskView assignTask(UUID taskId, UUID employeeId, UUID actorId) {
        TaskView task = getTask(taskId);
        if ("APPROVED".equalsIgnoreCase(task.status()) || "CANCELLED".equalsIgnoreCase(task.status())) {
            throw ApiException.badRequest("Cannot assign task in terminal state: " + task.status());
        }

        // Validate target employee eligibility: must exist, be ACTIVE, and have employee role
        var employeeProfiles = jdbc.query("""
            SELECT p.id, p.account_status,
                   EXISTS(
                       SELECT 1 FROM app_role_assignments r
                       WHERE r.user_id = p.id
                         AND r.role IN ('EMPLOYEE', 'FIELD_WORKER', 'DRIVER', 'WAREHOUSE_STAFF')
                   ) as is_worker
            FROM app_profiles p
            WHERE p.id = ?
            """,
            (rs, n) -> Map.entry(
                rs.getString("account_status"),
                rs.getBoolean("is_worker")
            ),
            employeeId
        );

        if (employeeProfiles.isEmpty()) {
            throw ApiException.badRequest("Target employee not found");
        }
        var emp = employeeProfiles.get(0);
        if (!"ACTIVE".equalsIgnoreCase(emp.getKey())) {
            throw ApiException.badRequest("Target employee is not active (status: " + emp.getKey() + ")");
        }
        if (!emp.getValue()) {
            throw ApiException.badRequest("Target user does not have an eligible employee/field worker role");
        }

        int rows = jdbc.update("""
            UPDATE tasks SET assigned_to = ?, status = 'ASSIGNED', updated_at = now()
            WHERE id = ? AND status IN ('OPEN', 'ASSIGNED', 'REJECTED')
            """, employeeId, taskId);

        if (rows == 0) {
            throw ApiException.badRequest("Cannot assign task in terminal or invalid state: " + task.status());
        }

        jdbc.update("""
            INSERT INTO task_assignments (task_id, employee_id, action)
            VALUES (?, ?, 'OFFERED')
            """, taskId, employeeId);

        audit.log(actorId, "TASK_ASSIGNED", "TASK", taskId,
            Map.of("assigned_to", employeeId.toString()));

        return getTask(taskId);
    }

    @Transactional
    public TaskView acceptTask(UUID taskId, Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        TaskView task = getTask(taskId, jwt);

        if (!"OPEN".equalsIgnoreCase(task.status())) {
            throw ApiException.badRequest("Task is no longer available in OPEN status for acceptance (current status: " + task.status() + ")");
        }

        // Validate that caller is an active field worker
        var workerProfile = jdbc.query("""
            SELECT p.account_status,
                   EXISTS(
                       SELECT 1 FROM app_role_assignments r
                       WHERE r.user_id = p.id
                         AND r.role IN ('EMPLOYEE', 'FIELD_WORKER', 'DRIVER', 'WAREHOUSE_STAFF')
                   ) as is_worker
            FROM app_profiles p
            WHERE p.id = ?
            """,
            (rs, n) -> Map.entry(rs.getString("account_status"), rs.getBoolean("is_worker")),
            actorId
        );

        if (workerProfile.isEmpty() || !"ACTIVE".equalsIgnoreCase(workerProfile.get(0).getKey()) || !workerProfile.get(0).getValue()) {
            throw ApiException.forbidden("Only active field workers can accept field tasks");
        }

        // Atomically update task to ASSIGNED with assigned_to = actorId
        int rows = jdbc.update("""
            UPDATE tasks
            SET assigned_to = ?, status = 'ASSIGNED', updated_at = now()
            WHERE id = ? AND status = 'OPEN'
            """,
            actorId, taskId
        );

        if (rows == 0) {
            throw ApiException.conflict("Task was accepted or assigned concurrently");
        }

        jdbc.update("""
            INSERT INTO task_assignments (task_id, employee_id, action)
            VALUES (?, ?, 'ACCEPTED')
            """, taskId, actorId);

        audit.log(actorId, "TASK_ACCEPTED", "TASK", taskId, Map.of("assigned_to", actorId.toString()));
        return getTask(taskId, jwt);
    }

    @Transactional
    public TaskView cancelTask(UUID taskId, Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        TaskView task = getTask(taskId, jwt);

        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        if (!isOpsOrAdmin) {
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                if (!actorId.equals(task.customerId())) {
                    throw ApiException.forbidden("You do not own this task");
                }
                if (!"OPEN".equalsIgnoreCase(task.status()) && !"ASSIGNED".equalsIgnoreCase(task.status())) {
                    throw ApiException.badRequest("Cannot cancel task once execution or review is in progress (current status: " + task.status() + ")");
                }
            } else {
                throw ApiException.forbidden("You do not have permission to cancel this task");
            }
        }

        int rows = jdbc.update("""
            UPDATE tasks
            SET status = 'CANCELLED', updated_at = now()
            WHERE id = ? AND status NOT IN ('APPROVED', 'CANCELLED')
            """,
            taskId
        );

        if (rows == 0) {
            throw ApiException.badRequest("Task cannot be cancelled in its current state: " + task.status());
        }

        audit.log(actorId, "TASK_CANCELLED", "TASK", taskId, Map.of("previous_status", task.status()));
        return getTask(taskId, jwt);
    }

    @Transactional
    public TaskView updateStatus(UUID taskId, String newStatusStr, Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        TaskView task = getTask(taskId, jwt);

        String currentStatus = task.status().toUpperCase();
        String targetStatus = newStatusStr.trim().toUpperCase();

        Set<String> validNext = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!validNext.contains(targetStatus)) {
            throw ApiException.badRequest("Invalid state transition: cannot move task from " + currentStatus + " to " + targetStatus);
        }

        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        if (!isOpsOrAdmin) {
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                if (!actorId.equals(task.customerId())) {
                    throw ApiException.forbidden("You do not own this task");
                }
                if (!"CANCELLED".equalsIgnoreCase(targetStatus)) {
                    throw ApiException.forbidden("Customers can only cancel tasks they own, not advance execution status");
                }
            } else if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                if (!actorId.equals(task.assignedTo())) {
                    throw ApiException.forbidden("You are not assigned to this task");
                }
                // Worker can only advance to IN_PROGRESS or SUBMITTED
                if (!"IN_PROGRESS".equalsIgnoreCase(targetStatus) && !"SUBMITTED".equalsIgnoreCase(targetStatus)) {
                    throw ApiException.forbidden("Field workers cannot transition tasks to " + targetStatus);
                }
            } else {
                throw ApiException.forbidden("You do not have permission to update task status");
            }
        }

        // Race-condition safe atomic update
        int rows = jdbc.update("""
            UPDATE tasks
            SET status = ?, updated_at = now()
            WHERE id = ? AND status = ?
            """,
            targetStatus, taskId, currentStatus
        );

        if (rows == 0) {
            throw ApiException.conflict("Task status was modified concurrently or is no longer in " + currentStatus + " state");
        }

        audit.log(actorId, "TASK_STATUS_CHANGED", "TASK", taskId,
            Map.of("old_status", currentStatus, "new_status", targetStatus));

        return getTask(taskId, jwt);
    }

    @Transactional
    public TaskView updateStatus(UUID taskId, String newStatus, UUID actorId) {
        // Fallback overload for internal tests
        TaskView task = getTask(taskId);
        String currentStatus = task.status().toUpperCase();
        String targetStatus = newStatus.trim().toUpperCase();

        int rows = jdbc.update("""
            UPDATE tasks SET status = ?, updated_at = now() WHERE id = ? AND status = ?
            """, targetStatus, taskId, currentStatus);

        if (rows == 0) {
            throw ApiException.conflict("Task status modified concurrently");
        }

        audit.log(actorId, "TASK_STATUS_CHANGED", "TASK", taskId,
            Map.of("old_status", currentStatus, "new_status", targetStatus));

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
