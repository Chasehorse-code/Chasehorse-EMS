# Database schema

Migration `V1__create_identity_and_approval_foundation.sql` creates:

- `users` with explicit account status, including `PENDING`.
- `roles` restricted to `ADMIN`, `MANAGER`, `EMPLOYEE`, and `CUSTOMER`.
- `user_roles` with the granting administrator recorded.
- `account_approvals` with the decision maker and reason.
- `audit_logs` for attributable administrative actions.

The migration intentionally does not define task columns. The blueprint marks
task fields, checklist templates, approval rules, evidence retention, and wallet
semantics as open decisions.

