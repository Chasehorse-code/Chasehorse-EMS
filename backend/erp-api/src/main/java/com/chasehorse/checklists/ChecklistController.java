package com.chasehorse.checklists;

import com.chasehorse.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checklist-templates")
public class ChecklistController {
    private final JdbcTemplate jdbc;

    public ChecklistController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record ChecklistItemView(UUID id, String label, boolean required, boolean requiresPhoto, int sortOrder) {}

    public record ChecklistTemplateView(
        UUID id, String name, String category, List<ChecklistItemView> items,
        OffsetDateTime createdAt, OffsetDateTime updatedAt
    ) {}

    public record CreateItemRequest(String label, boolean required, boolean requiresPhoto, int sortOrder) {}

    public record SaveTemplateRequest(
        @NotBlank String name,
        @NotBlank String category,
        List<CreateItemRequest> items
    ) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'EMPLOYEE')")
    public List<ChecklistTemplateView> listTemplates() {
        return jdbc.query("""
            SELECT id, name, category, created_at, updated_at
            FROM checklist_templates ORDER BY name ASC
            """,
            (rs, n) -> {
                UUID id = rs.getObject("id", UUID.class);
                var items = loadItems(id);
                return new ChecklistTemplateView(
                    id, rs.getString("name"), rs.getString("category"), items,
                    rs.getObject("created_at", OffsetDateTime.class),
                    rs.getObject("updated_at", OffsetDateTime.class)
                );
            }
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'EMPLOYEE')")
    public ChecklistTemplateView getTemplate(@PathVariable UUID id) {
        var results = jdbc.query("""
            SELECT id, name, category, created_at, updated_at
            FROM checklist_templates WHERE id = ?
            """,
            (rs, n) -> new ChecklistTemplateView(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("category"),
                loadItems(id),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class)
            ), id
        );
        if (results.isEmpty()) throw ApiException.notFound("ChecklistTemplate", id);
        return results.get(0);
    }

    @PostMapping
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER')")
    public ChecklistTemplateView createTemplate(
        @Valid @RequestBody SaveTemplateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID id = UUID.randomUUID();
        UUID actorId = UUID.fromString(jwt.getSubject());
        jdbc.update("""
            INSERT INTO checklist_templates (id, name, category, created_by)
            VALUES (?, ?, ?, ?)
            """, id, request.name(), request.category(), actorId);

        saveItems(id, request.items());
        return getTemplate(id);
    }

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER')")
    public ChecklistTemplateView updateTemplate(
        @PathVariable UUID id,
        @Valid @RequestBody SaveTemplateRequest request
    ) {
        int rows = jdbc.update("""
            UPDATE checklist_templates SET name = ?, category = ?, updated_at = now()
            WHERE id = ?
            """, request.name(), request.category(), id);

        if (rows == 0) throw ApiException.notFound("ChecklistTemplate", id);

        jdbc.update("DELETE FROM checklist_items WHERE template_id = ?", id);
        saveItems(id, request.items());
        return getTemplate(id);
    }

    private List<ChecklistItemView> loadItems(UUID templateId) {
        return jdbc.query("""
            SELECT id, label, required, requires_photo, sort_order
            FROM checklist_items WHERE template_id = ? ORDER BY sort_order ASC
            """,
            (rs, n) -> new ChecklistItemView(
                rs.getObject("id", UUID.class),
                rs.getString("label"),
                rs.getBoolean("required"),
                rs.getBoolean("requires_photo"),
                rs.getInt("sort_order")
            ), templateId
        );
    }

    private void saveItems(UUID templateId, List<CreateItemRequest> items) {
        if (items == null) return;
        int order = 0;
        for (var it : items) {
            jdbc.update("""
                INSERT INTO checklist_items (id, template_id, label, required, requires_photo, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), templateId, it.label(), it.required(), it.requiresPhoto(), order++);
        }
    }
}
