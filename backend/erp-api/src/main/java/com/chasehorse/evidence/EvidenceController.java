package com.chasehorse.evidence;

import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@RequestMapping("/api/v1/evidence")
public class EvidenceController {
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    private final com.chasehorse.auth.RoleAuthorization roleAuth;

    public EvidenceController(JdbcTemplate jdbc, AuditService audit, com.chasehorse.auth.RoleAuthorization roleAuth) {
        this.jdbc = jdbc;
        this.audit = audit;
        this.roleAuth = roleAuth;
    }

    public record EvidencePhotoView(
        UUID id, String storagePath, String fileName, String caption,
        BigDecimal locationLat, BigDecimal locationLng, OffsetDateTime capturedAt
    ) {}

    public record AiVerificationView(
        String status, BigDecimal confidence, String summary
    ) {}

    public record ManagerDecisionView(
        String status, String decidedBy, OffsetDateTime decidedAt, String note
    ) {}

    public record EvidenceView(
        UUID id, UUID taskId, UUID submittedBy, OffsetDateTime submittedAt,
        List<EvidencePhotoView> photos, AiVerificationView ai, ManagerDecisionView managerDecision
    ) {}

    public record SubmitEvidenceRequest(
        @NotNull UUID taskId,
        @NotBlank String storagePath,
        String fileName,
        @NotBlank String contentType,
        Long fileSizeBytes,
        String caption,
        BigDecimal locationLat,
        BigDecimal locationLng
    ) {}

    public record ManagerDecisionRequest(
        @NotBlank String status,
        String note,
        String decidedBy
    ) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'CUSTOMER', 'FIELD_WORKER')")
    public List<EvidenceView> listEvidence(
        @RequestParam(required = false) UUID taskId,
        @RequestParam(required = false) UUID customerId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isAdminOrOps = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        StringBuilder sql = new StringBuilder("""
            SELECT e.id, e.task_id, e.submitted_by, e.created_at, e.verification_status, e.verification_notes
            FROM task_evidence e
            JOIN tasks t ON e.task_id = t.id
            WHERE 1=1
            """);
        List<Object> params = new java.util.ArrayList<>();

        if (!isAdminOrOps) {
            if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"))) {
                sql.append(" AND t.customer_id = ? ");
                params.add(actorId);
            } else if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("FIELD_WORKER") || r.equalsIgnoreCase("EMPLOYEE"))) {
                sql.append(" AND (t.assigned_to = ? OR e.submitted_by = ?) ");
                params.add(actorId);
                params.add(actorId);
            }
        }

        if (taskId != null) {
            sql.append(" AND e.task_id = ? ");
            params.add(taskId);
        }

        sql.append(" ORDER BY e.created_at DESC LIMIT 200");

        return jdbc.query(sql.toString(), (rs, n) -> {
            UUID id = rs.getObject("id", UUID.class);
            UUID tId = rs.getObject("task_id", UUID.class);
            UUID subBy = rs.getObject("submitted_by", UUID.class);
            OffsetDateTime created = rs.getObject("created_at", OffsetDateTime.class);
            String vStatus = rs.getString("verification_status");
            String vNotes = rs.getString("verification_notes");

            var photos = jdbc.query("""
                SELECT id, storage_path, file_name, caption, location_lat, location_lng, captured_at
                FROM task_evidence WHERE id = ?
                """, (prs, pn) -> new EvidencePhotoView(
                    prs.getObject("id", UUID.class),
                    prs.getString("storage_path"),
                    prs.getString("file_name"),
                    prs.getString("caption"),
                    prs.getBigDecimal("location_lat"),
                    prs.getBigDecimal("location_lng"),
                    prs.getObject("captured_at", OffsetDateTime.class)
                ), id
            );

            // Fetch genuine AI verification results from database
            var aiRows = jdbc.query("""
                SELECT status, confidence, summary
                FROM ai_verifications WHERE evidence_id = ?
                ORDER BY created_at DESC LIMIT 1
                """, (ars, an) -> new AiVerificationView(
                    ars.getString("status"),
                    ars.getBigDecimal("confidence"),
                    ars.getString("summary")
                ), id
            );
            AiVerificationView ai = !aiRows.isEmpty()
                ? aiRows.get(0)
                : new AiVerificationView("NOT_RUN", null, "No AI verification record found");

            ManagerDecisionView manager = new ManagerDecisionView(
                vStatus != null ? vStatus : "PENDING",
                "Operations Reviewer",
                created,
                vNotes
            );

            return new EvidenceView(id, tId, subBy, created, photos, ai, manager);
        }, params.toArray());
    }

    @PostMapping
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'FIELD_WORKER')")
    public EvidenceView submitEvidence(
        @Valid @RequestBody SubmitEvidenceRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        UUID id = UUID.randomUUID();

        jdbc.update("""
            INSERT INTO task_evidence (id, task_id, submitted_by, storage_path, file_name,
                                      content_type, file_size_bytes, caption, location_lat,
                                      location_lng, captured_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
            """, id, request.taskId(), actorId, request.storagePath(), request.fileName(),
            request.contentType(), request.fileSizeBytes(), request.caption(),
            request.locationLat(), request.locationLng());

        audit.log(actorId, "EVIDENCE_SUBMITTED", "TASK_EVIDENCE", id,
            Map.of("taskId", request.taskId().toString()));

        return listEvidence(request.taskId(), null).get(0);
    }

    @PostMapping("/{id}/manager-decision")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER')")
    public Map<String, Object> decideEvidence(
        @PathVariable UUID id,
        @Valid @RequestBody ManagerDecisionRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        int rows = jdbc.update("""
            UPDATE task_evidence SET verification_status = ?, verification_notes = ?
            WHERE id = ?
            """, request.status().toUpperCase(), request.note(), id);

        if (rows == 0) throw ApiException.notFound("Evidence", id);

        audit.log(actorId, "EVIDENCE_DECIDED", "TASK_EVIDENCE", id,
            Map.of("decision", request.status(), "note", request.note() != null ? request.note() : ""));

        return Map.of("id", id, "status", request.status(), "updated", true);
    }
}
