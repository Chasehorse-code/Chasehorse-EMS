# ChaseHorse implementation status

This branch is the safe implementation branch for the full ChaseHorse application. The existing admin dashboard branch remains unchanged.

## Current repository baseline
- Admin frontend: React + TypeScript + Vite prototype.
- Current dashboard data is mock/in-memory; authentication and backend calls are not implemented yet.
- Supabase configuration and Spring Boot backend must be integrated and tested before describing the app as connected.

## Security requirements
- Configure database credentials only as server-side environment secrets.
- Do not commit database passwords, Supabase secret/service-role keys, access tokens, or real `.env` files.
- Use the Supabase publishable key only for permitted client-side use; enforce business authorization in Spring Boot and database policies.
- Inspect the existing Supabase schema and back it up before applying migrations.

## Implementation sequence
1. Spring Boot API and secure configuration.
2. Supabase PostgreSQL schema/migrations, RLS and storage policies.
3. Supabase Auth JWT verification and server-side role checks.
4. Connect dashboard API client to the backend.
5. Task, evidence, approvals and immutable wallet ledger workflows.
6. React Native Expo app, tests and deployment pipeline.

This status file does not claim that live Supabase connectivity or production readiness has been verified.