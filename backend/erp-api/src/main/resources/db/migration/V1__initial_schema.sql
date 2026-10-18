-- V1__initial_schema.sql
-- ChaseHorse ERP — PostgreSQL schema for Supabase
-- All tables in the public schema. Supabase Auth tables live in the auth schema.

-- ============================================================
-- PROFILES & ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS app_profiles (
    id            UUID PRIMARY KEY,                         -- matches auth.users.id
    display_name  VARCHAR(255),
    email         VARCHAR(320),
    phone         VARCHAR(20),
    avatar_url    TEXT,
    region        VARCHAR(100),
    account_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (account_status IN ('PENDING','ACTIVE','SUSPENDED','REJECTED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_role_assignments (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
    role       VARCHAR(50) NOT NULL
        CHECK (role IN ('ADMIN','MANAGER','OPERATIONS','EMPLOYEE','CUSTOMER','PARTNER','FIELD_WORKER')),
    granted_by UUID REFERENCES app_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON app_role_assignments(user_id);

-- ============================================================
-- CHECKLIST TEMPLATES
-- ============================================================

CREATE TABLE IF NOT EXISTS checklist_templates (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    created_by  UUID REFERENCES app_profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_items (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id     UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    label           VARCHAR(500) NOT NULL,
    required        BOOLEAN NOT NULL DEFAULT false,
    requires_photo  BOOLEAN NOT NULL DEFAULT false,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_template ON checklist_items(template_id, sort_order);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
    id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    category              VARCHAR(100),
    status                VARCHAR(50) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','SUBMITTED','IN_REVIEW','APPROVED','REJECTED','CANCELLED')),
    priority              VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
        CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
    created_by            UUID NOT NULL REFERENCES app_profiles(id),
    assigned_to           UUID REFERENCES app_profiles(id),
    customer_id           UUID REFERENCES app_profiles(id),
    checklist_template_id UUID REFERENCES checklist_templates(id),
    location_lat          DECIMAL(10,7),
    location_lng          DECIMAL(10,7),
    location_area         VARCHAR(255),
    location_address      TEXT,
    due_at                TIMESTAMPTZ,
    reward_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency              CHAR(3)      NOT NULL DEFAULT 'INR',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status_created  ON tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to     ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_customer         ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by       ON tasks(created_by);

-- ============================================================
-- TASK ASSIGNMENT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS task_assignments (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES app_profiles(id),
    action      VARCHAR(50) NOT NULL
        CHECK (action IN ('OFFERED','ACCEPTED','REJECTED','REVOKED')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id, created_at DESC);

-- ============================================================
-- TASK CHECKLIST RESULTS
-- ============================================================

CREATE TABLE IF NOT EXISTS task_checklist_results (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id           UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id),
    completed         BOOLEAN NOT NULL DEFAULT false,
    photo_attached    BOOLEAN NOT NULL DEFAULT false,
    completed_at      TIMESTAMPTZ,
    UNIQUE(task_id, checklist_item_id)
);

-- ============================================================
-- TASK EVIDENCE (photos/documents uploaded by field workers)
-- ============================================================

CREATE TABLE IF NOT EXISTS task_evidence (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_by        UUID NOT NULL REFERENCES app_profiles(id),
    storage_path        VARCHAR(1000) NOT NULL,
    file_name           VARCHAR(255),
    content_type        VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT,
    caption             TEXT,
    location_lat        DECIMAL(10,7),
    location_lng        DECIMAL(10,7),
    captured_at         TIMESTAMPTZ,
    checklist_item_id   UUID REFERENCES checklist_items(id),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING','VERIFIED','FLAGGED','REJECTED')),
    verification_notes  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_task ON task_evidence(task_id, created_at DESC);

-- ============================================================
-- AI VERIFICATION (advisory — never changes approval state)
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_verifications (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES task_evidence(id) ON DELETE CASCADE,
    status      VARCHAR(50) NOT NULL DEFAULT 'NOT_RUN'
        CHECK (status IN ('NOT_RUN','PASSED','FLAGGED','FAILED')),
    confidence  DECIMAL(4,3),
    summary     TEXT,
    checks      JSONB DEFAULT '[]'::jsonb,
    run_at      TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TASK APPROVALS (human review — the authority for reward release)
-- ============================================================

CREATE TABLE IF NOT EXISTS task_approvals (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES task_evidence(id),
    reviewer_id UUID NOT NULL REFERENCES app_profiles(id),
    stage       VARCHAR(50) NOT NULL
        CHECK (stage IN ('MANAGER_REVIEW','OPS_REVIEW','FINAL')),
    decision    VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (decision IN ('PENDING','APPROVED','REJECTED','REWORK','ESCALATED')),
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_task ON task_approvals(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_reviewer ON task_approvals(reviewer_id, created_at DESC);

-- ============================================================
-- WALLET LEDGER (append-only, idempotent)
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES app_profiles(id),
    task_id         UUID REFERENCES tasks(id),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    entry_type      VARCHAR(50) NOT NULL
        CHECK (entry_type IN ('TASK_REWARD','BONUS','WITHDRAWAL','ADJUSTMENT')),
    amount          NUMERIC(12,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'INR',
    description     TEXT NOT NULL,
    created_by      UUID REFERENCES app_profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user_created ON wallet_ledger(user_id, created_at DESC);

-- ============================================================
-- AUDIT EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_events (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id    UUID REFERENCES app_profiles(id),
    action      VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_events(actor_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES app_profiles(id),
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    type        VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   UUID,
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ============================================================
-- TMS: VEHICLES / FLEET
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_vehicles (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number  VARCHAR(20)  NOT NULL UNIQUE,
    vehicle_type         VARCHAR(50)  NOT NULL,
    capacity_kg          NUMERIC(10,2),
    capacity_volume_m3   NUMERIC(10,2),
    make                 VARCHAR(100),
    model                VARCHAR(100),
    model_year           INT,
    status               VARCHAR(50)  NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE','IN_TRANSIT','MAINTENANCE','RETIRED')),
    assigned_driver_id   UUID REFERENCES app_profiles(id),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TMS: TRANSPORT PLANS (reusable route templates)
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_transport_plans (
    id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name                     VARCHAR(255) NOT NULL,
    description              TEXT,
    origin_area              VARCHAR(255) NOT NULL,
    destination_area         VARCHAR(255) NOT NULL,
    vehicle_type             VARCHAR(50),
    estimated_duration_hours NUMERIC(6,2),
    base_price               NUMERIC(12,2) NOT NULL,
    price_per_kg             NUMERIC(8,2),
    price_per_km             NUMERIC(8,2),
    currency                 CHAR(3)      NOT NULL DEFAULT 'INR',
    active                   BOOLEAN      NOT NULL DEFAULT true,
    created_by               UUID REFERENCES app_profiles(id),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- TMS: BOOKINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_bookings (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_ref         VARCHAR(20)  NOT NULL UNIQUE,
    customer_id         UUID NOT NULL REFERENCES app_profiles(id),
    transport_plan_id   UUID REFERENCES tms_transport_plans(id),
    vehicle_id          UUID REFERENCES tms_vehicles(id),
    driver_id           UUID REFERENCES app_profiles(id),
    origin_address      TEXT NOT NULL,
    origin_lat          DECIMAL(10,7),
    origin_lng          DECIMAL(10,7),
    destination_address TEXT NOT NULL,
    destination_lat     DECIMAL(10,7),
    destination_lng     DECIMAL(10,7),
    cargo_description   TEXT,
    cargo_weight_kg     NUMERIC(10,2),
    pickup_date         TIMESTAMPTZ,
    delivery_date       TIMESTAMPTZ,
    status              VARCHAR(50)  NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','CONFIRMED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED')),
    total_price         NUMERIC(12,2),
    price_breakdown     JSONB DEFAULT '{}'::jsonb,
    payment_status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING'
        CHECK (payment_status IN ('PENDING','PAID','PARTIAL','REFUNDED','FAILED')),
    currency            CHAR(3)      NOT NULL DEFAULT 'INR',
    notes               TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON tms_bookings(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON tms_bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_ref      ON tms_bookings(booking_ref);

-- ============================================================
-- TMS: TRACKING EVENTS (shipment milestones)
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_tracking_events (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id           UUID NOT NULL REFERENCES tms_bookings(id) ON DELETE CASCADE,
    status               VARCHAR(50) NOT NULL,
    location_description VARCHAR(255),
    location_lat         DECIMAL(10,7),
    location_lng         DECIMAL(10,7),
    notes                TEXT,
    recorded_by          UUID REFERENCES app_profiles(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_booking ON tms_tracking_events(booking_id, created_at DESC);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER trg_app_profiles_updated_at       BEFORE UPDATE ON app_profiles       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_tasks_updated_at              BEFORE UPDATE ON tasks              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_tms_vehicles_updated_at       BEFORE UPDATE ON tms_vehicles       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_tms_transport_plans_updated_at BEFORE UPDATE ON tms_transport_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_tms_bookings_updated_at       BEFORE UPDATE ON tms_bookings       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;