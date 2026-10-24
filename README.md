# ChaseHorse EMS — Enterprise Field Operations & Logistics Platform

ChaseHorse EMS is an enterprise-grade workforce orchestration, field audit, and transport management platform designed for high-scale operations in India.

The platform coordinates business customers, distributed on-field workers, operations managers, and commercial logistics transport through an authoritative Java Spring Boot REST API, real Supabase PostgreSQL persistence, cryptographic JWT authentication, and native mobile applications.

---

## Architecture Overview

```
                                 ┌─────────────────────────┐
                                 │   Supabase Auth / DB    │
                                 │  PostgreSQL 15+ & RLS   │
                                 └────────────┬────────────┘
                                              │ (JDBC / Flyway)
                                 ┌────────────▼────────────┐
                                 │    Java 21 Spring Boot  │
                                 │   REST API (/api/v1/*)  │
                                 └──────▲────────────▲─────┘
                                        │ (JWT)      │ (JWT)
                    ┌───────────────────┴──┐      ┌──┴────────────────────┐
                    │  React 18 + TS Web   │      │  React Native Mobile  │
                    │   Vite Admin & Ops   │      │   Expo 52 Field App   │
                    └──────────────────────┘      └───────────────────────┘
```

- **Web Frontend**: React 18, TypeScript, Vite, Vanilla CSS.
- **Mobile Frontend**: React Native 0.76, Expo 52, TypeScript.
- **Backend API**: Java 21, Spring Boot 3.4.5, Spring Security OAuth2 Resource Server, Spring Data JPA, Flyway.
- **Database**: PostgreSQL with Row-Level Security (RLS) policies and versioned Flyway migrations.
- **Authentication**: Supabase Auth (JWT Bearer tokens verified via Supabase JWKS).
- **Storage**: Private Supabase Storage bucket for GPS-watermarked evidence.

---

## Core Enterprise Modules

1. **Role-Based Access Control (RBAC)**: Single role taxonomy (`ADMIN`, `MANAGER`, `OPERATIONS`, `EMPLOYEE`, `CUSTOMER`, `FIELD_WORKER`, `PARTNER`) enforced strictly server-side. Prevention of role escalation.
2. **Customer Tenant Isolation**: Complete tenant scoping on tasks, TMS shipments, and dashboard analytics.
3. **Task Lifecycle State Machine**: Explicit transitions (`OPEN -> ASSIGNED -> IN_PROGRESS -> SUBMITTED -> IN_REVIEW -> APPROVED/REJECTED/CANCELLED`). Workers cannot self-approve.
4. **Atomic Task Claiming**: Atomic SQL updates prevent concurrent race conditions or double-claims. Returns `409 Conflict` on contention.
5. **Geo-Tagged Photographic Evidence**: Field camera viewfinder HUD with real-time GPS coordinate watermarking and device telemetry.
6. **AI Verification & Human Manager Review**: AI verification results stored in `ai_verifications` table; separated from required human operations approvals.
7. **Immutable Wallet Ledger**: Transactional, append-only financial ledger with unique idempotency keys (`idempotency_key`) preventing duplicate reward disbursements.
8. **Transport Management System (TMS)**: Authoritative server-side freight pricing based on payload weight and transport plan rates. Sanitized public tracking view omitting sensitive PII.

---

## Getting Started

### 1. Backend REST API (Spring Boot 3.4 / Java 21)
```bash
cd backend/erp-api

# Execute automated security and integration tests
mvn test

# Run API server locally on http://localhost:8080
mvn spring-boot:run
```

### 2. Web Frontend (React 18 + Vite)
```bash
# In project root
npm install

# Run TypeScript type check
npm run typecheck

# Start local development server on http://localhost:5173
npm run dev

# Create production build (dist/)
npm run build
```

### 3. Mobile Application (React Native + Expo)
```bash
cd apps/mobile

# Run TypeScript type check
npm run typecheck

# Start Expo development server (on port 8082 or default)
npx expo start
```

---

## Verification & Test Results

- **Backend Automated Tests**: 15 tests executed, **0 failures, 0 errors, 0 skipped**.
  - `TaskSecurityAndLifecycleTest`: Customer scoping (403), atomic claiming conflict (409), invalid state transitions (400), worker unauthorized approval attempt (403), valid acceptance (200).
  - `WalletSecurityTest`: Employee cross-access denial (403), employee own ledger access (200), admin transaction oversight (200).
  - `EmployeeRoleEscalationTest`: Non-admin privilege escalation denial (403), admin role grant (200).
  - `TmsSecurityAndPricingTest`: Sanitized public tracking view (200, totalPrice omitted), unauthenticated shipment access rejection (401), scoped customer shipment list (200).
  - `SecurityConfigTest`: Anonymous access rejection on protected endpoints (401).
  - `HealthControllerTest`: Health endpoint liveness check (200).
- **Web Frontend Build**: `tsc -b` and `vite build` completed with 0 errors.
- **Mobile TypeScript**: `tsc --noEmit` completed with 0 errors.

---

## Documentation Index

- [Implementation Audit & Requirements Traceability Matrix](file:///c:/Users/kteja/OneDrive/Desktop/Chasehorse-EMP/chasehorse/docs/IMPLEMENTATION_AUDIT.md)
- [Implementation Status Report](file:///c:/Users/kteja/OneDrive/Desktop/Chasehorse-EMP/chasehorse/docs/IMPLEMENTATION_STATUS.md)
- [API Contract Specification](file:///c:/Users/kteja/OneDrive/Desktop/Chasehorse-EMP/chasehorse/docs/API_CONTRACT.md)
- [Security Architecture & Checklist](file:///c:/Users/kteja/OneDrive/Desktop/Chasehorse-EMP/chasehorse/docs/SECURITY.md)
- [Web & Mobile Feature Parity Matrix](file:///c:/Users/kteja/OneDrive/Desktop/Chasehorse-EMP/chasehorse/docs/WEB_MOBILE_PARITY.md)
