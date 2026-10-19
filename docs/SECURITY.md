# ChaseHorse EMS — Security Architecture & Hardening Guide

## 1. Security Architecture Principles

ChaseHorse enforces Defense-in-Depth across its entire architecture:
1. **Never Trust the Client**: No client-supplied role, approval decision, reviewer identity, price total, or execution status is accepted as truth. All identity is derived from the cryptographically verified JWT bearer token.
2. **Explicit Role Authorization**: Frontend UI hiding or route disabling is considered UX only, never security. Every API endpoint enforces role checks via Spring Security method annotations (`@PreAuthorize("@roleAuthorization.hasAny(...)")`).
3. **Strict Tenant & Record Isolation**:
   - Customers may never view or mutate another customer's tasks, shipments, or company profiles.
   - Field workers may never view or modify another worker's wallet transactions or private tasks.
   - Path variables and request body identifiers are strictly cross-referenced against the authenticated token subject (`jwt.getSubject()`).
4. **Append-Only Financial Integrity**: The wallet ledger does not support in-place updates or deletions. Balance adjustments require signed, append-only entries with unique idempotency keys (`idempotency_key`) to prevent double-credits during network retries or concurrent calls.
5. **Atomic Operations**: Exclusive operations (such as claiming open tasks) are executed with atomic conditional SQL queries (`UPDATE tasks SET ... WHERE id=? AND status='OPEN'`). Non-atomic read-then-write patterns are prohibited.
6. **Zero Stored Credentials in Client Storage**: Plaintext passwords, tokens, or demo accounts are never stored in localStorage, sessionStorage, or client bundle code.

---

## 2. Token Verification & Authentication Boundaries

- **Issuer Validation**: The backend Spring Security OAuth2 resource server verifies that the JWT issuer matches `SUPABASE_JWT_ISSUER` (`https://<project-ref>.supabase.co/auth/v1`).
- **Signature & Expiry**: Tokens are validated using Supabase's published JWKS public keys. Expired, altered, or unsigned tokens are rejected with `401 Unauthorized`.
- **Identity & Profiles**: The token subject (`sub` claim) is extracted and mapped to `app_profiles` and `app_role_assignments`.
- **Quarantine for Pending Accounts**: Users registered as employees are created with `account_status = 'PENDING'`. They are prevented from claiming tasks or accessing the wallet until an authorized manager approves their profile.

---

## 3. Privilege Escalation Prevention

- Non-administrators (including `MANAGER` or `OPERATIONS` roles) are explicitly forbidden from assigning elevated permissions (`ADMIN` or `MANAGER`).
- In `EmployeeController.java`:
  ```java
  if ("ADMIN".equals(roleUpper) || "MANAGER".equals(roleUpper)) {
      boolean isAdmin = actorRoles.stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN"));
      if (!isAdmin) {
          throw ApiException.forbidden("Only administrators may grant MANAGER or ADMIN privileges");
      }
  }
  ```
- Any unauthorized attempt triggers an immediate `403 Forbidden` and security audit log.

---

## 4. Network & CORS Hardening

- Wildcard CORS patterns (`*`) combined with credential sharing (`allowCredentials=true`) have been completely removed.
- Allowed origins are explicitly parsed from `CORS_ALLOWED_ORIGINS`:
  - Web development: `http://localhost:5173`, `http://localhost:3000`
  - Mobile Metro bundlers: `http://localhost:8080`, `http://localhost:8081`, `http://localhost:8082`, `http://10.0.2.2:8080`, `http://10.0.2.2:8081`
  - Production domain names configured via environment variables.

---

## 5. Pre-Production Security Checklist

- [x] Neutralize and purge all localStorage password storage and account registries.
- [x] Remove demo credentials, fake OTP auto-fills, and client mock fallback writes.
- [x] Enforce customer tenant scoping on `/tasks`, `/tms/shipments`, and `/dashboard/stats`.
- [x] Enforce employee isolation on `/wallets/{employeeId}/transactions`.
- [x] Enforce server-side authoritative freight pricing on `/tms/shipments`.
- [x] Sanitize public tracking endpoints to prevent PII and price leakage.
- [x] Implement atomic conditional SQL claiming on task acceptance with 409 conflict handling.
- [x] Lock task lifecycle state transitions and prevent worker self-approvals.
- [x] Block non-admin role escalation in employee approvals.
- [x] Configure explicit CORS allowed origins without wildcard credentials.
- [ ] Inject production PostgreSQL credentials via server-side secrets manager before launch.
- [ ] Verify private Supabase Storage bucket policies and enforce short-lived signed URLs for evidence images.