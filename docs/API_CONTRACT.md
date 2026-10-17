# API contract (initial)

Base path: `/api/v1`

## Implemented endpoints
- `GET /health` — public liveness response.
- `GET /me` — requires a valid Supabase Auth access token; returns verified token subject and issuer.
- `GET /tasks` — requires a database role of ADMIN, MANAGER or OPERATIONS; returns up to 500 newest tasks.
- `POST /tasks` — requires a database role of ADMIN or CUSTOMER; creates an OPEN task and defaults reward to zero if omitted.

## Authentication and authorization
Send the Supabase access token as `Authorization: Bearer <access-token>`. Spring Security validates the JWT issuer/signature using the configured Supabase Auth issuer. A valid token establishes identity only. Business authorization reads role assignments from `app_role_assignments`; no role should be trusted from frontend state or an arbitrary JWT profile field.

Before task endpoints work, the authenticated user must have a matching `app_profiles` row and a trusted role assignment. The API uses the database to authorize roles. Database connection credentials must use a dedicated least-privilege application role.

## Planned endpoints
- Dashboard: `GET /dashboard/stats`
- Employees: `GET /employees`, `PATCH /employees/{id}/approval`
- Task assignment and discovery: `POST /tasks/{id}/assignment`, nearby task queries
- Checklists: `GET /checklist-templates`, `PUT /checklist-templates/{id}`
- Evidence: `GET /evidence`, `POST /evidence`, `POST /evidence/{id}/manager-decision`
- Operations: `GET /approvals`, `POST /approvals/{id}/decision`
- Wallet: `GET /wallets`, `GET /wallets/{employeeId}/transactions`

Planned endpoints are not implemented yet. All writes must validate role and resource ownership server-side.