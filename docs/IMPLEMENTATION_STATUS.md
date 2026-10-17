# ChaseHorse implementation status

Branch: `feat/supabase-backend-foundation`.

## Added in this branch
- Spring Boot 3.4 / Java 21 API foundation.
- Public health endpoint and JWT-protected `GET /api/v1/me`.
- Spring Security OAuth2 resource-server setup for validating Supabase Auth access tokens.
- Server-side PostgreSQL configuration with SSL example and secrets kept out of Git.
- Draft Flyway schema for profiles, role assignments, tasks, evidence, approvals, wallet ledger and audit events.
- Initial RLS-enable migration that defaults to deny until reviewed policies are added.
- Dockerfile and backend CI workflow.
- Expo/React Native app scaffold.
- Supabase/Vite integration notes and API contract documentation.

## Not yet complete or verified
- The application has not connected to the live Supabase database.
- The schema is a draft; inspect existing tables and take a backup before applying it.
- JWT identity validation is implemented as a foundation, but application-role lookup and per-resource authorization are not complete.
- RLS/Storage policies need reviewed, tested policies before production use.
- Task, employee, checklist, evidence, operations approval and wallet API endpoints are not yet implemented.
- The existing admin dashboard still uses mock data; it is not connected to the real API.
- The mobile app is a scaffold screen, not a completed field workflow.
- Frontend/mobile authentication, end-to-end tests, deployment and production hardening remain.
- Build/tests have not been run in this connector-only environment.

This branch is an incremental foundation, not a completed or production-ready application.