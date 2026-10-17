# ChaseHorse implementation status

Branch: `feat/supabase-backend-foundation`.

## Added in this branch
- Spring Boot 3.4 / Java 21 API foundation.
- Public health endpoint and JWT-protected `GET /api/v1/me`.
- Supabase JWT resource-server validation foundation.
- Database-backed role checks for initial task endpoints.
- `GET /api/v1/tasks` for ADMIN/MANAGER/OPERATIONS and `POST /api/v1/tasks` for ADMIN/CUSTOMER.
- Server-side PostgreSQL configuration with SSL example and secrets kept out of Git.
- Draft Flyway schema for profiles, role assignments, tasks, evidence, approvals, wallet ledger and audit events.
- RLS-enable migration with deny-by-default until reviewed policies are added.
- Dockerfile, backend CI workflow, Expo/React Native scaffold, mobile API helper, API contract and security checklist.

## Not yet complete or verified
- The application has not connected to the live Supabase database.
- The schema is a draft; inspect existing tables and take a backup before applying it.
- Authenticated users must be provisioned in `app_profiles` and assigned roles through a trusted process before task endpoints work.
- RLS/Storage policies need reviewed, tested policies before production use.
- Employee, checklist, assignment, evidence, operations approval and wallet API endpoints are not yet implemented.
- The existing admin dashboard still uses mock data; it is not connected to the real API.
- The mobile app is a scaffold screen, not a completed field workflow.
- Frontend/mobile sign-in and session handling, end-to-end tests, deployment and production hardening remain.

CI has passed for an earlier backend foundation commit; the newest task endpoint changes still need their workflow result. Do not call this application complete or production-ready yet.