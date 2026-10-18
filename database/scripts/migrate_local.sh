#!/usr/bin/env bash
# Apply the migrations to a LOCAL throwaway PostgreSQL for development/testing.
# Mimics what Flyway does (schema "app" as default schema, files in version
# order, each in one transaction). Flyway remains the real migration tool.
#
# usage: PGHOST=... PGPORT=... PGUSER=... database/scripts/migrate_local.sh <dbname>
set -euo pipefail
DB="${1:?usage: migrate_local.sh <dbname>}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$HERE/dev/supabase_stub.sql"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "CREATE SCHEMA IF NOT EXISTS app;"

for f in $(ls "$HERE"/migrations/V*.sql | sort -V); do
  echo "applying $(basename "$f")"
  { echo "BEGIN;"; echo "SET search_path = app, public;"; cat "$f"; echo "COMMIT;"; } \
    | psql -v ON_ERROR_STOP=1 -q -d "$DB" -f -
done
echo "migrations applied to $DB"
