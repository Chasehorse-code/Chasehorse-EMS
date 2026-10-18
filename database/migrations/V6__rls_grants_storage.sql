-- V6: Row Level Security, least-privilege grants, private evidence bucket.
--
-- Design: the application schema "app" is not exposed through the Supabase
-- Data API, and the Spring Boot API (privileged DB role) is the only intended
-- client. Even so, every table has RLS enabled, EVERY grant to the Data API
-- roles is revoked, and only four narrow "read my own row" policies are added
-- for a signed-in user. There are NO insert/update/delete policies for anyone:
-- an authenticated user cannot change roles, status, tasks or money by talking
-- to the database directly.
SET search_path = app, public;

-- 1) RLS on every table in the schema ---------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'app' AND tablename <> 'flyway_schema_history' LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 2) Revoke everything from public / Data API roles --------------------------
REVOKE ALL ON SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON FUNCTIONS FROM PUBLIC;

DO $$
DECLARE rn text;
BEGIN
  FOREACH rn IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rn) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA app FROM %I', rn);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app FROM %I', rn);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA app FROM %I', rn);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM %I', rn);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM %I', rn);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON FUNCTIONS FROM %I', rn);
    END IF;
  END LOOP;
END $$;

-- 3) Read-my-own-row policies for signed-in users ----------------------------
-- (Used only if an operator deliberately exposes "app" or builds a view over
--  it; the supplied clients never read these tables directly.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT USAGE ON SCHEMA app TO authenticated;
    GRANT SELECT ON app.profiles, app.user_roles, app.wallet_accounts, app.wallet_ledger_entries TO authenticated;
  END IF;
END $$;

CREATE POLICY profiles_select_own ON app.profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY user_roles_select_own ON app.user_roles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY wallet_accounts_select_own ON app.wallet_accounts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY wallet_ledger_select_own ON app.wallet_ledger_entries
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 4) Private evidence bucket --------------------------------------------------
-- Private, 15 MB limit, images only. We deliberately add NO storage.objects
-- policies for anon/authenticated: with RLS on and no policy, direct client
-- access is denied. The API uses the service key (server-side only) to create
-- short-lived signed upload/download URLs after its own authorization checks.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('task-evidence', 'task-evidence', false, 15728640,
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
    ON CONFLICT (id) DO UPDATE
      SET public = false, file_size_limit = 15728640,
          allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  END IF;
END $$;
