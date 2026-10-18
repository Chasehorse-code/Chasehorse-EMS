package com.chasehorse.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Records important user and system actions for accountability.
 * Audit entries are append-only; they are never updated or deleted.
 */
@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final JdbcTemplate jdbc;

    public AuditService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Log an audit event. All parameters except action and entityType may be null.
     *
     * @param actorId    The user performing the action (null for system events)
     * @param action     A short verb phrase, e.g. "APPROVE_TASK", "ASSIGN_ROLE"
     * @param entityType The domain entity, e.g. "TASK", "PROFILE", "WALLET"
     * @param entityId   The ID of the affected entity
     * @param metadata   Additional structured context (stored as JSON)
     */
    public void log(UUID actorId, String action, String entityType, UUID entityId, Map<String, Object> metadata) {
        try {
            String metaJson = metadata != null ? toJson(metadata) : "{}";
            jdbc.update("""
                INSERT INTO audit_events (actor_id, action, entity_type, entity_id, metadata)
                VALUES (?, ?, ?, ?, CAST(? AS JSON))
                """,
                actorId, action, entityType, entityId, metaJson);
        } catch (Exception ex) {
            // Audit failures must never break business operations
            AuditService.log.error("Failed to write audit event: action={}, entity={}:{}", action, entityType, entityId, ex);
        }
    }

    public void log(UUID actorId, String action, String entityType, UUID entityId) {
        log(actorId, action, entityType, entityId, null);
    }

    private String toJson(Map<String, Object> map) {
        // Simple JSON serialization without pulling in Jackson directly
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (var entry : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(escapeJson(entry.getKey())).append("\":");
            Object val = entry.getValue();
            if (val == null) {
                sb.append("null");
            } else if (val instanceof Number) {
                sb.append(val);
            } else if (val instanceof Boolean) {
                sb.append(val);
            } else {
                sb.append("\"").append(escapeJson(val.toString())).append("\"");
            }
            first = false;
        }
        return sb.append("}").toString();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
