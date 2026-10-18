-- V5: wallet + immutable, append-only ledger.
--
-- This is an INTERNAL reward ledger. It is not a payment system: no money
-- moves, there is no payout/withdrawal function, and no payment provider is
-- integrated. Whether balances become withdrawable funds is a pending business
-- decision (docs/decisions-pending.md).
SET search_path = app, public;

CREATE TYPE app.ledger_entry_type AS ENUM ('task_reward', 'reversal', 'adjustment');

CREATE TABLE app.wallet_accounts (
  user_id       uuid PRIMARY KEY REFERENCES app.profiles(id) ON DELETE RESTRICT,
  currency      char(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  -- Cache of SUM(ledger). Only the ledger trigger changes it (see below), under a row lock.
  balance_paise bigint NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.wallet_ledger_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq                 bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id             uuid NOT NULL REFERENCES app.wallet_accounts(user_id),
  entry_type          app.ledger_entry_type NOT NULL,
  amount_paise        bigint NOT NULL CHECK (amount_paise <> 0),     -- signed: credit > 0, debit < 0
  balance_after_paise bigint NOT NULL,
  idempotency_key     varchar(200) NOT NULL UNIQUE,
  task_id             uuid REFERENCES app.tasks(id),
  reverses_entry_id   uuid UNIQUE REFERENCES app.wallet_ledger_entries(id),
  memo                varchar(500),
  created_by          uuid REFERENCES app.profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reward_is_positive_and_linked CHECK (entry_type <> 'task_reward' OR (amount_paise > 0 AND task_id IS NOT NULL)),
  CONSTRAINT reversal_links_original CHECK ((entry_type = 'reversal') = (reverses_entry_id IS NOT NULL))
);
CREATE INDEX wallet_ledger_user_idx ON app.wallet_ledger_entries (user_id, seq DESC);
-- At most ONE reward credit per task, regardless of idempotency key.
CREATE UNIQUE INDEX wallet_one_reward_per_task_uq ON app.wallet_ledger_entries (task_id) WHERE entry_type = 'task_reward';

-- Append-only: no UPDATE, DELETE or TRUNCATE, ever. Corrections are new rows.
CREATE TRIGGER wallet_ledger_no_mutation BEFORE UPDATE OR DELETE ON app.wallet_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION app.forbid_mutation();
CREATE TRIGGER wallet_ledger_no_truncate BEFORE TRUNCATE ON app.wallet_ledger_entries
  FOR EACH STATEMENT EXECUTE FUNCTION app.forbid_mutation();

-- Concurrency-safe balance: lock the account row, compute the new balance,
-- reject overdrafts, stamp balance_after, update the cache - all in the
-- inserting transaction.
CREATE FUNCTION app.ledger_before_insert() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_balance bigint;
BEGIN
  SELECT balance_paise INTO v_balance FROM app.wallet_accounts WHERE user_id = NEW.user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet does not exist' USING ERRCODE = 'CH404'; END IF;
  IF v_balance + NEW.amount_paise < 0 THEN
    RAISE EXCEPTION 'insufficient balance: ledger entry would make the balance negative' USING ERRCODE = 'CH409';
  END IF;
  NEW.balance_after_paise := v_balance + NEW.amount_paise;
  UPDATE app.wallet_accounts SET balance_paise = NEW.balance_after_paise WHERE user_id = NEW.user_id;
  RETURN NEW;
END $$;
CREATE TRIGGER wallet_ledger_balance BEFORE INSERT ON app.wallet_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION app.ledger_before_insert();

-- Only the ledger trigger may touch balance_paise; block direct edits.
CREATE FUNCTION app.guard_wallet_balance() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.balance_paise IS DISTINCT FROM OLD.balance_paise AND pg_trigger_depth() < 2 THEN
    RAISE EXCEPTION 'wallet balance can only change through ledger entries' USING ERRCODE = 'CH403';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wallet_accounts_guard BEFORE UPDATE ON app.wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION app.guard_wallet_balance();

CREATE FUNCTION app.ensure_wallet(p_user uuid) RETURNS void
LANGUAGE sql AS $$
  INSERT INTO app.wallet_accounts (user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING
$$;

-- Credit the task reward. The AMOUNT COMES FROM THE TASK ROW, never from the
-- caller. Preconditions (all checked here, inside one transaction):
--   * task is 'approved'
--   * a manager approval AND an operations approval exist for the current submission
--   * the assignee is an active employee
-- Idempotent: the key 'task-reward:<task_id>' means a retry returns the SAME
-- entry id instead of crediting twice; a unique index also caps it at one
-- reward per task even if some other key were used.
CREATE FUNCTION app.credit_task_reward(p_task uuid) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_task app.tasks;
  v_key text := 'task-reward:' || p_task;
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (app.has_active_role(v_actor, 'operations') OR app.has_active_role(v_actor, 'admin')) THEN
    RAISE EXCEPTION 'only operations or administrators may settle rewards' USING ERRCODE = 'CH403';
  END IF;
  SELECT * INTO v_task FROM app.tasks WHERE id = p_task FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found' USING ERRCODE = 'CH404'; END IF;

  SELECT id INTO v_id FROM app.wallet_ledger_entries WHERE idempotency_key = v_key;
  IF FOUND THEN RETURN v_id; END IF;     -- idempotent replay

  IF v_task.status <> 'approved' THEN
    RAISE EXCEPTION 'reward can only be credited for an approved task (status %)', v_task.status USING ERRCODE = 'CH409';
  END IF;
  IF (SELECT count(DISTINCT stage) FROM app.approval_decisions
       WHERE task_id = p_task AND submission_no = v_task.submission_no AND decision = 'approved') < 2 THEN
    RAISE EXCEPTION 'both manager and operations approvals are required' USING ERRCODE = 'CH409';
  END IF;
  IF NOT app.has_active_role(v_task.assigned_to, 'employee') THEN
    RAISE EXCEPTION 'assignee is not an active employee' USING ERRCODE = 'CH409';
  END IF;
  IF v_task.reward_paise <= 0 THEN
    RAISE EXCEPTION 'task has no reward to credit' USING ERRCODE = 'CH422';
  END IF;

  PERFORM app.ensure_wallet(v_task.assigned_to);
  -- Plain INSERT on purpose (no ON CONFLICT): the BEFORE INSERT balance trigger
  -- has side effects, so a "skipped" conflicting insert would still move the
  -- cached balance. Concurrent callers are serialised by the FOR UPDATE lock on
  -- the task row above, and the replay lookup earlier returns the existing
  -- entry; the unique indexes remain as the last line of defence (an error
  -- aborts the statement, including the trigger's balance update).
  INSERT INTO app.wallet_ledger_entries (user_id, entry_type, amount_paise, idempotency_key, task_id, memo, created_by)
  VALUES (v_task.assigned_to, 'task_reward', v_task.reward_paise, v_key, p_task, 'Reward for task ' || v_task.task_no, v_actor)
  RETURNING id INTO v_id;
  PERFORM app.record_audit('wallet.reward_credited', 'task', p_task, jsonb_build_object('ledger_entry', v_id, 'amount_paise', v_task.reward_paise));
  RETURN v_id;
END $$;

-- Undo an entry with a COMPENSATING entry (history is never edited or deleted).
-- Admin only. A reward whose funds are already gone cannot be reversed here
-- (it would overdraw); that case needs a manual process (documented).
CREATE FUNCTION app.reverse_ledger_entry(p_entry uuid, p_reason text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := app.actor_id();
  v_entry app.wallet_ledger_entries;
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT app.has_active_role(v_actor, 'admin') THEN
    RAISE EXCEPTION 'only an administrator may reverse ledger entries' USING ERRCODE = 'CH403';
  END IF;
  IF length(btrim(coalesce(p_reason, ''))) < 3 THEN RAISE EXCEPTION 'a reason is required' USING ERRCODE = 'CH422'; END IF;
  -- Lock the original entry (a row lock is not an UPDATE, so the append-only
  -- trigger does not fire) to serialise concurrent reversal attempts.
  SELECT * INTO v_entry FROM app.wallet_ledger_entries WHERE id = p_entry FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ledger entry not found' USING ERRCODE = 'CH404'; END IF;
  IF v_entry.entry_type = 'reversal' THEN RAISE EXCEPTION 'a reversal cannot be reversed' USING ERRCODE = 'CH409'; END IF;

  SELECT id INTO v_id FROM app.wallet_ledger_entries WHERE idempotency_key = 'reversal:' || p_entry;
  IF FOUND THEN RETURN v_id; END IF;     -- idempotent replay

  INSERT INTO app.wallet_ledger_entries (user_id, entry_type, amount_paise, idempotency_key, task_id, reverses_entry_id, memo, created_by)
  VALUES (v_entry.user_id, 'reversal', -v_entry.amount_paise, 'reversal:' || p_entry, NULL, p_entry, p_reason, v_actor)
  RETURNING id INTO v_id;
  PERFORM app.record_audit('wallet.entry_reversed', 'wallet_ledger_entry', p_entry, jsonb_build_object('reason', p_reason));
  RETURN v_id;
END $$;

-- Reconciliation helper: cached balance must equal the ledger sum.
CREATE FUNCTION app.wallet_discrepancies() RETURNS TABLE (user_id uuid, cached_paise bigint, ledger_paise bigint)
LANGUAGE sql STABLE AS $$
  SELECT a.user_id, a.balance_paise, coalesce(sum(l.amount_paise), 0)::bigint
  FROM app.wallet_accounts a LEFT JOIN app.wallet_ledger_entries l ON l.user_id = a.user_id
  GROUP BY a.user_id, a.balance_paise
  HAVING a.balance_paise <> coalesce(sum(l.amount_paise), 0)
$$;
