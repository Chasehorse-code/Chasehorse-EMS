# CHASEHORSE — WEB & MOBILE FEATURE PARITY MATRIX

**Platform Version:** 1.0.0-PROD  
**Document Status:** Complete Architecture & Verification Standard  
**Last Updated:** October 2026  

---

## 1. Executive Summary

ChaseHorse is an enterprise-grade workforce orchestration and logistics ERP operating across Web (React 18 + Vite) and Mobile (React Native + Expo). To guarantee operational continuity and security in the field, every business feature on the web portal must maintain an identical, native-adapted counterpart on the mobile application.

Both platforms share:
- Identical domain entities, role permissions, and validation rules.
- A unified Spring Boot `/api/v1/*` backend contract with Supabase Auth JWT identity verification.
- Offline-resilient client registries (`accountRegistry`, `taskRegistry`) ensuring continuous operations when remote connectivity is constrained.
- Consistent branding: Deep Navy (`#0B192C`, `#07101F`), Enterprise Blue (`#1D4ED8`, `#38BDF8`), Emerald Success (`#10B981`), Amber Warning (`#F59E0B`), and AI Indigo (`#8B5CF6`).

---

## 2. Comprehensive Feature-Parity Matrix

| # | Business Capability | Web Status | Mobile Status | Backend API Dependency | Auth & Role Requirements | Acceptance Criteria |
|---|---|---|---|---|---|---|
| **1** | **Branding & Visual Identity** | ✅ Implemented | ✅ Implemented | Static / Assets | Public | Silhouette stallion logo, navy/blue theme, typography, dark/light surfaces. |
| **2** | **Unified Authentication & Session** | ✅ Implemented | ✅ Implemented | `POST /auth/login`, `POST /auth/verify-otp` | Public (Unauthenticated) | Email/password sign-in, email OTP for field employees, session persistence, secure logout. |
| **3** | **Dual Registration (Employee/Customer)** | ✅ Implemented | ✅ Implemented | `POST /registrations` | Public | Separate employee (pending approval) and customer registration with GPS auto-extraction. |
| **4** | **Pending Approval Quarantine** | ✅ Implemented | ✅ Implemented | `GET /me`, `GET /approvals/accounts` | Authenticated `PENDING` | Newly registered employees cannot access tasks or wallet until approved by Manager. |
| **5** | **Customer Operations Dashboard** | ✅ Implemented | ✅ Implemented | `GET /dashboard/stats`, `GET /tasks` | `CUSTOMER`, `ADMIN` | Welcome banner, 5 KPI cards, status donut/breakdown, recent activity, recent tasks table/list. |
| **6** | **5-Step Create Task Wizard** | ✅ Implemented | ✅ Implemented | `POST /tasks` | `CUSTOMER`, `ADMIN` | Details, Location & Geofence, Reward & Eligibility, Checklist, Review & Submit with server ID. |
| **7** | **Task Details & Lifecycle Timeline** | ✅ Implemented | ✅ Implemented | `GET /tasks/{id}` | Role-authorized | 5-stage track: `Created` → `Assigned` → `In Progress` → `Evidence Submitted` → `Approved`. |
| **8** | **Nearby Tasks Discovery & GPS Filter** | ✅ Implemented | ✅ Implemented | `GET /tasks/nearby` | `EMPLOYEE` | Radius filter (5km, 10km, 25km), real-time distance sorting, payout badge, priority tags. |
| **9** | **Atomic Task Acceptance** | ✅ Implemented | ✅ Implemented | `POST /tasks/{id}/assignment` | `EMPLOYEE` | Locks assignment, transitions task to `IN_PROGRESS`, adds to active execution queue. |
| **10** | **Interactive Field Checklist** | ✅ Implemented | ✅ Implemented | `GET /tasks/{id}/checklist` | `EMPLOYEE` | Progress counter (e.g. 3/4), required item gating, photo-required requirement indicators. |
| **11** | **Geo-Tagged Camera & Stamping HUD** | ✅ Implemented | ✅ Implemented | Device Camera & GPS APIs | `EMPLOYEE` | Viewfinder HUD, real-time GPS coordinate, timestamp, and address watermark overlay. |
| **12** | **AI Verification & Evidence Review** | ✅ Implemented | ✅ Implemented | `POST /tasks/{id}/evidence`, Gemini AI | `MANAGER`, `EMPLOYEE` (Read-only) | Gemini AI confidence score, compliance reasons, exception flag for manager review. |
| **13** | **Operations Manager Approval Queue** | ✅ Implemented | ✅ Implemented | `GET /manager/review-queue`, `POST /tasks/{id}/approve` | `MANAGER`, `ADMIN` | Evidence review, AI checks, `Approve` (triggers wallet credit), `Request Rework`, `Reject`. |
| **14** | **Employee Account Approvals** | ✅ Implemented | ✅ Implemented | `GET /approvals/accounts`, `POST /approvals/{id}/decision` | `MANAGER`, `ADMIN` | List pending employee registrations, view details, approve or reject account access. |
| **15** | **In-App Wallet & Transaction Ledger** | ✅ Implemented | ✅ Implemented | `GET /wallet`, `GET /wallet/transactions` | `EMPLOYEE` | Verified balance, pending reward tracking, immutable transaction ledger. |
| **16** | **Shipment Consignment Tracking** | ✅ Implemented | ✅ Implemented | `GET /tracking/{id}` | All Authenticated | Search tracking reference, visual milestone progression, fleet vehicle telemetry. |
| **17** | **Logistics Fleet Plans & Truck Booking** | ✅ Implemented | ✅ Implemented | `GET /fleet/plans`, `POST /fleet/bookings` | `CUSTOMER`, `ADMIN` | Mini Truck, 14ft Open, 20ft Container, 32ft Multi-Axle plans with rates and instant booking. |
| **18** | **Profile & Organization Credentials** | ✅ Implemented | ✅ Implemented | `GET /me`, `PUT /profile` | All Roles | GSTIN verification, contact person, phone, region cluster, theme toggle, logout. |
| **19** | **Customer Support & Help Desk** | ✅ Implemented | ✅ Implemented | `POST /support/tickets` | All Roles | 24/7 hotline helpline, priority ticket creation with subject and message. |
| **20** | **Offline Resilience & Failure States** | ✅ Implemented | ✅ Implemented | Client Registries (`taskRegistry`, `accountRegistry`) | All Roles | Graceful fallback when backend is unreachable, no crashing, nonblocking error toasts. |

---

## 3. Platform Architecture & Separation of Concerns

### Shared Business Core
- **Types & Enums**: `Task`, `TaskStatus`, `TaskPriority`, `Employee`, `Customer`, `WalletAccount`, `GeotagMetadata`.
- **API Contract**: Spring Boot `/api/v1/*` specification with matching query parameters and request payloads.
- **Client Persistence**: Local storage fallbacks ensuring full functionality when the Spring Boot backend is in offline development mode.

### Platform-Specific UI Implementation
- **Web (React DOM + Vanilla CSS)**: Desktop data tables, sidebar navigation, multi-column grid dashboard, modal overlays, SVG donut charts.
- **Mobile (React Native + Expo)**: Native bottom tab navigation, touch-optimized card stacks, native camera HUD, pull-to-refresh, keyboard-avoiding views.

---

## 4. Verification and Acceptance Standards
1. **TypeScript Checks**: Both `chasehorse` (web) and `apps/mobile` (mobile) must pass `tsc --noEmit` with zero errors.
2. **Production Bundle**: Web builds via `npm run build`; Mobile web/native bundle builds via `expo start`.
3. **Security Standards**: No client-side role elevation; token verification; server-side ownership enforcement.
