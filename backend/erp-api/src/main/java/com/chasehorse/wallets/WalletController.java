package com.chasehorse.wallets;

import com.chasehorse.common.AuditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.chasehorse.auth.RoleAuthorization;
import com.chasehorse.common.ApiException;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletController {
    private final JdbcTemplate jdbc;
    private final AuditService audit;
    private final RoleAuthorization roleAuth;

    public WalletController(JdbcTemplate jdbc, AuditService audit, RoleAuthorization roleAuth) {
        this.jdbc = jdbc;
        this.audit = audit;
        this.roleAuth = roleAuth;
    }

    public record WalletAccountView(
        UUID employeeId, BigDecimal balanceInr, BigDecimal pendingInr
    ) {}

    public record WalletTransactionView(
        UUID id, UUID employeeId, String type, BigDecimal amountInr,
        String status, OffsetDateTime createdAt, String reference, UUID taskId
    ) {}

    public record AdjustWalletRequest(
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String entryType,
        @NotBlank String description
    ) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS')")
    public List<WalletAccountView> listWalletAccounts() {
        return jdbc.query("""
            SELECT user_id, COALESCE(SUM(amount), 0) AS balance
            FROM wallet_ledger
            GROUP BY user_id
            """,
            (rs, n) -> new WalletAccountView(
                rs.getObject("user_id", UUID.class),
                rs.getBigDecimal("balance"),
                BigDecimal.ZERO
            )
        );
    }

    @GetMapping("/{employeeId}/transactions")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'EMPLOYEE', 'FIELD_WORKER')")
    public List<WalletTransactionView> listTransactions(
        @PathVariable UUID employeeId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isOpsOrAdmin = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("OPERATIONS"));

        if (!isOpsOrAdmin && !actorId.equals(employeeId)) {
            throw ApiException.forbidden("Cannot view another employee's wallet transactions");
        }
        return jdbc.query("""
            SELECT id, user_id, entry_type, amount, created_at, description, task_id
            FROM wallet_ledger WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 100
            """,
            (rs, n) -> new WalletTransactionView(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("entry_type") != null ? rs.getString("entry_type").toLowerCase() : "task_reward",
                rs.getBigDecimal("amount"),
                "completed",
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getString("description"),
                rs.getObject("task_id", UUID.class)
            ), employeeId
        );
    }

    @PostMapping("/{employeeId}/adjust")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN')")
    public Map<String, Object> adjustWallet(
        @PathVariable UUID employeeId,
        @Valid @RequestBody AdjustWalletRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        UUID id = UUID.randomUUID();
        String idempotencyKey = "manual-adj-" + UUID.randomUUID();

        jdbc.update("""
            INSERT INTO wallet_ledger (id, user_id, idempotency_key, entry_type, amount, currency, description, created_by)
            VALUES (?, ?, ?, ?, ?, 'INR', ?, ?)
            """, id, employeeId, idempotencyKey, request.entryType().toUpperCase(),
            request.amount(), request.description(), actorId);

        audit.log(actorId, "WALLET_MANUAL_ADJUSTMENT", "WALLET_LEDGER", employeeId,
            Map.of("amount", request.amount().toString(), "description", request.description()));

        return Map.of("id", id, "status", "SUCCESS", "adjustedAmount", request.amount());
    }
}
