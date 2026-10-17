package com.chasehorse.employees;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    private final JdbcTemplate jdbc;

    public EmployeeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record EmployeeView(UUID id, String displayName, String accountStatus, OffsetDateTime createdAt) {}
    public record ApprovalRequest(@NotNull AccountStatus status) {}
    public enum AccountStatus { ACTIVE, SUSPENDED, REJECTED }

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS')")
    public List<EmployeeView> listEmployees() {
        return jdbc.query("""
            select id, display_name, account_status, created_at
            from app_profiles order by created_at desc limit 500
            """,
            (rs, rowNum) -> new EmployeeView(
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("account_status"),
                rs.getObject("created_at", OffsetDateTime.class)
            )
        );
    }

    @PatchMapping("/{employeeId}/approval")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN')")
    public EmployeeView setApproval(@PathVariable UUID employeeId,
                                    @Valid @RequestBody ApprovalRequest request) {
        return jdbc.queryForObject("""
            update app_profiles set account_status = ?, updated_at = now()
            where id = ?
            returning id, display_name, account_status, created_at
            """,
            (rs, rowNum) -> new EmployeeView(
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("account_status"),
                rs.getObject("created_at", OffsetDateTime.class)
            ),
            request.status().name(),
            employeeId
        );
    }
}