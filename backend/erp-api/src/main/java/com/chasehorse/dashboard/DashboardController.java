package com.chasehorse.dashboard;

import com.chasehorse.auth.RoleAuthorization;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    private final JdbcTemplate jdbc;
    private final RoleAuthorization roleAuth;

    public DashboardController(JdbcTemplate jdbc, RoleAuthorization roleAuth) {
        this.jdbc = jdbc;
        this.roleAuth = roleAuth;
    }

    @GetMapping("/stats")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'CUSTOMER')")
    public Map<String, Object> getStats(
        @RequestParam(required = false) String customerId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));
        boolean isCustomer = !isOpsOrAdmin && roles.stream().anyMatch(r -> r.equalsIgnoreCase("CUSTOMER"));

        Map<String, Object> stats = new LinkedHashMap<>();

        // If customer, isolate counts strictly to their own customer_id
        String countSql;
        List<Map.Entry<String, Integer>> taskCounts;

        if (isCustomer) {
            countSql = "SELECT status, COUNT(*) as cnt FROM tasks WHERE customer_id = ? GROUP BY status";
            taskCounts = jdbc.query(countSql, (rs, n) -> Map.entry(rs.getString("status"), rs.getInt("cnt")), actorId);
        } else if (customerId != null && !customerId.isBlank()) {
            countSql = "SELECT status, COUNT(*) as cnt FROM tasks WHERE customer_id = ? GROUP BY status";
            taskCounts = jdbc.query(countSql, (rs, n) -> Map.entry(rs.getString("status"), rs.getInt("cnt")), UUID.fromString(customerId));
        } else {
            countSql = "SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status";
            taskCounts = jdbc.query(countSql, (rs, n) -> Map.entry(rs.getString("status"), rs.getInt("cnt")));
        }

        Map<String, Integer> byStatus = new LinkedHashMap<>();
        int total = 0, open = 0, inProgress = 0, awaitingReview = 0, approved = 0;
        for (var entry : taskCounts) {
            byStatus.put(entry.getKey(), entry.getValue());
            total += entry.getValue();
            switch (entry.getKey()) {
                case "OPEN" -> open = entry.getValue();
                case "IN_PROGRESS", "ASSIGNED" -> inProgress += entry.getValue();
                case "SUBMITTED", "IN_REVIEW" -> awaitingReview += entry.getValue();
                case "APPROVED" -> approved = entry.getValue();
            }
        }

        stats.put("totalTasks", total);
        stats.put("openTasks", open);
        stats.put("inProgress", inProgress);
        stats.put("awaitingReview", awaitingReview);
        stats.put("approvedTotal", approved);
        stats.put("byStatus", byStatus);

        if (!isCustomer) {
            // Active employees
            Integer activeEmployees = jdbc.queryForObject(
                "SELECT COUNT(*) FROM app_profiles WHERE account_status = 'ACTIVE'", Integer.class);
            stats.put("activeEmployees", activeEmployees != null ? activeEmployees : 0);

            // Pending employee approvals
            Integer pendingApprovals = jdbc.queryForObject(
                "SELECT COUNT(*) FROM app_profiles WHERE account_status = 'PENDING'", Integer.class);
            stats.put("pendingEmployeeApprovals", pendingApprovals != null ? pendingApprovals : 0);

            // Pending ops approvals
            Integer awaitingOps = jdbc.queryForObject(
                "SELECT COUNT(*) FROM task_approvals WHERE decision = 'PENDING'", Integer.class);
            stats.put("awaitingOps", awaitingOps != null ? awaitingOps : 0);
        } else {
            // Do not expose internal workforce and operations numbers to external customers
            stats.put("activeEmployees", 0);
            stats.put("pendingEmployeeApprovals", 0);
            stats.put("awaitingOps", 0);
        }

        return stats;
    }
}
