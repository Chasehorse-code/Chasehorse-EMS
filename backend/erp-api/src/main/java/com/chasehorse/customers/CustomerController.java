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

    public CustomerController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record CustomerView(UUID id, String name, String contact) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS', 'CUSTOMER')")
    public List<CustomerView> listCustomers() {
        return jdbc.query("""
            SELECT p.id, p.display_name, COALESCE(p.phone, p.email, 'contact@enterprise.com') AS contact
            FROM app_profiles p
            JOIN app_role_assignments r ON p.id = r.user_id
            WHERE r.role = 'CUSTOMER'
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
