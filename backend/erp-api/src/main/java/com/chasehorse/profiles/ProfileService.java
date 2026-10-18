package com.chasehorse.profiles;

import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Manages application profiles and role assignments.
 * A profile is created when a user first authenticates via Supabase Auth.
 * Roles are assigned by administrators through a trusted process.
 */
@Service
public class ProfileService {
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public ProfileService(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    public record ProfileView(
        UUID id, String displayName, String email, String phone,
        String avatarUrl, String region, String accountStatus,
        List<String> roles, OffsetDateTime createdAt, OffsetDateTime updatedAt
    ) {}

    public record ProfileSummary(
        UUID id, String displayName, String accountStatus, OffsetDateTime createdAt
    ) {}

    /**
     * Finds or creates a profile for the authenticated user.
     * Called on every authenticated request to /me to ensure profile exists.
     */
    @Transactional
    public ProfileView findOrCreate(UUID userId, String email, String displayName) {
        var existing = jdbc.query("""
            SELECT id, display_name, email, phone, avatar_url, region, account_status, created_at, updated_at
            FROM app_profiles WHERE id = ?
            """,
            (rs, n) -> new ProfileSummary(
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("account_status"),
                rs.getObject("created_at", OffsetDateTime.class)),
            userId);

        if (existing.isEmpty()) {
            jdbc.update("""
                INSERT INTO app_profiles (id, display_name, email, account_status)
                VALUES (?, ?, ?, 'PENDING')
                """, userId, displayName != null ? displayName : email, email);
            audit.log(userId, "PROFILE_CREATED", "PROFILE", userId,
                Map.of("email", email != null ? email : ""));
        }

        return loadFullProfile(userId);
    }

    /** Load the full profile with roles. */
    public ProfileView loadFullProfile(UUID userId) {
        var profiles = jdbc.query("""
            SELECT id, display_name, email, phone, avatar_url, region, account_status, created_at, updated_at
            FROM app_profiles WHERE id = ?
            """,
            (rs, n) -> new Object[] {
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("email"),
                rs.getString("phone"),
                rs.getString("avatar_url"),
                rs.getString("region"),
                rs.getString("account_status"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class)
            },
            userId);

        if (profiles.isEmpty()) {
            throw ApiException.notFound("Profile", userId);
        }

        Object[] p = profiles.get(0);
        List<String> roles = jdbc.query(
            "SELECT role FROM app_role_assignments WHERE user_id = ?",
            (rs, n) -> rs.getString("role"),
            userId);

        return new ProfileView(
            (UUID) p[0], (String) p[1], (String) p[2], (String) p[3],
            (String) p[4], (String) p[5], (String) p[6],
            roles,
            (OffsetDateTime) p[7], (OffsetDateTime) p[8]);
    }

    /** List all profiles (admin/manager view). */
    public List<ProfileSummary> listProfiles(int limit) {
        return jdbc.query("""
            SELECT id, display_name, account_status, created_at
            FROM app_profiles ORDER BY created_at DESC LIMIT ?
            """,
            (rs, n) -> new ProfileSummary(
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("account_status"),
                rs.getObject("created_at", OffsetDateTime.class)),
            limit);
    }

    /** Update a profile's account status (admin action). */
    @Transactional
    public ProfileView setAccountStatus(UUID targetUserId, String status, UUID actorId) {
        int rows = jdbc.update(
            "UPDATE app_profiles SET account_status = ?, updated_at = now() WHERE id = ?",
            status, targetUserId);
        if (rows == 0) throw ApiException.notFound("Profile", targetUserId);

        audit.log(actorId, "ACCOUNT_STATUS_CHANGED", "PROFILE", targetUserId,
            Map.of("new_status", status));
        return loadFullProfile(targetUserId);
    }

    /** Assign a role to a user (admin action). */
    @Transactional
    public ProfileView assignRole(UUID targetUserId, String role, UUID grantedBy) {
        // Validate the role
        var validRoles = List.of("ADMIN", "MANAGER", "OPERATIONS", "EMPLOYEE", "CUSTOMER", "PARTNER", "FIELD_WORKER");
        if (!validRoles.contains(role.toUpperCase())) {
            throw ApiException.badRequest("Invalid role: " + role);
        }

        // Only admins can grant ADMIN or MANAGER roles — checked at controller level via @PreAuthorize
        jdbc.update("""
            INSERT INTO app_role_assignments (user_id, role, granted_by)
            VALUES (?, ?, ?)
            ON CONFLICT (user_id, role) DO NOTHING
            """, targetUserId, role.toUpperCase(), grantedBy);

        audit.log(grantedBy, "ROLE_ASSIGNED", "PROFILE", targetUserId,
            Map.of("role", role.toUpperCase()));
        return loadFullProfile(targetUserId);
    }

    /** Remove a role from a user (admin action). */
    @Transactional
    public ProfileView revokeRole(UUID targetUserId, String role, UUID actorId) {
        jdbc.update(
            "DELETE FROM app_role_assignments WHERE user_id = ? AND role = ?",
            targetUserId, role.toUpperCase());

        audit.log(actorId, "ROLE_REVOKED", "PROFILE", targetUserId,
            Map.of("role", role.toUpperCase()));
        return loadFullProfile(targetUserId);
    }
}
