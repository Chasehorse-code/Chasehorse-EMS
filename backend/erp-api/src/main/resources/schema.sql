-- H2-compatible schema for embedded/test mode (no Flyway).
-- Mirrors V1__initial_schema.sql with H2 syntax (RANDOM_UUID, CLOB, no JSONB/INET).
-- Only used when SPRING_DATASOURCE_URL is not set.

CREATE TABLE IF NOT EXISTS app_profiles (
    id             UUID PRIMARY KEY,
    display_name   VARCHAR(255),
    email          VARCHAR(320),
    phone          VARCHAR(20),
    avatar_url     CLOB,
    region         VARCHAR(100),
    account_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_role_assignments (
    id         UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES app_profiles(id) ON DELETE CASCADE,
    role       VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES app_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS checklist_templates (
    id         UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    category   VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES app_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklist_items (
    id             UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    template_id    UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    label          VARCHAR(500) NOT NULL,
    required       BOOLEAN NOT NULL DEFAULT false,
    requires_photo BOOLEAN NOT NULL DEFAULT false,
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id                    UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    title                 VARCHAR(255) NOT NULL,
    description           CLOB,
    category              VARCHAR(100),
    status                VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority              VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_by            UUID NOT NULL REFERENCES app_profiles(id),
    assigned_to           UUID REFERENCES app_profiles(id),
    customer_id           UUID REFERENCES app_profiles(id),
    checklist_template_id UUID REFERENCES checklist_templates(id),
    location_lat          DECIMAL(10,7),
    location_lng          DECIMAL(10,7),
    location_area         VARCHAR(255),
    location_address      CLOB,
    due_at                TIMESTAMP WITH TIME ZONE,
    reward_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency              CHAR(3) NOT NULL DEFAULT 'INR',
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to    ON tasks(assigned_to);

CREATE TABLE IF NOT EXISTS task_assignments (
    id          UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES app_profiles(id),
    action      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_checklist_results (
    id                UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    task_id           UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id),
    completed         BOOLEAN NOT NULL DEFAULT false,
    photo_attached    BOOLEAN NOT NULL DEFAULT false,
    completed_at      TIMESTAMP WITH TIME ZONE,
    UNIQUE(task_id, checklist_item_id)
);

CREATE TABLE IF NOT EXISTS task_evidence (
    id                  UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_by        UUID NOT NULL REFERENCES app_profiles(id),
    storage_path        VARCHAR(1000) NOT NULL,
    file_name           VARCHAR(255),
    content_type        VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT,
    caption             CLOB,
    location_lat        DECIMAL(10,7),
    location_lng        DECIMAL(10,7),
    captured_at         TIMESTAMP WITH TIME ZONE,
    checklist_item_id   UUID REFERENCES checklist_items(id),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verification_notes  CLOB,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_task ON task_evidence(task_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_verifications (
    id          UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES task_evidence(id) ON DELETE CASCADE,
    status      VARCHAR(50) NOT NULL DEFAULT 'NOT_RUN',
    confidence  DECIMAL(4,3),
    summary     CLOB,
    checks      CLOB DEFAULT '[]',
    run_at      TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_approvals (
    id          UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES task_evidence(id),
    reviewer_id UUID NOT NULL REFERENCES app_profiles(id),
    stage       VARCHAR(50) NOT NULL,
    decision    VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reason      CLOB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id              UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES app_profiles(id),
    task_id         UUID REFERENCES tasks(id),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    entry_type      VARCHAR(50) NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'INR',
    description     CLOB NOT NULL,
    created_by      UUID REFERENCES app_profiles(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_user_created ON wallet_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
    id          UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    actor_id    UUID REFERENCES app_profiles(id),
    action      VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    metadata    CLOB NOT NULL DEFAULT '{}',
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES app_profiles(id),
    title       VARCHAR(255) NOT NULL,
    body        CLOB,
    type        VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   UUID,
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tms_vehicles (
    id                  UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    registration_number VARCHAR(20)  NOT NULL UNIQUE,
    vehicle_type        VARCHAR(50)  NOT NULL,
    capacity_kg         NUMERIC(10,2),
    capacity_volume_m3  NUMERIC(10,2),
    make                VARCHAR(100),
    model               VARCHAR(100),
    model_year          INT,
    status              VARCHAR(50)  NOT NULL DEFAULT 'AVAILABLE',
    assigned_driver_id  UUID REFERENCES app_profiles(id),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tms_transport_plans (
    id                       UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    name                     VARCHAR(255) NOT NULL,
    description              CLOB,
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
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tms_bookings (
    id                  UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    booking_ref         VARCHAR(20) NOT NULL UNIQUE,
    customer_id         UUID NOT NULL REFERENCES app_profiles(id),
    transport_plan_id   UUID REFERENCES tms_transport_plans(id),
    vehicle_id          UUID REFERENCES tms_vehicles(id),
    driver_id           UUID REFERENCES app_profiles(id),
    origin_address      CLOB NOT NULL,
    origin_lat          DECIMAL(10,7),
    origin_lng          DECIMAL(10,7),
    destination_address CLOB NOT NULL,
    destination_lat     DECIMAL(10,7),
    destination_lng     DECIMAL(10,7),
    cargo_description   CLOB,
    cargo_weight_kg     NUMERIC(10,2),
    pickup_date         TIMESTAMP WITH TIME ZONE,
    delivery_date       TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    total_price         NUMERIC(12,2),
    price_breakdown     CLOB DEFAULT '{}',
    payment_status      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    notes               CLOB,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tms_tracking_events (
    id                   UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    booking_id           UUID NOT NULL REFERENCES tms_bookings(id) ON DELETE CASCADE,
    status               VARCHAR(50) NOT NULL,
    location_description VARCHAR(255),
    location_lat         DECIMAL(10,7),
    location_lng         DECIMAL(10,7),
    notes                CLOB,
    recorded_by          UUID REFERENCES app_profiles(id),
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
