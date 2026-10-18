package com.chasehorse.notifications;

import com.chasehorse.common.ApiException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final JdbcTemplate jdbc;

    public NotificationController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record NotificationView(
        UUID id, UUID userId, String title, String body, String type,
        String entityType, UUID entityId, boolean read, OffsetDateTime createdAt
    ) {}

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<NotificationView> listNotifications(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return jdbc.query("""
            SELECT id, user_id, title, body, type, entity_type, entity_id, read, created_at
            FROM notifications WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 50
            """,
            (rs, n) -> new NotificationView(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("title"),
                rs.getString("body"),
                rs.getString("type"),
                rs.getString("entity_type"),
                rs.getObject("entity_id", UUID.class),
                rs.getBoolean("read"),
                rs.getObject("created_at", OffsetDateTime.class)
            ), userId
        );
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> markAsRead(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        int rows = jdbc.update("""
            UPDATE notifications SET read = true WHERE id = ? AND user_id = ?
            """, id, userId);

        if (rows == 0) throw ApiException.notFound("Notification", id);
        return Map.of("id", id, "read", true);
    }
}
