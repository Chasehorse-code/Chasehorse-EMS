-- Safe default: enable RLS and do not add broad allow-all policies.
-- Until specific policies are reviewed and tested, the Supabase Data API denies access.
-- Backend access must use a dedicated least-privilege DB role and explicit application authorization.
alter table if exists app_profiles enable row level security;
alter table if exists app_role_assignments enable row level security;
alter table if exists tasks enable row level security;
alter table if exists task_evidence enable row level security;
alter table if exists task_approvals enable row level security;
alter table if exists wallet_ledger enable row level security;
alter table if exists audit_events enable row level security;

-- IMPORTANT: Add reviewed SELECT/INSERT/UPDATE policies before exposing any of these
-- tables to browser/mobile clients. Do not grant clients direct write access to wallet_ledger.
-- Keep audit_events and wallet_ledger append-only for application roles.