#!/usr/bin/env bash
# Rebuild a throwaway DB, apply migrations, run the SQL behaviour tests, then
# the concurrency tests. Exits non-zero on any failure.
# usage: PGHOST=... PGPORT=... PGUSER=... database/tests/run.sh [dbname]
set -euo pipefail
DB="${1:-ch_test}"
HERE="$(cd "$(dirname "$0")" && pwd)"
psql -q -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB"
"$HERE/../scripts/migrate_local.sh" "$DB" >/dev/null
OUT="$(psql -v ON_ERROR_STOP=1 -d "$DB" -f "$HERE/001_core.sql" 2>&1)"
echo "$OUT" | grep -E '^\s+[0-9]+ \| FAIL|passed|failed' || true
FAILED="$(psql -tA -d "$DB" -c "SELECT count(*) FROM t.results WHERE NOT ok")"
PASSED="$(psql -tA -d "$DB" -c "SELECT count(*) FROM t.results WHERE ok")"
echo "core tests: $PASSED passed, $FAILED failed"
[ "$FAILED" = "0" ] || { psql -d "$DB" -c "SELECT n, name, detail FROM t.results WHERE NOT ok ORDER BY n"; exit 1; }
"$HERE/002_concurrency.sh" "$DB"
