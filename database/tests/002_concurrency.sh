#!/usr/bin/env bash
# Concurrency tests: real parallel DB sessions racing on the same rows.
# Requires 001_core.sql to have run (reuses its users and checklist).
# usage: PGHOST=... PGPORT=... PGUSER=... 002_concurrency.sh <dbname>
set -uo pipefail
DB="${1:?dbname}"
P="psql -v ON_ERROR_STOP=1 -q -tA -d $DB"
FAILS=0
ok()   { echo "PASS  $1"; }
bad()  { echo "FAIL  $1  ($2)"; FAILS=$((FAILS+1)); }
check(){ if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "expected '$3' got '$2'"; fi; }

MGR=a0000000-0000-0000-0000-000000000002
OPS=a0000000-0000-0000-0000-000000000003
ADM=a0000000-0000-0000-0000-000000000001
EMP1=a0000000-0000-0000-0000-000000000011

# ---- fixtures: 12 more eligible employees ----------------------------------
$P <<'SQL'
SELECT set_config('app.bootstrap','on',false);
INSERT INTO auth.users(id,email) SELECT ('c0000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid, 'race'||g||'@t.test' FROM generate_series(1,12) g ON CONFLICT DO NOTHING;
INSERT INTO app.profiles(id,email,account_status,location_consent_at) SELECT ('c0000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid, 'race'||g||'@t.test','active',now() FROM generate_series(1,12) g ON CONFLICT DO NOTHING;
INSERT INTO app.user_roles(user_id,role) SELECT ('c0000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid,'employee' FROM generate_series(1,12) g ON CONFLICT DO NOTHING;
INSERT INTO app.employees(user_id,region,skills) SELECT ('c0000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid,'V','{shelf}' FROM generate_series(1,12) g ON CONFLICT DO NOTHING;
INSERT INTO app.employee_locations(user_id,lat,lng,captured_at) SELECT ('c0000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid,16.4985,80.6563,now() FROM generate_series(1,12) g ON CONFLICT DO NOTHING;

-- helper: build a task and drive it to 'approved' (all via the real functions)
CREATE OR REPLACE FUNCTION t.make_approved_task(p_reward bigint, p_emp uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_ver uuid := (SELECT id FROM app.checklist_template_versions ORDER BY created_at LIMIT 1);
  v_task uuid; v_ev uuid; v_sha text := md5(random()::text) || md5(random()::text);
BEGIN
  PERFORM set_config('app.actor_id','a0000000-0000-0000-0000-000000000002',false);
  v_task := app.create_task('Race task '||gen_random_uuid(),'t','shelf','normal','b0000000-0000-0000-0000-000000000001',NULL,'a','c','s','1',16.5,80.66,200,p_reward,now()-interval '1 minute',now()+interval '2 days','{}',v_ver);
  PERFORM app.assign_task(v_task, p_emp);
  PERFORM set_config('app.actor_id', p_emp::text, false);
  PERFORM app.start_task(v_task);
  PERFORM app.save_checklist_response(v_task, id, 'done', NULL, NULL) FROM app.checklist_items WHERE version_id=v_ver AND required;
  SELECT evidence_id INTO v_ev FROM app.begin_evidence_upload(v_task,(SELECT id FROM app.checklist_items WHERE version_id=v_ver AND position=1),'image/jpeg',now(),NULL,NULL,NULL);
  PERFORM app.confirm_evidence_upload(v_ev, 1000, v_sha);
  PERFORM app.submit_task(v_task);
  PERFORM set_config('app.actor_id','a0000000-0000-0000-0000-000000000002',false);
  PERFORM app.decide_task(v_task,'manager','approved','ok');
  PERFORM set_config('app.actor_id','a0000000-0000-0000-0000-000000000003',false);
  PERFORM app.decide_task(v_task,'operations','approved','ok');
  RETURN v_task;
END $$;
SQL

# ---- 1. 12 employees race to accept ONE exclusive task ---------------------
TASK=$($P <<SQL
SELECT set_config('app.actor_id','$MGR',false);
SELECT app.create_task('Accept race','t','shelf','normal','b0000000-0000-0000-0000-000000000001',NULL,'a','c','s','1',16.5,80.66,200,50000,now()-interval '1 minute',now()+interval '2 days','{}',(SELECT id FROM app.checklist_template_versions ORDER BY created_at LIMIT 1));
SQL
)
TASK=$(echo "$TASK" | tail -1)
WIN=0; LOSE=0; OTHER=0
tmp=$(mktemp -d)
for g in $(seq 1 12); do
  E=$(printf 'c0000000-0000-0000-0000-%012d' "$g")
  ( psql -v ON_ERROR_STOP=1 -q -tA -d "$DB" -c "SELECT set_config('app.actor_id','$E',false)" -c "SELECT app.accept_task('$TASK')" >/dev/null 2>"$tmp/err$g"; echo $? >"$tmp/rc$g" ) &
done
wait
for g in $(seq 1 12); do
  rc=$(cat "$tmp/rc$g")
  if [ "$rc" = "0" ]; then WIN=$((WIN+1));
  elif grep -q "no longer available" "$tmp/err$g"; then LOSE=$((LOSE+1)); else OTHER=$((OTHER+1)); fi
done
check "1a exactly one of 12 concurrent accepts wins" "$WIN" "1"
check "1b the other 11 get a clean 'no longer available' conflict" "$LOSE" "11"
check "1c no unexpected errors" "$OTHER" "0"
check "1d task has exactly one assignee and is 'accepted'" "$($P -c "SELECT status||':'||(assigned_to IS NOT NULL) FROM app.tasks WHERE id='$TASK'")" "accepted:true"
check "1e exactly one 'task.accepted' audit event" "$($P -c "SELECT count(*) FROM app.audit_events WHERE action='task.accepted' AND entity_id='$TASK'")" "1"
check "1f history shows a single open->accepted transition" "$($P -c "SELECT count(*) FROM app.task_status_history WHERE task_id='$TASK' AND to_status='accepted'")" "1"

# ---- 2. 15 concurrent reward credits for ONE approved task ------------------
APPROVED=$($P -c "SELECT set_config('app.actor_id','$MGR',false)" -c "SELECT t.make_approved_task(75000,'$EMP1')" | tail -1)
BEFORE=$($P -c "SELECT balance_paise FROM app.wallet_accounts WHERE user_id='$EMP1'")
ids="$tmp/credit_ids"; : > "$ids"
for i in $(seq 1 15); do
  ( psql -v ON_ERROR_STOP=1 -q -tA -d "$DB" -c "SELECT set_config('app.actor_id','$OPS',false)" -c "SELECT app.credit_task_reward('$APPROVED')" 2>/dev/null | tail -1 >> "$ids" ) &
done
wait
check "2a 15 concurrent credit calls all succeed" "$(grep -c . "$ids")" "15"
check "2b ...and all return the SAME ledger entry" "$(sort -u "$ids" | grep -c .)" "1"
check "2c exactly one ledger row exists for the task" "$($P -c "SELECT count(*) FROM app.wallet_ledger_entries WHERE task_id='$APPROVED'")" "1"
AFTER=$($P -c "SELECT balance_paise FROM app.wallet_accounts WHERE user_id='$EMP1'")
check "2d balance increased by exactly one reward (75000 paise)" "$((AFTER-BEFORE))" "75000"
check "2e reconciliation: cached balance equals ledger sum everywhere" "$($P -c "SELECT count(*) FROM app.wallet_discrepancies()")" "0"

# ---- 3. concurrent reversals of the same entry ------------------------------
ENTRY=$(head -1 "$ids")
rids="$tmp/rev_ids"; : > "$rids"
for i in $(seq 1 10); do
  ( psql -v ON_ERROR_STOP=1 -q -tA -d "$DB" -c "SELECT set_config('app.actor_id','$ADM',false)" -c "SELECT app.reverse_ledger_entry('$ENTRY','race reversal')" 2>/dev/null | tail -1 >> "$rids" ) &
done
wait
check "3a 10 concurrent reversals all return one reversal id" "$(sort -u "$rids" | grep -c .)" "1"
check "3b exactly one compensating entry was written" "$($P -c "SELECT count(*) FROM app.wallet_ledger_entries WHERE reverses_entry_id='$ENTRY'")" "1"
check "3c balance back to where it started" "$($P -c "SELECT balance_paise FROM app.wallet_accounts WHERE user_id='$EMP1'")" "$BEFORE"
check "3d reconciliation still clean" "$($P -c "SELECT count(*) FROM app.wallet_discrepancies()")" "0"

# ---- 4. concurrent debits can never overdraw --------------------------------
RACER=$(printf 'c0000000-0000-0000-0000-%012d' 1)
$P -c "SELECT app.ensure_wallet('$RACER')" >/dev/null
$P <<SQL >/dev/null
INSERT INTO app.wallet_ledger_entries(user_id,entry_type,amount_paise,idempotency_key,memo) VALUES ('$RACER','adjustment',50000,'seed-racer','seed');
SQL
OKC=0; REJ=0
for i in $(seq 1 10); do
  ( psql -v ON_ERROR_STOP=1 -q -tA -d "$DB" -c "INSERT INTO app.wallet_ledger_entries(user_id,entry_type,amount_paise,idempotency_key,memo) VALUES ('$RACER','adjustment',-10000,'debit-$i','race')" >/dev/null 2>"$tmp/derr$i"; echo $? >"$tmp/drc$i" ) &
done
wait
for i in $(seq 1 10); do
  if [ "$(cat "$tmp/drc$i")" = "0" ]; then OKC=$((OKC+1)); elif grep -q "insufficient balance" "$tmp/derr$i"; then REJ=$((REJ+1)); fi
done
check "4a exactly 5 of 10 concurrent 10,000-paise debits succeed" "$OKC" "5"
check "4b the other 5 are rejected as insufficient balance" "$REJ" "5"
check "4c final balance is exactly 0 (never negative)" "$($P -c "SELECT balance_paise FROM app.wallet_accounts WHERE user_id='$RACER'")" "0"
check "4d reconciliation clean" "$($P -c "SELECT count(*) FROM app.wallet_discrepancies()")" "0"

rm -rf "$tmp"
echo "concurrency tests: $FAILS failed"
[ "$FAILS" = "0" ]
