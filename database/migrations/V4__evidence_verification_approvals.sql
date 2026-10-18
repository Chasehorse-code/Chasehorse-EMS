-- V4: evidence metadata, AI verification (advisory), human approvals, submission.
SET search_path = app, public;

CREATE TYPE app.evidence_status AS ENUM ('pending_upload', 'uploaded', 'rejected');
CREATE TYPE app.ai_status AS ENUM ('pending', 'completed', 'failed', 'manual_review_required');
CREATE TYPE app.ai_recommendation AS ENUM ('looks_consistent', 'needs_review', 'issues_found');
CREATE TYPE app.review_stage AS ENUM ('manager', 'operations');
CREATE TYPE app.review_decision AS ENUM ('approved', 'rejected', 'rework_requested');

-- ---------------------------------------------------------------------------
-- Evidence. The file itself lives in the PRIVATE storage bucket "task-evidence";
-- this table holds metadata only. Client-reported time/GPS are stored as
-- CLAIMS (claimed_*) and are never treated as proof; server_received_at is
-- authoritative.
-- ---------------------------------------------------------------------------
CREATE TABLE app.task_evidence (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           uuid NOT NULL REFERENCES app.tasks(id),
  checklist_item_id uuid REFERENCES app.checklist_items(id),
  uploaded_by       uuid NOT NULL REFERENCES app.profiles(id),
  submission_no     integer NOT NULL CHECK (submission_no >= 1),
  storage_bucket    varchar(63) NOT NULL DEFAULT 'task-evidence' CHECK (storage_bucket = 'task-evidence'),
  storage_path      varchar(500) NOT NULL UNIQUE CHECK (storage_path !~ '(^/|\.\.)'),
  mime_type         varchar(64) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic')),
  size_bytes        bigint CHECK (size_bytes IS NULL OR size_bytes BETWEEN 1 AND 15728640),
  sha256            char(64) CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  status            app.evidence_status NOT NULL DEFAULT 'pending_upload',
  claimed_captured_at timestamptz,
  claimed_lat       numeric(9,6) CHECK (claimed_lat IS NULL OR claimed_lat BETWEEN -90 AND 90),
  claimed_lng       numeric(9,6) CHECK (claimed_lng IS NULL OR claimed_lng BETWEEN -180 AND 180),
  claimed_accuracy_m numeric(8,2) CHECK (claimed_accuracy_m IS NULL OR claimed_accuracy_m >= 0),
  distance_to_task_m integer,                    -- computed server-side when location is present
  server_received_at timestamptz NOT NULL DEFAULT now(),
  uploaded_at       timestamptz,
  CONSTRAINT evidence_uploaded_needs_facts CHECK (status <> 'uploaded' OR (size_bytes IS NOT NULL AND sha256 IS NOT NULL AND uploaded_at IS NOT NULL))
);
CREATE INDEX task_evidence_task_idx ON app.task_evidence (task_id, submission_no);
CREATE INDEX task_evidence_sha_idx ON app.task_evidence (sha256) WHERE sha256 IS NOT NULL;   -- duplicate-image lookup
CREATE UNIQUE INDEX task_evidence_task_sha_uq ON app.task_evidence (task_id, sha256) WHERE sha256 IS NOT NULL AND status <> 'rejected';

-- Reserve a metadata row + storage path BEFORE the client uploads. The path is
-- generated here from server-known ids, never from client input.
CREATE FUNCTION app.begin_evidence_upload(p_task uuid, p_item uuid, p_mime text,
                                          p_claimed_at timestamptz, p_lat numeric, p_lng numeric, p_accuracy numeric)
RETURNS TABLE (evidence_id uuid, storage_path text) LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_task app.tasks;
  v_id uuid := gen_random_uuid();
  v_ext text;
  v_dist integer;
  v_cycle integer;
BEGIN
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;
  IF v_actor IS NULL OR v_task.assigned_to IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'only the assigned employee may upload evidence' USING ERRCODE = 'CH403';
  END IF;
  IF v_task.status NOT IN ('in_progress', 'rework_requested') THEN
    RAISE EXCEPTION 'evidence cannot be added in status %', v_task.status USING ERRCODE = 'CH409';
  END IF;
  IF p_item IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app.checklist_items WHERE id = p_item AND version_id = v_task.checklist_version_id) THEN
    RAISE EXCEPTION 'item does not belong to this task checklist' USING ERRCODE = 'CH422';
  END IF;
  v_ext := CASE p_mime WHEN 'image/jpeg' THEN 'jpg' WHEN 'image/png' THEN 'png' WHEN 'image/webp' THEN 'webp' WHEN 'image/heic' THEN 'heic'
           ELSE NULL END;
  IF v_ext IS NULL THEN RAISE EXCEPTION 'unsupported file type' USING ERRCODE = 'CH422'; END IF;

  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_dist := round(app.haversine_km(p_lat, p_lng, v_task.lat, v_task.lng) * 1000);
  END IF;
  v_cycle := v_task.submission_no + 1;

  INSERT INTO app.task_evidence (id, task_id, checklist_item_id, uploaded_by, submission_no, storage_path, mime_type,
                                 claimed_captured_at, claimed_lat, claimed_lng, claimed_accuracy_m, distance_to_task_m)
  VALUES (v_id, p_task, p_item, v_actor, v_cycle, 'tasks/' || p_task || '/' || v_id || '.' || v_ext, p_mime,
          p_claimed_at, p_lat, p_lng, p_accuracy, v_dist);
  RETURN QUERY SELECT v_id, 'tasks/' || p_task || '/' || v_id || '.' || v_ext;
END $$;

-- Called by the API only after it has verified the object really exists in
-- storage and measured its size / hash itself.
CREATE FUNCTION app.confirm_evidence_upload(p_evidence uuid, p_size bigint, p_sha256 text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_rows integer;
BEGIN
  UPDATE app.task_evidence SET status = 'uploaded', size_bytes = p_size, sha256 = lower(p_sha256), uploaded_at = now()
   WHERE id = p_evidence AND uploaded_by = v_actor AND status = 'pending_upload';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RAISE EXCEPTION 'evidence not found or already confirmed' USING ERRCODE = 'CH409'; END IF;
END $$;

-- ---------------------------------------------------------------------------
-- AI verification: ADVISORY ONLY. Nothing here changes task status or pays
-- anyone. A "completed" row must carry real provider + model metadata, which
-- stops a placeholder from posing as a verification.
-- ---------------------------------------------------------------------------
CREATE TABLE app.ai_verification_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        uuid NOT NULL REFERENCES app.tasks(id),
  submission_no  integer NOT NULL CHECK (submission_no >= 1),
  status         app.ai_status NOT NULL DEFAULT 'pending',
  recommendation app.ai_recommendation,
  confidence     numeric(4,3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  reason_codes   text[] NOT NULL DEFAULT '{}',
  summary        varchar(2000),
  provider       varchar(80),
  model_version  varchar(120),
  failure_reason varchar(500),
  requested_at   timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  CONSTRAINT ai_completed_is_real CHECK (
    status <> 'completed'
    OR (recommendation IS NOT NULL AND provider IS NOT NULL AND model_version IS NOT NULL AND completed_at IS NOT NULL)
  ),
  CONSTRAINT ai_pending_has_no_result CHECK (status <> 'pending' OR (recommendation IS NULL AND confidence IS NULL))
);
CREATE INDEX ai_results_task_idx ON app.ai_verification_results (task_id, submission_no, requested_at DESC);

-- ---------------------------------------------------------------------------
-- Human review decisions (manager stage, then operations stage)
-- ---------------------------------------------------------------------------
CREATE TABLE app.approval_decisions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        uuid NOT NULL REFERENCES app.tasks(id),
  submission_no  integer NOT NULL CHECK (submission_no >= 1),
  stage          app.review_stage NOT NULL,
  decision       app.review_decision NOT NULL,
  decided_by     uuid NOT NULL REFERENCES app.profiles(id),
  reason         varchar(1000),
  ai_result_id   uuid REFERENCES app.ai_verification_results(id),   -- what the reviewer could see; informational
  decided_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, submission_no, stage),
  CONSTRAINT decision_reason_required CHECK (decision = 'approved' OR length(btrim(coalesce(reason, ''))) >= 3)
);
CREATE INDEX approval_decisions_task_idx ON app.approval_decisions (task_id, decided_at);
CREATE TRIGGER approval_decisions_append_only BEFORE UPDATE OR DELETE ON app.approval_decisions
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();

-- Employee submits finished work. Enforced here (not just in the UI):
--  * every REQUIRED checklist item is 'done'
--  * every item that requires a photo has an uploaded photo for this submission
CREATE FUNCTION app.submit_task(p_task uuid) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_task app.tasks;
  v_missing text;
  v_cycle integer;
BEGIN
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;
  IF v_actor IS NULL OR v_task.assigned_to IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'only the assigned employee may submit this task' USING ERRCODE = 'CH403';
  END IF;
  IF v_task.status NOT IN ('in_progress', 'rework_requested') THEN
    RAISE EXCEPTION 'task cannot be submitted in status %', v_task.status USING ERRCODE = 'CH409';
  END IF;
  v_cycle := v_task.submission_no + 1;

  SELECT string_agg(ci.label, '; ' ORDER BY ci.position) INTO v_missing
  FROM app.checklist_items ci
  LEFT JOIN app.checklist_responses cr ON cr.task_id = p_task AND cr.item_id = ci.id
  WHERE ci.version_id = v_task.checklist_version_id
    AND ci.required
    AND coalesce(cr.state, 'pending') <> 'done';
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'required checklist items are incomplete: %', v_missing USING ERRCODE = 'CH422';
  END IF;

  SELECT string_agg(ci.label, '; ' ORDER BY ci.position) INTO v_missing
  FROM app.checklist_items ci
  WHERE ci.version_id = v_task.checklist_version_id
    AND ci.requires_photo
    AND (ci.required OR EXISTS (SELECT 1 FROM app.checklist_responses r WHERE r.task_id = p_task AND r.item_id = ci.id AND r.state = 'done'))
    AND NOT EXISTS (
      SELECT 1 FROM app.task_evidence e
       WHERE e.task_id = p_task AND e.checklist_item_id = ci.id AND e.submission_no = v_cycle AND e.status = 'uploaded');
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'photo evidence missing for: %', v_missing USING ERRCODE = 'CH422';
  END IF;

  UPDATE app.tasks SET status = 'submitted', submission_no = v_cycle, submitted_at = now() WHERE id = p_task;
  PERFORM app.record_audit('task.submitted', 'task', p_task, jsonb_build_object('submission_no', v_cycle));
  RETURN v_cycle;
END $$;

-- A human decision. Stage rules:
--   manager stage:    task must be 'submitted';        actor is active manager/admin
--   operations stage: task must be 'manager_approved'; actor is active operations/admin
-- Nobody reviews work assigned to themselves, and the operations reviewer must
-- be a different person from the manager reviewer ("two-person" rule).
CREATE FUNCTION app.decide_task(p_task uuid, p_stage app.review_stage, p_decision app.review_decision, p_reason text)
RETURNS app.task_status LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_task app.tasks;
  v_new app.task_status;
  v_ai uuid;
  v_mgr uuid;
BEGIN
  IF v_actor IS NULL OR NOT app.is_active(v_actor) THEN
    RAISE EXCEPTION 'an active reviewer is required' USING ERRCODE = 'CH403';
  END IF;
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;
  IF v_task.assigned_to = v_actor THEN
    RAISE EXCEPTION 'you cannot review your own work' USING ERRCODE = 'CH403';
  END IF;

  IF p_stage = 'manager' THEN
    IF NOT (app.has_role(v_actor, 'manager') OR app.has_role(v_actor, 'admin')) THEN
      RAISE EXCEPTION 'manager review requires the manager role' USING ERRCODE = 'CH403';
    END IF;
    IF v_task.status <> 'submitted' THEN
      RAISE EXCEPTION 'task is not awaiting manager review (status %)', v_task.status USING ERRCODE = 'CH409';
    END IF;
    v_new := CASE p_decision WHEN 'approved' THEN 'manager_approved'::app.task_status
                             WHEN 'rework_requested' THEN 'rework_requested' ELSE 'rejected' END;
  ELSE
    IF NOT (app.has_role(v_actor, 'operations') OR app.has_role(v_actor, 'admin')) THEN
      RAISE EXCEPTION 'operations approval requires the operations role' USING ERRCODE = 'CH403';
    END IF;
    IF v_task.status <> 'manager_approved' THEN
      RAISE EXCEPTION 'task is not awaiting operations approval (status %)', v_task.status USING ERRCODE = 'CH409';
    END IF;
    SELECT decided_by INTO v_mgr FROM app.approval_decisions
     WHERE task_id = p_task AND submission_no = v_task.submission_no AND stage = 'manager';
    IF v_mgr = v_actor THEN
      RAISE EXCEPTION 'the operations approver must differ from the manager reviewer' USING ERRCODE = 'CH403';
    END IF;
    v_new := CASE p_decision WHEN 'approved' THEN 'approved'::app.task_status
                             WHEN 'rework_requested' THEN 'rework_requested' ELSE 'rejected' END;
  END IF;

  SELECT id INTO v_ai FROM app.ai_verification_results
   WHERE task_id = p_task AND submission_no = v_task.submission_no ORDER BY requested_at DESC LIMIT 1;

  INSERT INTO app.approval_decisions (task_id, submission_no, stage, decision, decided_by, reason, ai_result_id)
  VALUES (p_task, v_task.submission_no, p_stage, p_decision, v_actor, p_reason, v_ai);
  UPDATE app.tasks SET status = v_new WHERE id = p_task;
  PERFORM app.record_audit('task.' || p_stage || '_' || p_decision, 'task', p_task,
                           jsonb_build_object('submission_no', v_task.submission_no, 'to', v_new));
  RETURN v_new;
END $$;

-- Record an AI result. Callable only with a provider + model; a "completed"
-- row without them violates ai_completed_is_real. There is no function that
-- lets AI approve a task.
CREATE FUNCTION app.record_ai_result(p_task uuid, p_status app.ai_status, p_recommendation app.ai_recommendation,
                                     p_confidence numeric, p_reasons text[], p_summary text,
                                     p_provider text, p_model text, p_failure text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_task app.tasks;
  v_id uuid;
BEGIN
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;
  IF v_task.submission_no < 1 THEN RAISE EXCEPTION 'task has no submission to verify' USING ERRCODE = 'CH409'; END IF;
  INSERT INTO app.ai_verification_results (task_id, submission_no, status, recommendation, confidence, reason_codes,
                                           summary, provider, model_version, failure_reason, completed_at)
  VALUES (p_task, v_task.submission_no, p_status, p_recommendation, p_confidence, coalesce(p_reasons, '{}'), p_summary,
          p_provider, p_model, p_failure, CASE WHEN p_status = 'pending' THEN NULL ELSE now() END)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- ---------------------------------------------------------------------------
-- Integration records & API idempotency (future modules: TMS, GST, Vahan, payments)
-- Nothing writes "succeeded" here unless a real, authorised integration exists.
-- ---------------------------------------------------------------------------
CREATE TABLE app.integration_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     varchar(80) NOT NULL,
  operation    varchar(120) NOT NULL,
  status       varchar(24) NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','pending','succeeded','failed')),
  external_ref varchar(200),
  entity_type  varchar(80),
  entity_id    uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integration_records_entity_idx ON app.integration_records (entity_type, entity_id);

CREATE TABLE app.idempotency_keys (
  key            varchar(200) NOT NULL,
  user_id        uuid NOT NULL REFERENCES app.profiles(id),
  request_hash   char(64) NOT NULL,
  response_code  integer,
  response_body  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
