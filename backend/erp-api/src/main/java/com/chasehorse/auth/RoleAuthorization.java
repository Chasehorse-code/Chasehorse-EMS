package com.chasehorse.auth;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Loads application roles from the database. JWT identity alone never grants a business role.
 * Role assignments must be provisioned by a trusted administrator workflow.
 */
@Component("roleAuthorization")
public class RoleAuthorization {
    private final JdbcTemplate jdbc;

    public RoleAuthorization(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean hasAny(Authentication authentication, String... allowedRoles) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) return false;
        String subject = jwtAuth.getToken().getSubject();
        if (subject == null || subject.isBlank()) return false;

        Set<String> allowed = Arrays.stream(allowedRoles)
            .map(role -> role.toUpperCase(Locale.ROOT))
            .collect(Collectors.toSet());

        var roles = jdbc.query(
            "select role from app_role_assignments where user_id = cast(? as uuid)",
            (rs, rowNum) -> rs.getString("role"),
            subject
        );
        return roles.stream().map(role -> role.toUpperCase(Locale.ROOT)).anyMatch(allowed::contains);
    }
}