-- Draft initial schema. Inspect live Supabase objects and back up before enabling Flyway.
create extension if not exists pgcrypto;

create table if not exists app_profiles (
  id uuid primary key,
  display_name text,
  account_status text not null default 'PENDING' check (account_status in ('PENDING','ACTIVE','SUSPENDED','REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_profiles(id) on delete cascade,
  role text not null check (role in ('ADMIN','MANAGER','OPERATIONS','EMPLOYEE','CUSTOMER','PARTNER')),
  granted_by uuid references app_profiles(id),
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'OPEN' check (status in ('OPEN','ASSIGNED','IN_PROGRESS','SUBMITTED','AI_REVIEW','OPS_REVIEW','APPROVED','REJECTED','COMPLETED','CANCELLED')),
  created_by uuid not null references app_profiles(id),
  assigned_to uuid references app_profiles(id),
  reward_amount numeric(12,2) not null default 0 check (reward_amount >= 0),
  currency char(3) not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_status_created on tasks(status, created_at desc);
create index if not exists idx_tasks_assigned_to on tasks(assigned_to);

create table if not exists task_evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  submitted_by uuid not null references app_profiles(id),
  storage_path text not null,
  content_type text not null,
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','AI_PASSED','AI_FLAGGED','OPS_APPROVED','OPS_REJECTED')),
  verification_notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_evidence_task on task_evidence(task_id, created_at desc);

create table if not exists task_approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  evidence_id uuid references task_evidence(id),
  reviewer_id uuid not null references app_profiles(id),
  decision text not null check (decision in ('APPROVED','REJECTED')),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_profiles(id),
  task_id uuid references tasks(id),
  idempotency_key text not null unique,
  entry_type text not null check (entry_type in ('CREDIT','DEBIT','REVERSAL','ADJUSTMENT')),
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'INR',
  description text not null,
  created_by uuid references app_profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_user_created on wallet_ledger(user_id, created_at desc);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references app_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_events(entity_type, entity_id, created_at desc);