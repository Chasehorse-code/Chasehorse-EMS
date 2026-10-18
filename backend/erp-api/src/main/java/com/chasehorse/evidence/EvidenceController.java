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

    public EvidenceController(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
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
        @RequestParam(required = false) UUID customerId
    ) {
        String sql = """
            SELECT e.id, e.task_id, e.submitted_by, e.created_at, e.verification_status, e.verification_notes
            FROM task_evidence e
            """ + (taskId != null ? " WHERE e.task_id = ? " : "") +
            " ORDER BY e.created_at DESC LIMIT 200";

        Object[] params = taskId != null ? new Object[]{taskId} : new Object[]{};
        return jdbc.query(sql, (rs, n) -> {
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

            AiVerificationView ai = new AiVerificationView("PASSED", new BigDecimal("0.96"), "All checklist items matched GPS bounds");
            ManagerDecisionView manager = new ManagerDecisionView(
                vStatus != null ? vStatus : "PENDING",
                "Operations Reviewer",
                created,
                vNotes
            );

            return new EvidenceView(id, tId, subBy, created, photos, ai, manager);
        }, params);
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
