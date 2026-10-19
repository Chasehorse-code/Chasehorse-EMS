package com.chasehorse.employees;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    private final JdbcTemplate jdbc;

    public EmployeeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record EmployeeView(
        UUID id,
        String displayName,
        String email,
        String phone,
        String region,
        String accountStatus,
        List<String> roles,
        OffsetDateTime createdAt
    ) {}

    public record ApprovalRequest(
        @NotNull AccountStatus status,
        String role
    ) {}

    public enum AccountStatus { ACTIVE, SUSPENDED, REJECTED, PENDING }

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS')")
    public List<EmployeeView> listEmployees() {
        return jdbc.query("""
            SELECT p.id, p.display_name, p.email, p.phone, p.region, p.account_status, p.created_at,
                   COALESCE((
                       SELECT string_agg(r.role, ',')
                       FROM app_role_assignments r
                       WHERE r.user_id = p.id
                   ), '') as roles_csv
            FROM app_profiles p
            ORDER BY p.created_at DESC LIMIT 500
            """,
            (rs, rowNum) -> {
                String rolesCsv = rs.getString("roles_csv");
                List<String> roles = (rolesCsv != null && !rolesCsv.isBlank())
                    ? Arrays.asList(rolesCsv.split(","))
                    : List.of();
                return new EmployeeView(
                    rs.getObject("id", UUID.class),
                    rs.getString("display_name"),
                    rs.getString("email"),
                    rs.getString("phone"),
                    rs.getString("region"),
                    rs.getString("account_status"),
                    roles,
                    rs.getObject("created_at", OffsetDateTime.class)
                );
            }
        );
    }

    @PatchMapping("/{employeeId}/approval")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS')")
    public EmployeeView setApproval(
        @PathVariable UUID employeeId,
        @Valid @RequestBody ApprovalRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = jwt != null ? UUID.fromString(jwt.getSubject()) : null;

        // 1. Update account status
        jdbc.update("""
            UPDATE app_profiles
            SET account_status = ?, updated_at = now()
            WHERE id = ?
            """,
            request.status().name(),
            employeeId
        );

        // 2. If a role is specified and status is ACTIVE, assign or update the role
        if (request.role() != null && !request.role().isBlank() && request.status() == AccountStatus.ACTIVE) {
            String roleUpper = request.role().toUpperCase();
            // Validate role
            var validRoles = List.of("FIELD_WORKER", "DRIVER", "DISPATCHER", "WAREHOUSE_STAFF", "OPERATIONS", "EMPLOYEE", "CUSTOMER", "MANAGER");
            if (validRoles.contains(roleUpper)) {
                jdbc.update("""
                    INSERT INTO app_role_assignments (user_id, role, granted_by)
                    VALUES (?, ?, ?)
                    ON CONFLICT (user_id, role) DO NOTHING
                    """,
                    employeeId, roleUpper, actorId
                );
            }
        }

        // Return updated employee
        List<EmployeeView> result = jdbc.query("""
            SELECT p.id, p.display_name, p.email, p.phone, p.region, p.account_status, p.created_at,
                   COALESCE((
                       SELECT string_agg(r.role, ',')
                       FROM app_role_assignments r
                       WHERE r.user_id = p.id
                   ), '') as roles_csv
            FROM app_profiles p
            WHERE p.id = ?
            """,
            (rs, rowNum) -> {
                String rolesCsv = rs.getString("roles_csv");
                List<String> roles = (rolesCsv != null && !rolesCsv.isBlank())
                    ? Arrays.asList(rolesCsv.split(","))
                    : List.of();
                return new EmployeeView(
                    rs.getObject("id", UUID.class),
                    rs.getString("display_name"),
                    rs.getString("email"),
                    rs.getString("phone"),
                    rs.getString("region"),
                    rs.getString("account_status"),
                    roles,
                    rs.getObject("created_at", OffsetDateTime.class)
                );
            },
            employeeId
        );

        return result.isEmpty() ? null : result.get(0);
    }
}