-- V3: tasks, versioned checklists, atomic acceptance, enforced state machine.
SET search_path = app, public;

CREATE TYPE app.task_status AS ENUM (
  'open', 'accepted', 'in_progress', 'submitted', 'rework_requested',
  'manager_approved', 'approved', 'rejected', 'cancelled'
);
CREATE TYPE app.task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE app.checklist_state AS ENUM ('pending', 'done', 'not_applicable');

-- ---------------------------------------------------------------------------
-- Checklist templates: versioned and immutable once written, so editing a
-- template can never silently change a task that is already in flight.
-- ---------------------------------------------------------------------------
CREATE TABLE app.checklist_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(200) NOT NULL,
  category    varchar(80) NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES app.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX checklist_templates_name_uq ON app.checklist_templates (lower(name));

CREATE TABLE app.checklist_template_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  uuid NOT NULL REFERENCES app.checklist_templates(id),
  version      integer NOT NULL CHECK (version >= 1),
  created_by   uuid REFERENCES app.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
CREATE TRIGGER checklist_versions_immutable BEFORE UPDATE OR DELETE ON app.checklist_template_versions
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();

CREATE TABLE app.checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id      uuid NOT NULL REFERENCES app.checklist_template_versions(id),
  position        integer NOT NULL CHECK (position >= 1),
  label           varchar(500) NOT NULL CHECK (length(btrim(label)) > 0),
  required        boolean NOT NULL DEFAULT true,
  requires_photo  boolean NOT NULL DEFAULT false,
  UNIQUE (version_id, position)
);
CREATE TRIGGER checklist_items_immutable BEFORE UPDATE OR DELETE ON app.checklist_items
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();

-- Create a new template version (and the template itself if needed) atomically.
-- p_items: jsonb array of {label, required, requiresPhoto}.
CREATE FUNCTION app.save_checklist_template(p_template uuid, p_name text, p_category text, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_tpl uuid := p_template;
  v_ver integer;
  v_ver_id uuid;
  v_item jsonb;
  v_pos integer := 0;
BEGIN
  IF v_actor IS NULL OR NOT (app.has_active_role(v_actor, 'admin') OR app.has_active_role(v_actor, 'manager')) THEN
    RAISE EXCEPTION 'only administrators or managers may edit checklist templates' USING ERRCODE = 'CH403';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'a checklist needs at least one item' USING ERRCODE = 'CH422';
  END IF;

  IF v_tpl IS NULL THEN
    INSERT INTO app.checklist_templates (name, category, created_by) VALUES (p_name, p_category, v_actor) RETURNING id INTO v_tpl;
  ELSE
    UPDATE app.checklist_templates SET name = p_name, category = p_category WHERE id = v_tpl;
    IF NOT FOUND THEN RAISE EXCEPTION 'template not found' USING ERRCODE = 'CH404'; END IF;
  END IF;

  SELECT coalesce(max(version), 0) + 1 INTO v_ver FROM app.checklist_template_versions WHERE template_id = v_tpl;
  INSERT INTO app.checklist_template_versions (template_id, version, created_by) VALUES (v_tpl, v_ver, v_actor) RETURNING id INTO v_ver_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pos := v_pos + 1;
    INSERT INTO app.checklist_items (version_id, position, label, required, requires_photo)
    VALUES (v_ver_id, v_pos, v_item->>'label',
            coalesce((v_item->>'required')::boolean, true),
            coalesce((v_item->>'requiresPhoto')::boolean, false));
  END LOOP;

  PERFORM app.record_audit('checklist.version_created', 'checklist_template', v_tpl, jsonb_build_object('version', v_ver));
  RETURN v_ver_id;
END $$;

-- ---------------------------------------------------------------------------
-- Tasks
-- Task FIELDS are a PROPOSAL (docs/decisions-pending.md): the blueprint lists
-- candidate fields but the business has not finalised them. Money is stored in
-- paise (integer) to avoid floating-point error.
-- ---------------------------------------------------------------------------
CREATE TABLE app.tasks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_no             bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  title               varchar(200) NOT NULL CHECK (length(btrim(title)) >= 3),
  description         text,
  category            varchar(80) NOT NULL,
  priority            app.task_priority NOT NULL DEFAULT 'normal',
  status              app.task_status NOT NULL DEFAULT 'open',
  customer_org_id     uuid NOT NULL REFERENCES app.organizations(id),
  partner_org_id      uuid REFERENCES app.organizations(id),
  created_by          uuid NOT NULL REFERENCES app.profiles(id),
  address             varchar(500),
  city                varchar(120),
  state               varchar(120),
  postal_code         varchar(16),
  lat                 numeric(9,6) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng                 numeric(9,6) NOT NULL CHECK (lng BETWEEN -180 AND 180),
  completion_radius_m integer NOT NULL DEFAULT 200 CHECK (completion_radius_m BETWEEN 10 AND 5000),
  reward_paise        bigint NOT NULL CHECK (reward_paise >= 0),
  currency            char(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  available_from      timestamptz NOT NULL DEFAULT now(),
  due_at              timestamptz,
  required_skills     text[] NOT NULL DEFAULT '{}',
  checklist_version_id uuid NOT NULL REFERENCES app.checklist_template_versions(id),
  assigned_to         uuid REFERENCES app.profiles(id),
  assigned_by         uuid REFERENCES app.profiles(id),
  accepted_at         timestamptz,
  submission_no       integer NOT NULL DEFAULT 0 CHECK (submission_no >= 0),
  submitted_at        timestamptz,
  version             bigint NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_due_after_available CHECK (due_at IS NULL OR due_at > available_from),
  -- Exclusivity invariant: an open task has nobody; every in-flight task has exactly one assignee.
  CONSTRAINT tasks_assignee_matches_status CHECK (
    (status = 'open' AND assigned_to IS NULL)
    OR (status = 'cancelled')
    OR (status NOT IN ('open', 'cancelled') AND assigned_to IS NOT NULL)
  )
);
CREATE INDEX tasks_status_available_idx ON app.tasks (status, available_from) WHERE status = 'open';
CREATE INDEX tasks_geo_open_idx ON app.tasks (lat, lng) WHERE status = 'open';
CREATE INDEX tasks_assignee_idx ON app.tasks (assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX tasks_customer_idx ON app.tasks (customer_org_id, created_at DESC);
CREATE INDEX tasks_partner_idx ON app.tasks (partner_org_id) WHERE partner_org_id IS NOT NULL;
CREATE TRIGGER tasks_touch BEFORE UPDATE ON app.tasks
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

-- Rejected offers (an employee declining an open task).
CREATE TABLE app.task_rejections (
  task_id     uuid NOT NULL REFERENCES app.tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES app.profiles(id),
  reason      varchar(500),
  rejected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Status history + state machine (database-level safety net; the API also validates)
-- ---------------------------------------------------------------------------
CREATE TABLE app.task_status_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid NOT NULL REFERENCES app.tasks(id) ON DELETE CASCADE,
  from_status  app.task_status,
  to_status    app.task_status NOT NULL,
  actor_id     uuid REFERENCES app.profiles(id),
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX task_status_history_task_idx ON app.task_status_history (task_id, occurred_at);
CREATE TRIGGER task_status_history_append_only BEFORE UPDATE OR DELETE ON app.task_status_history
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();

CREATE FUNCTION app.task_transition_allowed(p_from app.task_status, p_to app.task_status) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT (p_from, p_to) IN (
    ('open','accepted'), ('open','cancelled'),
    ('accepted','in_progress'), ('accepted','open'), ('accepted','cancelled'),
    ('in_progress','submitted'), ('in_progress','open'), ('in_progress','cancelled'),
    ('submitted','manager_approved'), ('submitted','rework_requested'), ('submitted','rejected'), ('submitted','cancelled'),
    ('rework_requested','in_progress'), ('rework_requested','submitted'), ('rework_requested','cancelled'),
    ('manager_approved','approved'), ('manager_approved','rework_requested'), ('manager_approved','rejected')
  )
$$;

CREATE FUNCTION app.enforce_task_transition() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT app.task_transition_allowed(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'illegal task transition % -> %', OLD.status, NEW.status USING ERRCODE = 'CH409';
    END IF;
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tasks_transition BEFORE UPDATE ON app.tasks
  FOR EACH ROW EXECUTE FUNCTION app.enforce_task_transition();

CREATE FUNCTION app.log_task_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO app.task_status_history (task_id, from_status, to_status, actor_id) VALUES (NEW.id, NULL, NEW.status, app.actor_id());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO app.task_status_history (task_id, from_status, to_status, actor_id) VALUES (NEW.id, OLD.status, NEW.status, app.actor_id());
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER tasks_log_status AFTER INSERT OR UPDATE ON app.tasks
  FOR EACH ROW EXECUTE FUNCTION app.log_task_status();

-- ---------------------------------------------------------------------------
-- Task creation
-- Allowed: active admin / manager / operations, or an active customer who is a
-- member of the task's customer organisation.
-- ---------------------------------------------------------------------------
CREATE FUNCTION app.create_task(
  p_title text, p_description text, p_category text, p_priority app.task_priority,
  p_customer_org uuid, p_partner_org uuid,
  p_address text, p_city text, p_state text, p_postal_code text,
  p_lat numeric, p_lng numeric, p_completion_radius_m integer,
  p_reward_paise bigint, p_available_from timestamptz, p_due_at timestamptz,
  p_required_skills text[], p_checklist_version uuid
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_staff boolean;
  v_customer boolean;
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT app.is_active(v_actor) THEN
    RAISE EXCEPTION 'an active account is required' USING ERRCODE = 'CH403';
  END IF;
  v_staff := app.has_role(v_actor, 'admin') OR app.has_role(v_actor, 'manager') OR app.has_role(v_actor, 'operations');
  v_customer := app.has_role(v_actor, 'customer')
                AND EXISTS (SELECT 1 FROM app.org_members WHERE user_id = v_actor AND org_id = p_customer_org);
  IF NOT (v_staff OR v_customer) THEN
    RAISE EXCEPTION 'you are not permitted to create tasks for this organisation' USING ERRCODE = 'CH403';
  END IF;

  INSERT INTO app.tasks (
    title, description, category, priority, customer_org_id, partner_org_id, created_by,
    address, city, state, postal_code, lat, lng, completion_radius_m, reward_paise,
    available_from, due_at, required_skills, checklist_version_id
  ) VALUES (
    p_title, p_description, p_category, coalesce(p_priority, 'normal'), p_customer_org, p_partner_org, v_actor,
    p_address, p_city, p_state, p_postal_code, p_lat, p_lng, coalesce(p_completion_radius_m, 200), p_reward_paise,
    coalesce(p_available_from, now()), p_due_at, coalesce(p_required_skills, '{}'), p_checklist_version
  ) RETURNING id INTO v_id;
  PERFORM app.record_audit('task.created', 'task', v_id, jsonb_build_object('reward_paise', p_reward_paise));
  RETURN v_id;
END $$;

-- ---------------------------------------------------------------------------
-- Discovery & atomic acceptance
-- ---------------------------------------------------------------------------
CREATE FUNCTION app.employee_can_take(p_employee uuid, p_task app.tasks, OUT ok boolean, OUT distance_km double precision, OUT radius_km integer)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_loc app.employee_locations;
  v_emp app.employees;
BEGIN
  ok := false;
  IF NOT app.has_active_role(p_employee, 'employee') THEN RETURN; END IF;
  SELECT * INTO v_emp FROM app.employees WHERE user_id = p_employee;
  IF NOT FOUND THEN RETURN; END IF;
  radius_km := v_emp.search_radius_km;
  IF NOT EXISTS (SELECT 1 FROM app.profiles WHERE id = p_employee AND location_consent_at IS NOT NULL) THEN RETURN; END IF;
  SELECT * INTO v_loc FROM app.employee_locations WHERE user_id = p_employee;
  IF NOT FOUND THEN RETURN; END IF;
  distance_km := app.haversine_km(v_loc.lat, v_loc.lng, p_task.lat, p_task.lng);
  IF distance_km > radius_km THEN RETURN; END IF;
  IF NOT (p_task.required_skills <@ v_emp.skills) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM app.task_rejections WHERE task_id = p_task.id AND user_id = p_employee) THEN RETURN; END IF;
  ok := true;
END $$;

-- Open tasks the calling employee may take: consented location, within radius,
-- skills match, not previously rejected. Bounding box first so the lat/lng
-- index is used; exact haversine second.
CREATE FUNCTION app.nearby_open_tasks(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (task_id uuid, distance_km double precision) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_loc app.employee_locations;
  v_emp app.employees;
  v_dlat numeric;
  v_dlng numeric;
BEGIN
  IF v_actor IS NULL OR NOT app.has_active_role(v_actor, 'employee') THEN
    RAISE EXCEPTION 'an active employee is required' USING ERRCODE = 'CH403';
  END IF;
  SELECT * INTO v_emp FROM app.employees WHERE user_id = v_actor;
  SELECT * INTO v_loc FROM app.employee_locations WHERE user_id = v_actor;
  IF v_emp.user_id IS NULL OR v_loc.user_id IS NULL OR
     NOT EXISTS (SELECT 1 FROM app.profiles WHERE id = v_actor AND location_consent_at IS NOT NULL) THEN
    RETURN;  -- no consented location: nothing is discoverable
  END IF;
  v_dlat := v_emp.search_radius_km / 111.0;
  v_dlng := v_emp.search_radius_km / (111.0 * greatest(cos(radians(v_loc.lat::double precision)), 0.01));

  RETURN QUERY
  SELECT t.id, d.km
  FROM app.tasks t
  CROSS JOIN LATERAL (SELECT app.haversine_km(v_loc.lat, v_loc.lng, t.lat, t.lng) AS km) d
  WHERE t.status = 'open'
    AND t.available_from <= now()
    AND t.lat BETWEEN v_loc.lat - v_dlat AND v_loc.lat + v_dlat
    AND t.lng BETWEEN v_loc.lng - v_dlng AND v_loc.lng + v_dlng
    AND d.km <= v_emp.search_radius_km
    AND t.required_skills <@ v_emp.skills
    AND NOT EXISTS (SELECT 1 FROM app.task_rejections r WHERE r.task_id = t.id AND r.user_id = v_actor)
  ORDER BY d.km, t.created_at
  LIMIT least(greatest(p_limit, 1), 200) OFFSET greatest(p_offset, 0);
END $$;

-- First-accept-wins. The single conditional UPDATE is atomic: two concurrent
-- callers serialise on the row lock and the loser re-evaluates "status='open'"
-- as false and updates zero rows.
CREATE FUNCTION app.accept_task(p_task uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_task app.tasks;
  v_check record;
  v_rows integer;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = 'CH403'; END IF;
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;
  SELECT * INTO v_check FROM app.employee_can_take(v_actor, v_task);
  IF NOT coalesce(v_check.ok, false) THEN
    RAISE EXCEPTION 'you are not eligible for this task' USING ERRCODE = 'CH403';
  END IF;

  UPDATE app.tasks
     SET status = 'accepted', assigned_to = v_actor, assigned_by = v_actor, accepted_at = now()
   WHERE id = p_task AND status = 'open' AND assigned_to IS NULL AND available_from <= now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'task is no longer available' USING ERRCODE = 'CH409';
  END IF;
  PERFORM app.record_audit('task.accepted', 'task', p_task, jsonb_build_object('distance_km', v_check.distance_km));
END $$;

CREATE FUNCTION app.reject_task_offer(p_task uuid, p_reason text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_actor uuid := app.actor_id();
BEGIN
  IF v_actor IS NULL OR NOT app.has_active_role(v_actor, 'employee') THEN
    RAISE EXCEPTION 'an active employee is required' USING ERRCODE = 'CH403';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app.tasks WHERE id = p_task AND status = 'open') THEN
    RAISE EXCEPTION 'task is no longer available' USING ERRCODE = 'CH409';
  END IF;
  INSERT INTO app.task_rejections (task_id, user_id, reason) VALUES (p_task, v_actor, p_reason)
  ON CONFLICT (task_id, user_id) DO NOTHING;
END $$;

-- Staff assignment (manager / operations / admin). Assignee must be an active employee.
CREATE FUNCTION app.assign_task(p_task uuid, p_employee uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_rows integer;
BEGIN
  IF v_actor IS NULL OR NOT (app.has_active_role(v_actor, 'admin') OR app.has_active_role(v_actor, 'manager') OR app.has_active_role(v_actor, 'operations')) THEN
    RAISE EXCEPTION 'you are not permitted to assign tasks' USING ERRCODE = 'CH403';
  END IF;
  IF NOT app.has_active_role(p_employee, 'employee') THEN
    RAISE EXCEPTION 'assignee must be an active, approved employee' USING ERRCODE = 'CH422';
  END IF;
  UPDATE app.tasks SET status = 'accepted', assigned_to = p_employee, assigned_by = v_actor, accepted_at = now()
   WHERE id = p_task AND status = 'open' AND assigned_to IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RAISE EXCEPTION 'task is not open for assignment' USING ERRCODE = 'CH409'; END IF;
  PERFORM app.record_audit('task.assigned', 'task', p_task, jsonb_build_object('employee', p_employee));
END $$;

CREATE FUNCTION app.start_task(p_task uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_rows integer;
BEGIN
  UPDATE app.tasks SET status = 'in_progress'
   WHERE id = p_task AND assigned_to = v_actor AND status IN ('accepted', 'rework_requested');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RAISE EXCEPTION 'task cannot be started by you in its current state' USING ERRCODE = 'CH409'; END IF;
END $$;

CREATE FUNCTION app.cancel_task(p_task uuid, p_reason text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_rows integer;
BEGIN
  IF v_actor IS NULL OR NOT (app.has_active_role(v_actor, 'admin') OR app.has_active_role(v_actor, 'manager') OR app.has_active_role(v_actor, 'operations')) THEN
    RAISE EXCEPTION 'you are not permitted to cancel tasks' USING ERRCODE = 'CH403';
  END IF;
  IF length(btrim(coalesce(p_reason, ''))) < 3 THEN RAISE EXCEPTION 'a cancellation reason is required' USING ERRCODE = 'CH422'; END IF;
  UPDATE app.tasks SET status = 'cancelled' WHERE id = p_task AND status IN ('open','accepted','in_progress','submitted','rework_requested');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RAISE EXCEPTION 'task cannot be cancelled in its current state' USING ERRCODE = 'CH409'; END IF;
  PERFORM app.record_audit('task.cancelled', 'task', p_task, jsonb_build_object('reason', p_reason));
END $$;

-- ---------------------------------------------------------------------------
-- Checklist responses
-- ---------------------------------------------------------------------------
CREATE TABLE app.checklist_responses (
  task_id       uuid NOT NULL REFERENCES app.tasks(id) ON DELETE CASCADE,
  item_id       uuid NOT NULL REFERENCES app.checklist_items(id),
  state         app.checklist_state NOT NULL DEFAULT 'pending',
  note          varchar(1000),
  na_reason     varchar(500),
  responded_by  uuid NOT NULL REFERENCES app.profiles(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, item_id),
  CONSTRAINT checklist_na_needs_reason CHECK (state <> 'not_applicable' OR length(btrim(coalesce(na_reason, ''))) >= 3)
);

CREATE FUNCTION app.save_checklist_response(p_task uuid, p_item uuid, p_state app.checklist_state, p_note text, p_na_reason text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_task app.tasks;
  v_item app.checklist_items;
BEGIN
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;
  IF v_actor IS NULL OR v_task.assigned_to IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'only the assigned employee may update the checklist' USING ERRCODE = 'CH403';
  END IF;
  IF v_task.status NOT IN ('in_progress', 'rework_requested') THEN
    RAISE EXCEPTION 'checklist is locked in status %', v_task.status USING ERRCODE = 'CH409';
  END IF;
  SELECT * INTO v_item FROM app.checklist_items WHERE id = p_item AND version_id = v_task.checklist_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'item does not belong to this task checklist' USING ERRCODE = 'CH422'; END IF;
  IF p_state = 'not_applicable' AND v_item.required THEN
    RAISE EXCEPTION 'a required item cannot be marked not applicable' USING ERRCODE = 'CH422';
  END IF;

  INSERT INTO app.checklist_responses (task_id, item_id, state, note, na_reason, responded_by)
  VALUES (p_task, p_item, p_state, p_note, p_na_reason, v_actor)
  ON CONFLICT (task_id, item_id) DO UPDATE
    SET state = EXCLUDED.state, note = EXCLUDED.note, na_reason = EXCLUDED.na_reason,
        responded_by = EXCLUDED.responded_by, updated_at = now();
END $$;
