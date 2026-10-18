-- V2: identity foundation on top of Supabase Auth.
--
-- Ownership model: Flyway owns everything in schema "app" (created below and
-- used as Flyway's default schema + history table schema). The "app" schema is
-- NOT exposed through the Supabase Data API; the Spring Boot API is the only
-- intended client. RLS + revoked grants are still applied as defence in depth.
--
-- Requires: schema "auth" with table auth.users and function auth.uid()
-- (provided by Supabase; database/dev/supabase_stub.sql provides a stand-in
-- for local development and tests).

CREATE SCHEMA IF NOT EXISTS app;
SET search_path = app, public;

-- ---------------------------------------------------------------------------
-- Safely retire the V1 placeholder tables.
-- They never held a real design (no link to Supabase Auth). We only drop them
-- if every one of them is EMPTY; otherwise the migration stops so a human can
-- migrate the data deliberately. No data is ever dropped silently.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  n bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY['audit_logs','account_approvals','user_roles','roles','users'] LOOP
    IF to_regclass(format('app.%I', t)) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM app.%I', t) INTO n;
      IF n > 0 THEN
        RAISE EXCEPTION 'V2 refuses to replace app.% because it contains % rows. Migrate that data manually first.', t, n;
      END IF;
    END IF;
  END LOOP;
  DROP TABLE IF EXISTS app.audit_logs, app.account_approvals, app.user_roles, app.roles, app.users;
END $$;

-- If V1 was ever applied to "public" (e.g. by hand), lock those tables down so
-- they are not readable through the Data API. We never drop data in "public".
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['audit_logs','account_approvals','user_roles','roles','users'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
CREATE TYPE app.app_role AS ENUM ('admin', 'manager', 'operations', 'employee', 'customer', 'partner');
CREATE TYPE app.account_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE app.org_kind AS ENUM ('internal', 'customer', 'partner');

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------

-- Who is acting? Direct JWT sessions have auth.uid(); the Spring API (which
-- connects as a privileged DB user) sets app.actor_id per transaction from the
-- VERIFIED JWT subject. Never set this from request data.
CREATE FUNCTION app.actor_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT coalesce(auth.uid(), nullif(current_setting('app.actor_id', true), '')::uuid)
$$;

CREATE FUNCTION app.is_bootstrap() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.bootstrap', true), '') = 'on'
$$;

CREATE FUNCTION app.forbid_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% on % is not allowed: table is append-only', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'CH403';
END $$;

CREATE FUNCTION app.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
CREATE TABLE app.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email                 varchar(320) NOT NULL,
  display_name          varchar(200),
  phone                 varchar(32),
  account_status        app.account_status NOT NULL DEFAULT 'pending',
  location_consent_at   timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_email_lower_uq ON app.profiles (lower(email));
CREATE INDEX profiles_status_idx ON app.profiles (account_status);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON app.profiles
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

CREATE TABLE app.user_roles (
  user_id     uuid NOT NULL REFERENCES app.profiles(id) ON DELETE RESTRICT,
  role        app.app_role NOT NULL,
  granted_by  uuid REFERENCES app.profiles(id),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
CREATE INDEX user_roles_role_idx ON app.user_roles (role);

CREATE FUNCTION app.has_role(p_user uuid, p_role app.app_role) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM app.user_roles WHERE user_id = p_user AND role = p_role)
$$;

CREATE FUNCTION app.is_active(p_user uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM app.profiles WHERE id = p_user AND account_status = 'active')
$$;

CREATE FUNCTION app.has_active_role(p_user uuid, p_role app.app_role) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.is_active(p_user) AND app.has_role(p_user, p_role)
$$;

-- Privilege-escalation guard. Rules enforced in the database itself:
--  * A user may create their OWN 'employee' role row (self-registration only);
--    that grants nothing until an approver activates the account.
--  * Every other grant/revoke requires an ACTIVE administrator.
--  * 'manager' (and every non-employee role) can therefore only come from an admin.
--  * Rows are immutable once written.
--  * A one-off bootstrap (first admin) needs the explicit session flag
--    app.bootstrap = 'on', set by a DB owner via SQL (see docs/setup.md).
CREATE FUNCTION app.guard_role_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'user_roles rows are immutable; revoke and re-grant instead' USING ERRCODE = 'CH403';
  END IF;

  IF app.is_bootstrap() THEN
    IF TG_OP = 'INSERT' THEN RETURN NEW; ELSE RETURN OLD; END IF;
  END IF;

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'role changes require an authenticated actor' USING ERRCODE = 'CH403';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'employee' AND NEW.user_id = v_actor THEN
      NEW.granted_by := v_actor;
      RETURN NEW;
    END IF;
    IF NOT app.has_active_role(v_actor, 'admin') THEN
      RAISE EXCEPTION 'only an active administrator may grant role %', NEW.role USING ERRCODE = 'CH403';
    END IF;
    NEW.granted_by := v_actor;
    RETURN NEW;
  END IF;

  -- DELETE
  IF NOT app.has_active_role(v_actor, 'admin') THEN
    RAISE EXCEPTION 'only an active administrator may revoke roles' USING ERRCODE = 'CH403';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER user_roles_guard BEFORE INSERT OR UPDATE OR DELETE ON app.user_roles
  FOR EACH ROW EXECUTE FUNCTION app.guard_role_change();

-- Account status can only change through a real, non-self actor (or bootstrap).
CREATE FUNCTION app.guard_account_status() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status AND NOT app.is_bootstrap() THEN
    IF v_actor IS NULL THEN
      RAISE EXCEPTION 'account status changes require an authenticated actor' USING ERRCODE = 'CH403';
    END IF;
    IF v_actor = NEW.id THEN
      RAISE EXCEPTION 'users cannot change their own account status' USING ERRCODE = 'CH403';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_status_guard BEFORE UPDATE ON app.profiles
  FOR EACH ROW EXECUTE FUNCTION app.guard_account_status();

-- ---------------------------------------------------------------------------
-- Audit trail (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE app.audit_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid REFERENCES app.profiles(id),
  action       varchar(120) NOT NULL,
  entity_type  varchar(80) NOT NULL,
  entity_id    uuid,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_entity_idx ON app.audit_events (entity_type, entity_id, occurred_at DESC);
CREATE INDEX audit_events_actor_idx ON app.audit_events (actor_id, occurred_at DESC);
CREATE TRIGGER audit_events_no_update BEFORE UPDATE OR DELETE ON app.audit_events
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();
CREATE TRIGGER audit_events_no_truncate BEFORE TRUNCATE ON app.audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION app.forbid_mutation();

CREATE FUNCTION app.record_audit(p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO app.audit_events (actor_id, action, entity_type, entity_id, metadata)
  VALUES (app.actor_id(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Audit every role grant/revoke automatically.
CREATE FUNCTION app.audit_role_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM app.record_audit('role.granted', 'user', NEW.user_id, jsonb_build_object('role', NEW.role));
    RETURN NEW;
  END IF;
  PERFORM app.record_audit('role.revoked', 'user', OLD.user_id, jsonb_build_object('role', OLD.role));
  RETURN OLD;
END $$;
CREATE TRIGGER user_roles_audit AFTER INSERT OR DELETE ON app.user_roles
  FOR EACH ROW EXECUTE FUNCTION app.audit_role_change();

-- ---------------------------------------------------------------------------
-- Account approval decisions
-- ---------------------------------------------------------------------------
CREATE TABLE app.account_approvals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app.profiles(id),
  decision    varchar(16) NOT NULL CHECK (decision IN ('approved','rejected','suspended','reactivated')),
  decided_by  uuid NOT NULL REFERENCES app.profiles(id),
  reason      varchar(1000),
  decided_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT approvals_reason_required CHECK (decision IN ('approved','reactivated') OR length(btrim(coalesce(reason,''))) >= 3),
  CONSTRAINT approvals_not_self CHECK (user_id <> decided_by)
);
CREATE INDEX account_approvals_user_idx ON app.account_approvals (user_id, decided_at DESC);
CREATE TRIGGER account_approvals_no_update BEFORE UPDATE OR DELETE ON app.account_approvals
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();

-- Approve / reject / suspend / reactivate an account.
--  * Managers may decide on EMPLOYEE accounts only.
--  * Only admins may decide on accounts holding any other role (manager, ops,
--    customer, partner, admin).
--  * Nobody can decide on their own account.
CREATE FUNCTION app.decide_account(p_user uuid, p_decision text, p_reason text DEFAULT NULL)
RETURNS app.account_status LANGUAGE plpgsql AS $$
DECLARE
  v_actor  uuid := app.actor_id();
  v_status app.account_status;
  v_new    app.account_status;
  v_is_admin boolean;
  v_non_employee boolean;
BEGIN
  IF v_actor IS NULL OR NOT app.is_active(v_actor) THEN
    RAISE EXCEPTION 'an active approver is required' USING ERRCODE = 'CH403';
  END IF;
  IF v_actor = p_user THEN
    RAISE EXCEPTION 'you cannot decide on your own account' USING ERRCODE = 'CH403';
  END IF;

  v_is_admin := app.has_role(v_actor, 'admin');
  IF NOT (v_is_admin OR app.has_role(v_actor, 'manager')) THEN
    RAISE EXCEPTION 'only administrators or managers may decide on accounts' USING ERRCODE = 'CH403';
  END IF;

  SELECT account_status INTO v_status FROM app.profiles WHERE id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'account not found' USING ERRCODE = 'CH404';
  END IF;

  SELECT EXISTS (SELECT 1 FROM app.user_roles WHERE user_id = p_user AND role <> 'employee') INTO v_non_employee;
  IF v_non_employee AND NOT v_is_admin THEN
    RAISE EXCEPTION 'only an administrator may decide on non-employee accounts' USING ERRCODE = 'CH403';
  END IF;

  IF p_decision = 'approved'    AND v_status = 'pending'   THEN v_new := 'active';
  ELSIF p_decision = 'rejected' AND v_status = 'pending'   THEN v_new := 'rejected';
  ELSIF p_decision = 'suspended' AND v_status = 'active'   THEN v_new := 'suspended';
  ELSIF p_decision = 'reactivated' AND v_status = 'suspended' THEN v_new := 'active';
  ELSE
    RAISE EXCEPTION 'decision % is not valid for an account in status %', p_decision, v_status USING ERRCODE = 'CH409';
  END IF;

  UPDATE app.profiles SET account_status = v_new WHERE id = p_user;
  INSERT INTO app.account_approvals (user_id, decision, decided_by, reason)
  VALUES (p_user, p_decision, v_actor, p_reason);
  PERFORM app.record_audit('account.' || p_decision, 'user', p_user, jsonb_build_object('from', v_status, 'to', v_new));
  RETURN v_new;
END $$;

-- ---------------------------------------------------------------------------
-- Organizations (customers / partners / internal) and employee details
-- ---------------------------------------------------------------------------
CREATE TABLE app.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(200) NOT NULL,
  kind        app.org_kind NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organizations_name_kind_uq ON app.organizations (lower(name), kind);

CREATE TABLE app.org_members (
  org_id   uuid NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES app.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX org_members_user_idx ON app.org_members (user_id);

CREATE TABLE app.employees (
  user_id          uuid PRIMARY KEY REFERENCES app.profiles(id) ON DELETE CASCADE,
  region           varchar(120),
  skills           text[] NOT NULL DEFAULT '{}',
  -- Business concept: nearby discovery within ~50-100 km. Exact default and
  -- limits are PENDING CONFIRMATION; these are proposals enforced here.
  search_radius_km integer NOT NULL DEFAULT 50 CHECK (search_radius_km BETWEEN 1 AND 100),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Only the LATEST consented location is kept (data minimisation). Retention
-- and history rules are a pending business/privacy decision.
CREATE TABLE app.employee_locations (
  user_id      uuid PRIMARY KEY REFERENCES app.profiles(id) ON DELETE CASCADE,
  lat          numeric(9,6) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng          numeric(9,6) NOT NULL CHECK (lng BETWEEN -180 AND 180),
  accuracy_m   numeric(8,2) CHECK (accuracy_m IS NULL OR accuracy_m >= 0),
  captured_at  timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX employee_locations_geo_idx ON app.employee_locations (lat, lng);

CREATE FUNCTION app.set_location_consent(p_consent boolean) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_actor uuid := app.actor_id();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = 'CH403'; END IF;
  UPDATE app.profiles SET location_consent_at = CASE WHEN p_consent THEN now() ELSE NULL END WHERE id = v_actor;
  IF NOT p_consent THEN
    DELETE FROM app.employee_locations WHERE user_id = v_actor;  -- withdrawing consent erases the stored location
  END IF;
  PERFORM app.record_audit(CASE WHEN p_consent THEN 'location.consent_given' ELSE 'location.consent_withdrawn' END, 'user', v_actor);
END $$;

CREATE FUNCTION app.update_my_location(p_lat numeric, p_lng numeric, p_accuracy numeric, p_captured_at timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_actor uuid := app.actor_id();
BEGIN
  IF v_actor IS NULL OR NOT app.has_active_role(v_actor, 'employee') THEN
    RAISE EXCEPTION 'an active employee is required' USING ERRCODE = 'CH403';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app.profiles WHERE id = v_actor AND location_consent_at IS NOT NULL) THEN
    RAISE EXCEPTION 'location consent has not been given' USING ERRCODE = 'CH403';
  END IF;
  INSERT INTO app.employee_locations (user_id, lat, lng, accuracy_m, captured_at)
  VALUES (v_actor, p_lat, p_lng, p_accuracy, coalesce(p_captured_at, now()))
  ON CONFLICT (user_id) DO UPDATE
    SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, accuracy_m = EXCLUDED.accuracy_m,
        captured_at = EXCLUDED.captured_at, updated_at = now();
END $$;

-- Great-circle distance in km.
CREATE FUNCTION app.haversine_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS double precision LANGUAGE sql IMMUTABLE AS $$
  SELECT 2 * 6371 * asin(sqrt(
    power(sin(radians((lat2 - lat1)::double precision) / 2), 2) +
    cos(radians(lat1::double precision)) * cos(radians(lat2::double precision)) *
    power(sin(radians((lng2 - lng1)::double precision) / 2), 2)))
$$;

-- Self-registration: create my pending profile (+ employee role + employee row).
-- Customers and partners are provisioned by an administrator, not self-service.
CREATE FUNCTION app.register_employee(p_email text, p_display_name text, p_phone text, p_region text)
RETURNS app.account_status LANGUAGE plpgsql AS $$
DECLARE v_actor uuid := app.actor_id();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = 'CH403'; END IF;
  IF EXISTS (SELECT 1 FROM app.profiles WHERE id = v_actor) THEN
    RAISE EXCEPTION 'already registered' USING ERRCODE = 'CH409';
  END IF;
  INSERT INTO app.profiles (id, email, display_name, phone) VALUES (v_actor, p_email, p_display_name, p_phone);
  INSERT INTO app.user_roles (user_id, role) VALUES (v_actor, 'employee');  -- guard allows self 'employee' only
  INSERT INTO app.employees (user_id, region) VALUES (v_actor, p_region);
  PERFORM app.record_audit('employee.registered', 'user', v_actor);
  RETURN 'pending';
END $$;
