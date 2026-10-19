# ChaseHorse EMS — Complete API Contract Specification

**Base URL**: `/api/v1`  
**Authentication**: Supabase Auth Bearer JWT in `Authorization` header (`Bearer <access-token>`).  
**Role Taxonomy**: Server-authoritative via `app_role_assignments` table:
`ADMIN`, `MANAGER`, `OPERATIONS`, `EMPLOYEE`, `CUSTOMER`, `FIELD_WORKER`, `PARTNER`.

---

## 1. Authentication & System Health

### `GET /health`
- **Access**: Public (unauthenticated)
- **Response**: `200 OK`
  ```json
  { "status": "ok", "timestamp": "2026-10-19T07:15:00Z" }
  ```

### `GET /me`
- **Access**: Any authenticated user
- **Response**: `200 OK`
  ```json
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "email": "ravi@example.com",
    "accountStatus": "ACTIVE",
    "roles": ["FIELD_WORKER"]
  }
  ```

---

## 2. Workforce Tasks & Lifecycle Workflows

### `GET /tasks`
- **Access**: `ADMIN`, `MANAGER`, `OPERATIONS`, `CUSTOMER`, `EMPLOYEE`, `FIELD_WORKER`
- **Scoping**:
  - `CUSTOMER`: Automatically restricted to `customer_id = actorId`.
  - `EMPLOYEE` / `FIELD_WORKER`: Automatically restricted to `status = 'OPEN' OR assigned_to = actorId`.
  - `ADMIN` / `OPERATIONS` / `MANAGER`: Can inspect all or filter by `?customerId=...`.
- **Response**: `200 OK` (Array of TaskView)

### `GET /tasks/{id}`
- **Access**: Authenticated role-authorized
- **Scoping**: Rejects cross-tenant access with `403 Forbidden` if caller does not own the task or is not assigned to it.
- **Response**: `200 OK` (TaskView)

### `POST /tasks`
- **Access**: `ADMIN`, `MANAGER`, `OPERATIONS`, `CUSTOMER`
- **Request Body**:
  ```json
  {
    "title": "Storefront Shelf Stock Verification",
    "description": "Audit packaged goods arrangement and shelf tags.",
    "category": "Shelf audit",
    "priority": "HIGH",
    "checklistTemplateId": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "areaKey": "AP-VJA-CENTRAL",
    "address": "MG Road, Vijayawada",
    "dueAt": "2026-10-21T18:00:00Z",
    "rewardAmount": 150.00
  }
  ```
- **Response**: `200 OK` (TaskView)

### `POST /tasks/{taskId}/accept`
- **Access**: `ADMIN`, `OPERATIONS`, `EMPLOYEE`, `FIELD_WORKER`
- **Behavior**: Atomic conditional SQL update (`UPDATE tasks SET status='IN_PROGRESS', assigned_to=? WHERE id=? AND status='OPEN'`).
- **Conflict Handling**: Returns `409 Conflict` if already accepted by another worker.
- **Response**: `200 OK` (TaskView)

### `POST /tasks/{taskId}/assignment`
- **Access**: `ADMIN`, `MANAGER`, `OPERATIONS`
- **Request Body**: `{ "employeeId": "uuid" }`
- **Response**: `200 OK` (TaskView)

### `PATCH /tasks/{taskId}/status`
- **Access**: Role-validated
- **Behavior**: Enforces state machine transitions:
  `OPEN -> ASSIGNED -> IN_PROGRESS -> SUBMITTED -> IN_REVIEW -> APPROVED / REJECTED / CANCELLED`.
  Workers cannot self-approve (`403 Forbidden`). Terminal states cannot be transitioned (`400 Bad Request`).
- **Request Body**: `{ "status": "SUBMITTED" }`
- **Response**: `200 OK` (TaskView)

---

## 3. Checklists, Evidence & Manager Approval

### `GET /checklist-templates`
- **Access**: All Authenticated

### `POST /checklist-templates`
- **Access**: `ADMIN`, `OPERATIONS`, `MANAGER`

### `POST /evidence`
- **Access**: `ADMIN`, `OPERATIONS`, `EMPLOYEE`, `FIELD_WORKER`
- **Request Body**:
  ```json
  {
    "taskId": "uuid",
    "storagePath": "evidence/task-1/1729320000.jpg",
    "fileName": "photo.jpg",
    "contentType": "image/jpeg",
    "caption": "Shelf photo with GPS watermark",
    "locationLat": 16.5062,
    "locationLng": 80.6480
  }
  ```

### `POST /tasks/{taskId}/approval` (or `/approvals/{id}/decision`)
- **Access**: `ADMIN`, `MANAGER`, `OPERATIONS`
- **Behavior**: Verifies manager decision (`APPROVED`, `REJECTED`, `REWORK_REQUESTED`).
  On `APPROVED`, automatically credits the task bounty into the worker's wallet with an idempotent transaction key.
- **Request Body**:
  ```json
  {
    "decision": "APPROVED",
    "notes": "Verified photo meets illumination and GPS criteria."
  }
  ```

---

## 4. Wallet & Financial Ledger

### `GET /wallets/me`
- **Access**: `ADMIN`, `OPERATIONS`, `EMPLOYEE`, `FIELD_WORKER`
- **Response**: `200 OK` `{ "employeeId": "uuid", "balanceInr": 1250.00, "pendingInr": 0.00 }`

### `GET /wallets/{employeeId}/transactions`
- **Access**: `ADMIN`, `OPERATIONS`, or `actorId == employeeId`
- **Scoping**: Non-admin employees attempting to access another worker's wallet receive `403 Forbidden`.
- **Response**: `200 OK` (Array of WalletTransactionView)

### `POST /wallets/{employeeId}/adjust`
- **Access**: `ADMIN` only
- **Behavior**: Records append-only manual ledger adjustment with audit trail.

---

## 5. Transport Management System (TMS)

### `GET /tms/plans`
- **Access**: Public / All authenticated (Verified commercial fleet plans and base rates)

### `GET /tms/tracking/{bookingRef}`
- **Access**: Public / All authenticated
- **Security & Privacy**: Returns sanitized `PublicTrackingView`. Omit `totalPrice`, customer details, and driver private credentials.
- **Response**: `200 OK`
  ```json
  {
    "id": "uuid",
    "bookingRef": "CH-TRK-7711",
    "status": "IN_TRANSIT",
    "originAddress": "Vijayawada Central",
    "destinationAddress": "Guntur Terminal",
    "cargoDescription": "Agricultural Fertilisers",
    "cargoWeightKg": 1200.0,
    "createdAt": "2026-10-19T06:00:00Z",
    "events": [...]
  }
  ```

### `GET /tms/shipments`
- **Access**: `ADMIN`, `OPERATIONS`, `CUSTOMER`
- **Scoping**: `CUSTOMER` only receives their own shipments (`customer_id = actorId`).

### `POST /tms/shipments`
- **Access**: `CUSTOMER`, `ADMIN`
- **Behavior**: Server-authoritative freight pricing. The price is computed server-side (`baseRate + weight * ratePerKm`). Client-supplied prices are not trusted.

---

## 6. Employee & Customer Management

### `GET /employees`
- **Access**: `ADMIN`, `MANAGER`, `OPERATIONS`

### `PATCH /employees/{employeeId}/approval`
- **Access**: `ADMIN`, `MANAGER`, `OPERATIONS`
- **Security Check**: Elevated roles (`ADMIN`, `MANAGER`) can **only** be granted by an authenticated user with the `ADMIN` role. Non-admins attempting to escalate privileges receive `403 Forbidden`.

### `GET /customers`
- **Access**: `ADMIN`, `OPERATIONS`, `CUSTOMER`
- **Scoping**: `CUSTOMER` can only view their own record.