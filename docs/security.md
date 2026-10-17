# Security baseline

- Never place credentials or Supabase service-role keys in mobile or web apps.
- Keep evidence in private object storage; grant access only through
  server-authorized, short-lived URLs.
- Enforce role and account-status checks on the API, not only in the UI.
- Do not allow self-promotion to manager.
- Keep AI verification as an advisory decision separate from operations-manager
  approval.
- Make wallet crediting an idempotent, audited server-side operation gated by
  all required approvals.
- Record administrative decisions in an audit log.

This is a design baseline, not a completed security review or production
security certification.

