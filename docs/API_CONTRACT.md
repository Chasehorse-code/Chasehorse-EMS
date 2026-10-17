# API contract (initial)

Base path: `/api/v1`

## Available now
- `GET /health` — public liveness response.
- `GET /me` — requires a valid Supabase Auth access token; returns verified token subject and issuer.

## Authentication
Send the Supabase access token as `Authorization: Bearer <access-token>`. Spring Security validates JWT issuer/signature through the configured Supabase issuer metadata. A valid token establishes identity only; it does not grant administrator, manager, operations or employee privileges.

## Planned endpoints
- Dashboard: `GET /dashboard/stats`
- Employees: `GET /employees`, `PATCH /employees/{id}/approval`
- Tasks: `GET /tasks`, `POST /tasks`, `POST /tasks/{id}/assignment`
- Checklists: `GET /checklist-templates`, `PUT /checklist-templates/{id}`
- Evidence: `GET /evidence`, `POST /evidence`, `POST /evidence/{id}/manager-decision`
- Operations: `GET /approvals`, `POST /approvals/{id}/decision`
- Wallet: `GET /wallets`, `GET /wallets/{employeeId}/transactions`

Planned endpoints must not be treated as implemented until controllers, authorization, persistence and tests exist. All writes must validate role and resource ownership server-side.