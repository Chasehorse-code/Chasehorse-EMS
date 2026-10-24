# ChaseHorse EMS — Repository and Blueprint Audit & Requirements Traceability Matrix

**Specification Source**: `ChaseHorse_ERP_Implementation_Blueprint-2.docx` (v1.0)  
**Audit Date**: 2026-10-19  
**Auditor**: Senior Software Architect, Security Engineer & QA Lead  
**Branch**: `feat/complete-erp-architecture-audit`

---

## 1. Executive Summary & Audit Assessment

The primary requirement of ChaseHorse is an end-to-end, secure, scalable, database-backed Enterprise Field Operations and Transport Management Platform for India. The blueprint dictates strict role-based access control (RBAC), tenant/record isolation (customers only see their own tasks and shipments, field workers only see their assigned work and own wallet), atomic task acceptance without double-claiming, validated task lifecycle state transitions, immutable wallet ledger with idempotent reward credits, and removal of all simulated fallbacks, fake data, and local authentication bypasses.

### Summary of Audit Findings:
1. **Critical Authentication Bypass**: `AuthContext.tsx` and `accountRegistry.ts` contained a client-side localStorage fallback that verified passwords against unencrypted localStorage records, minted fake tokens, and impersonated arbitrary roles without reaching Supabase Auth or Spring Security.
2. **Wildcard Insecure CORS**: `SecurityConfig.java` had `setAllowedOriginPatterns(List.of("*"))` paired with `setAllowCredentials(true)`, creating an exploitable cross-origin vulnerability.
3. **Missing Record & Tenant Ownership Scoping**:
   - `TaskController.java`: `GET /api/v1/tasks` and `GET /api/v1/tasks/{id}` allowed customers to retrieve any customer's tasks without enforcing `customerId == actorId`.
   - `TmsController.java`: `GET /api/v1/tms/shipments` returned all shipments across all customers to any customer caller.
   - `CustomerController.java`: Allowed any customer to dump the entire customer directory.
   - `WalletController.java`: `GET /api/v1/wallets/{employeeId}/transactions` allowed any employee to inspect any other employee's ledger transactions by tampering with the URL path.
   - `DashboardController.java`: Customer role received platform-wide employee and task totals instead of customer-scoped metrics.
4. **State Machine & Role Escalation Vulnerabilities**:
   - `TaskController.java` (`PATCH /api/v1/tasks/{taskId}/status`): Permitted `FIELD_WORKER` to submit any status, including `APPROVED`, enabling self-approval. No lifecycle state machine was enforced (`OPEN -> ASSIGNED -> IN_PROGRESS -> SUBMITTED -> IN_REVIEW -> APPROVED/REJECTED/CANCELLED`).
   - `EmployeeController.java`: Permitted non-admin operators to escalate roles to `MANAGER` or `ADMIN`.
   - Missing atomic task acceptance endpoint (`POST /api/v1/tasks/{id}/accept`), leaving task claiming vulnerable to race conditions.
5. **Hardcoded Mock & Fallback Data**:
   - `src/api/restApi.ts`: Contains `DEFAULT_FIELD_TASKS`, `getStoredTasks()`, fake `TSK-` generator, and fallback success writes when backend is offline.
   - `apps/mobile/src/api/restApi.ts`: Contains hardcoded `clientTasks` array and client-side simulation.
   - `EvidenceController.java`: Hardcoded `AiVerificationView("PASSED", 0.96, ...)` returned rather than reading from `ai_verifications` table.

---

## 2. Requirements Traceability Matrix (RTM)

| Blueprint Requirement | Existing Implementation | Missing or Incomplete Functionality | Security Risk | Required Modification | Test Needed to Prove Completion |
|---|---|---|---|---|---|
| **1. Authentication (Supabase Auth)**: Single sign-in via Supabase session; verify JWT on backend; no localStorage auth. | Web `AuthContext.tsx`, Supabase JS SDK, Spring Security OAuth2 resource server with `jwtDecoder`. | Frontend fell back to `accountRegistry` in localStorage when Supabase failed, storing plaintext passwords. | **Critical**: Credential theft, unauthorized session forgery, bypass of Supabase MFA/rate-limits. | Purge `accountRegistry` password storage; reject unauthenticated logins; require real Supabase token. | `AuthSecurityTest`: Reject requests without valid bearer token; ensure no local credential bypass. |
| **2. Role Taxonomy & Server Authority**: 7 roles: `ADMIN`, `MANAGER`, `OPERATIONS`, `EMPLOYEE`, `CUSTOMER`, `PARTNER`, `FIELD_WORKER`. Derived strictly from server DB. | `app_role_assignments` table, `RoleAuthorization.java`, `CurrentUserController.java`. | `EmployeeController` allowed non-admins to grant `MANAGER` role. Status updates lacked role checks. | **High**: Privilege escalation; workers self-promoting or approving tasks. | Restrict elevated role grants to `ADMIN`; restrict approval decisions to `ADMIN`/`OPERATIONS`/`MANAGER`. | `RoleEscalationTest`: Verify non-admin receives 403 when assigning `MANAGER`/`ADMIN`. |
| **3. Customer Record Isolation**: Customers access ONLY their own tasks, TMS bookings, and completion metrics. | `TaskController.java`, `TmsController.java`, `DashboardController.java`. | Query params accepted arbitrary `customerId` or returned global list if omitted; no caller ID matching. | **High**: Cross-tenant data breach; Customer A reads Customer B's tasks, shipments, PII. | In controllers, if caller has `CUSTOMER` role, override `customerId` with `jwt.getSubject()`; verify ownership in detail views. | `CustomerIsolationTest`: Customer A attempts to fetch Customer B's task and shipment; expect 403/404. |
| **4. Atomic Task Acceptance**: Only eligible employees can accept open tasks. Double-claim must be prevented. | `TaskService.assignTask` exists for manual assignment. `acceptTask` in web used `updateStatus`. | No atomic conditional update on task acceptance; vulnerable to concurrent race condition. | **High**: Race condition; multiple workers accept the same exclusive task. | Add `POST /api/v1/tasks/{id}/accept` with `UPDATE tasks SET status='IN_PROGRESS', assigned_to=? WHERE id=? AND status='OPEN'`. | `ConcurrentTaskAcceptanceTest`: Concurrent thread execution; exactly 1 succeeds, second receives 409 Conflict. |
| **5. Task Lifecycle State Machine**: Explicit transitions: `OPEN -> ASSIGNED -> IN_PROGRESS -> SUBMITTED -> IN_REVIEW -> APPROVED / REJECTED / CANCELLED`. | `updateStatus` in `TaskService.java` allowed arbitrary status overwrite. | No validation of valid transitions; workers could set terminal states directly. | **High**: Workflow tampering, skipping evidence, self-approval of rewards. | Implement strict state-machine validator in `TaskService`. Reject invalid transitions with 400 Bad Request. | `TaskLifecycleStateTest`: Attempt invalid jumps (e.g. `OPEN` to `APPROVED`); verify 400 Bad Request. |
| **6. Evidence & AI Verification**: In-app photo upload with metadata. AI results stored separately; human approval required. | `task_evidence` and `ai_verifications` tables; `EvidenceController.java`. | `EvidenceController` returned hardcoded `PASSED` 0.96 confidence instead of querying `ai_verifications`. | **Medium**: False confidence in unverified field tasks; AI hallucinated without DB backing. | Query `ai_verifications` table in `EvidenceController`. Return `NOT_RUN` when AI hasn't executed. | `EvidenceVerificationTest`: Verify genuine DB state of AI verification returned; no hardcoded pass. |
| **7. Wallet Ledger & Idempotency**: Immutable append-only ledger; credit reward ONLY upon manager approval with idempotency key. | `wallet_ledger` table with unique constraint on `idempotency_key`; `ApprovalController.java`. | `WalletController` allowed employees to view any employee's transactions. | **High**: Privacy leak; financial information exposure; potential double-credit on retry. | Restrict `listTransactions` to `actorId == employeeId` unless caller is `ADMIN`/`OPERATIONS`. Enforce idempotency key in DB. | `WalletSecurityTest`: Worker A reads Worker B's wallet (403); duplicate approval credits wallet exactly once. |
| **8. TMS Pricing & Public Tracking**: Server calculates authoritative prices; public tracking hides customer PII and pricing. | `tms_transport_plans`, `tms_bookings`, `tms_tracking_events`; `TmsController.java`. | `createShipment` accepted client-supplied `totalPrice`. Tracking endpoint exposed full addresses & price. | **Medium**: Financial tampering (underpaying for freight); PII leakage on public endpoints. | Calculate `totalPrice` on server from transport plan base rate and weight; sanitize public tracking DTO. | `TmsSecurityAndPricingTest`: Ensure server-calculated price; verify public tracking excludes PII/price. |
| **9. CORS & Network Security**: Explicit CORS allowed origins; no wildcard credentialed CORS. | `SecurityConfig.java` had `setAllowedOriginPatterns(List.of("*"))`. | Wildcard allowed origins with credentials enabled. | **High**: Cross-Site Scripting (XSS) / Cross-Origin data exfiltration. | Restrict CORS to configured origins (e.g. `http://localhost:5173`, `http://localhost:8082`, production domains). | `SecurityConfigTest`: Test cross-origin headers against non-whitelisted origins. |
| **10. Eradication of Demo Data**: Remove hardcoded task lists, fake dashboards, client-side registries. | `DEFAULT_FIELD_TASKS`, `clientTasks`, `taskRegistry.ts`, `accountRegistry.ts`. | Offline simulation pretended writes succeeded when backend was offline. | **Medium**: Data loss; user believes task was created or accepted when it never reached DB. | Remove `DEFAULT_FIELD_TASKS` and mock fallbacks; display authentic loading, empty, and error states. | Frontend build & typecheck validation; verify zero mock task leaks. |

---

## 3. Discrepancies Between Blueprint & Initial Codebase

1. **Role Granting**:
   - *Blueprint*: Only Administrators may assign elevated permissions (Manager, Admin).
   - *Code*: `EmployeeController` allowed `OPERATIONS` or `MANAGER` to grant `MANAGER` role.
2. **Task Claiming**:
   - *Blueprint*: "Acceptance is atomic so the same exclusive task cannot be assigned twice."
   - *Code*: Was executed as a plain non-atomic `PATCH /tasks/{id}/status` from the client without checking current `status == 'OPEN'` in an atomic update.
3. **Wallet Privacy**:
   - *Blueprint*: "Employees may access own profile, eligible tasks, assigned work and own wallet."
   - *Code*: `WalletController` exposed `/{employeeId}/transactions` to any authenticated employee.
4. **Transport Pricing**:
   - *Blueprint*: "Never trust reward amounts or prices submitted by the mobile app; calculate and validate them on the server."
   - *Code*: `TmsController` directly inserted client-submitted `request.totalPrice()` into `tms_bookings`.

---

## 4. Remediation Plan

1. **Backend Security Enhancements**:
   - Update `SecurityConfig.java`: Explicit CORS allowed origins, remove wildcard origins.
   - Refactor `TaskController.java` & `TaskService.java`: Implement customer tenant isolation, atomic `POST /{id}/accept`, task lifecycle state transitions, and role enforcement.
   - Refactor `WalletController.java`: Restrict transaction viewing to record owner or admin/operations; add `/api/v1/wallets/me` balance endpoint.
   - Refactor `TmsController.java`: Scope shipments by customer; calculate prices authoritatively; sanitize public tracking.
   - Refactor `EmployeeController.java`: Restrict `MANAGER`/`ADMIN` role granting strictly to `ADMIN`.
   - Refactor `EvidenceController.java`: Remove hardcoded AI score; query `ai_verifications` table.
   - Refactor `DashboardController.java`: Scope statistics for `CUSTOMER` role.
2. **Purge Fake Data in Web & Mobile**:
   - Remove `DEFAULT_FIELD_TASKS` from `src/api/restApi.ts`.
   - Remove `clientTasks` mock array from `apps/mobile/src/api/restApi.ts`.
   - Remove simulated offline persistence in `taskRegistry.ts` and `accountRegistry.ts` that bypassed the real backend.
   - Remove password caching in `localStorage`.
3. **Automated Test Suite**:
   - Create comprehensive Spring Boot tests: `TaskSecurityAndLifecycleTest`, `WalletSecurityTest`, `TmsSecurityAndPricingTest`, `RoleEscalationTest`.
   - Run Maven test suite and ensure all tests pass cleanly.
