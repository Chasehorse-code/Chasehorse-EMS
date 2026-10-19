package com.chasehorse.approvals;

import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals")
public class ApprovalController {
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public ApprovalController(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    public record ApprovalView(
        UUID id, UUID taskId, UUID evidenceId, UUID employeeId,
        BigDecimal rewardInr, String stage, OffsetDateTime submittedAt,
        OffsetDateTime decidedAt, String decidedBy, String note
    ) {}

    public record ApprovalDecisionRequest(
        @NotBlank String stage,
        String note,
        String decidedBy
    ) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'MANAGER')")
    public List<ApprovalView> listApprovals() {
        return jdbc.query("""
            SELECT a.id, a.task_id, a.evidence_id, t.assigned_to AS employee_id,
                   t.reward_amount, a.decision AS stage, a.created_at, a.reason
            FROM task_approvals a
            JOIN tasks t ON a.task_id = t.id
            ORDER BY a.created_at DESC LIMIT 200
            """,
            (rs, n) -> new ApprovalView(
                rs.getObject("id", UUID.class),
                rs.getObject("task_id", UUID.class),
                rs.getObject("evidence_id", UUID.class),
                rs.getObject("employee_id", UUID.class),
                rs.getBigDecimal("reward_amount"),
                rs.getString("stage"),
                rs.getObject("created_at", OffsetDateTime.class),
                null,
                null,
                rs.getString("reason")
            )
        );
    }

    @PostMapping("/{id}/decision")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS')")
    public Map<String, Object> decideApproval(
        @PathVariable UUID id,
        @Valid @RequestBody ApprovalDecisionRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        boolean isApproved = "APPROVED".equalsIgnoreCase(request.stage());

        var approvalRows = jdbc.query("""
            SELECT a.task_id, t.assigned_to, t.reward_amount
            FROM task_approvals a
            JOIN tasks t ON a.task_id = t.id
            WHERE a.id = ?
            """, (rs, n) -> Map.of(
                "taskId", rs.getObject("task_id", UUID.class),
                "employeeId", rs.getObject("assigned_to", UUID.class) != null ? rs.getObject("assigned_to", UUID.class) : actorId,
                "rewardAmount", rs.getBigDecimal("reward_amount")
            ), id);

        if (approvalRows.isEmpty()) {
            throw ApiException.notFound("Approval", id);
        }

        var appData = approvalRows.get(0);
        UUID taskId = (UUID) appData.get("taskId");
        UUID employeeId = (UUID) appData.get("employeeId");
        BigDecimal reward = (BigDecimal) appData.get("rewardAmount");

        // Update approval state
        jdbc.update("""
            UPDATE task_approvals SET decision = ?, reason = ? WHERE id = ?
            """, request.stage().toUpperCase(), request.note(), id);

        // Update task status
        jdbc.update("""
            UPDATE tasks SET status = ?, updated_at = now() WHERE id = ?
            """, isApproved ? "APPROVED" : "REJECTED", taskId);

        // If approved and positive reward, credit the employee's wallet idempotently
        if (isApproved && reward != null && reward.compareTo(BigDecimal.ZERO) > 0) {
            String idempotencyKey = "task-reward-" + taskId;
            jdbc.update("""
                INSERT INTO wallet_ledger (id, user_id, task_id, idempotency_key, entry_type, amount, currency, description, created_by)
                VALUES (?, ?, ?, ?, 'TASK_REWARD', ?, 'INR', 'Reward for completing task', ?)
                ON CONFLICT (idempotency_key) DO NOTHING
                """, UUID.randomUUID(), employeeId, taskId, idempotencyKey, reward, actorId);

            audit.log(actorId, "WALLET_CREDITED", "WALLET_LEDGER", employeeId,
                Map.of("taskId", taskId.toString(), "amount", reward.toString()));
        }

        audit.log(actorId, "APPROVAL_DECIDED", "TASK_APPROVAL", id,
            Map.of("decision", request.stage(), "taskId", taskId.toString()));

        return Map.of("id", id, "stage", request.stage(), "status", "SUCCESS");
    }
}
