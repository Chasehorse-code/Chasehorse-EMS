# Security checklist before production

- [ ] Rotate any database password shared in chat or committed accidentally.
- [ ] Configure database credentials in the hosting platform's server-side secret manager.
- [ ] Use a dedicated least-privilege PostgreSQL application role; do not run the API as the postgres superuser.
- [ ] Verify Supabase JWT signature, issuer, audience and expiry against the project's current Auth configuration.
- [ ] Provision application profiles and roles through a trusted process; never accept role changes from user-submitted profile fields.
- [ ] Implement server-side role and resource authorization for every business endpoint.
- [ ] Review RLS policies and grants. RLS being enabled with no policies intentionally denies Data API access.
- [ ] Keep evidence storage private and use short-lived signed URLs.
- [ ] Make wallet ledger writes append-only, transactional and idempotent; never allow client-side credits.
- [ ] Configure rate limiting, CORS allowlists, secure headers, logs without tokens/PII, backups and monitoring.
- [ ] Run dependency, static analysis, integration and authorization tests.
- [ ] Test schema migrations against staging and back up production before applying them.

A passing health endpoint is not proof that the database or business workflows are connected.