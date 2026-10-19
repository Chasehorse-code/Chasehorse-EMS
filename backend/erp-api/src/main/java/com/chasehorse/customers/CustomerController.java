package com.chasehorse.customers;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {
    private final JdbcTemplate jdbc;
    private final com.chasehorse.auth.RoleAuthorization roleAuth;

    public CustomerController(JdbcTemplate jdbc, com.chasehorse.auth.RoleAuthorization roleAuth) {
        this.jdbc = jdbc;
        this.roleAuth = roleAuth;
    }

    public record CustomerView(UUID id, String name, String contact) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'CUSTOMER')")
    public List<CustomerView> listCustomers(
        @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isAdminOrOps = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("OPERATIONS"));

        if (!isAdminOrOps) {
            // Customer only sees themselves
            return jdbc.query("""
                SELECT p.id, p.display_name, COALESCE(p.phone, p.email, 'contact@enterprise.com') AS contact
                FROM app_profiles p
                WHERE p.id = ?
                """,
                (rs, n) -> new CustomerView(
                    rs.getObject("id", UUID.class),
                    rs.getString("display_name"),
                    rs.getString("contact")
                ), actorId
            );
        }

        return jdbc.query("""
            SELECT p.id, p.display_name, COALESCE(p.phone, p.email, 'contact@enterprise.com') AS contact
            FROM app_profiles p
            LEFT JOIN app_role_assignments r ON p.id = r.user_id
            WHERE r.role = 'CUSTOMER' OR r.role IS NULL
            LIMIT 100
            """,
            (rs, n) -> new CustomerView(
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("contact")
            )
        );
    }
}
