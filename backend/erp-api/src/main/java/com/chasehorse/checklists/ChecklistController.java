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
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'EMPLOYEE', 'CUSTOMER', 'FIELD_WORKER')")
    public List<ChecklistTemplateView> listTemplates() {
        var list = jdbc.query("""
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

        return list.isEmpty() ? getStandardTemplates() : list;
    }

    @GetMapping("/{id}")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'EMPLOYEE', 'CUSTOMER', 'FIELD_WORKER')")
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

    private List<ChecklistTemplateView> getStandardTemplates() {
        return List.of(
            new ChecklistTemplateView(
                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                "Shelf audit", "Shelf audit",
                List.of(
                    new ChecklistItemView(UUID.randomUUID(), "Exterior & store entrance photo", true, true, 0),
                    new ChecklistItemView(UUID.randomUUID(), "Verify shelf placement & SKU facing count", true, true, 1),
                    new ChecklistItemView(UUID.randomUUID(), "Inspect promotional standee and discount signage", true, true, 2),
                    new ChecklistItemView(UUID.randomUUID(), "Record product expiry date on top rack", true, false, 3),
                    new ChecklistItemView(UUID.randomUUID(), "Confirm competitor pricing tag", false, false, 4)
                ),
                OffsetDateTime.now(), OffsetDateTime.now()
            ),
            new ChecklistTemplateView(
                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                "Site survey", "Site survey",
                List.of(
                    new ChecklistItemView(UUID.randomUUID(), "Capture GPS geotagged perimeter photo", true, true, 0),
                    new ChecklistItemView(UUID.randomUUID(), "Verify property boundary and access road width", true, false, 1),
                    new ChecklistItemView(UUID.randomUUID(), "Inspect utility line proximity (power/water)", true, false, 2),
                    new ChecklistItemView(UUID.randomUUID(), "Record store manager contact & signature", true, false, 3)
                ),
                OffsetDateTime.now(), OffsetDateTime.now()
            ),
            new ChecklistTemplateView(
                UUID.fromString("33333333-3333-3333-3333-333333333333"),
                "Signage check", "Signage check",
                List.of(
                    new ChecklistItemView(UUID.randomUUID(), "Photograph primary billboard / storefront sign", true, true, 0),
                    new ChecklistItemView(UUID.randomUUID(), "Verify illumination & electrical cabling", true, true, 1),
                    new ChecklistItemView(UUID.randomUUID(), "Report physical damage or vinyl peeling", false, false, 2)
                ),
                OffsetDateTime.now(), OffsetDateTime.now()
            ),
            new ChecklistTemplateView(
                UUID.fromString("44444444-4444-4444-4444-444444444444"),
                "Equipment inspection", "Equipment inspection",
                List.of(
                    new ChecklistItemView(UUID.randomUUID(), "Scan asset barcode / serial number", true, true, 0),
                    new ChecklistItemView(UUID.randomUUID(), "Inspect casing, lock & seal integrity", true, true, 1),
                    new ChecklistItemView(UUID.randomUUID(), "Record operating gauge / temperature reading", true, false, 2),
                    new ChecklistItemView(UUID.randomUUID(), "Confirm safety shutoff switch functionality", true, false, 3)
                ),
                OffsetDateTime.now(), OffsetDateTime.now()
            ),
            new ChecklistTemplateView(
                UUID.fromString("55555555-5555-5555-5555-555555555555"),
                "Delivery proof", "Delivery proof",
                List.of(
                    new ChecklistItemView(UUID.randomUUID(), "Photograph package at delivery doorstep / loading bay", true, true, 0),
                    new ChecklistItemView(UUID.randomUUID(), "Verify recipient identity and signature", true, false, 1),
                    new ChecklistItemView(UUID.randomUUID(), "Confirm tamper-evident seal is intact", true, false, 2)
                ),
                OffsetDateTime.now(), OffsetDateTime.now()
            )
        );
    }
}
