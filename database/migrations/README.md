# Database migrations

The initial schema draft is at `backend/erp-api/src/main/resources/db/migration/V1__initial_schema.sql`.

Before enabling Flyway against the live Supabase project:
1. Inspect existing tables and schema.
2. Take a backup.
3. Reconcile migrations with existing objects.
4. Configure a dedicated least-privilege application database role, not the postgres superuser.
5. Test migrations against a staging database first.

RLS policies and grants must be implemented and tested before exposing application tables through the Supabase Data API. Do not enable permissive policies as a shortcut.