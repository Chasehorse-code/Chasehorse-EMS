# Requirements and scope

## Foundation requirements

- Employees may register, but their account remains pending until approval.
- Only an administrator can grant manager privileges.
- Tasks will require checklists, but the task field contract is not finalized.
- Evidence must be stored privately and must not be exposed by client credentials.
- AI verification and operations-manager approval are separate decisions.
- Wallet credits occur only after every configured approval condition passes.
- Unconfirmed task fields must not be invented.

## Current status

This initial foundation contains project shells, identity/approval migration
tables, a backend health endpoint, OpenAPI documentation, and a backend test.
It does not implement authentication, authorization enforcement, task execution,
checklists, evidence upload, AI verification, manager approval, wallet credits,
or production infrastructure.

