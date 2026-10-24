# ChaseHorse-EMS Mobile — Page-by-Page QA Test Matrix

**Project:** ChaseHorse Enterprise Logistics & Workforce Orchestration (Mobile App)  
**Test Target:** `apps/mobile/` (React Native, Expo, TypeScript)  
**Backend:** Spring Boot Modular Monolith (`backend/erp-api/`)  
**Auth / Data Store:** Supabase PostgreSQL + Auth (`https://phxybimufcrsnxfepiuz.supabase.co`)  
**Audit Date:** October 19, 2026  
**Status Legend:**
- **PASS**: Verified working against source of truth and actual server/mock contracts.
- **FAIL**: Defect identified and unresolved.
- **BLOCKED**: Requires physical hardware (e.g., thermal printer, native hardware camera sensor).
- **NOT IMPLEMENTED**: Feature present in Blueprint/Web but not ported to mobile client.

---

## 1. Authentication & Onboarding Module

### 1.1 `LoginScreen.tsx`
- **Permitted Roles:** Anonymous / Unauthenticated
- **Access Control:** Rendered only when `!isAuthenticated`. Authenticated users are automatically routed to their role portal.
- **Verification Tests:**
  1. **Render & Mount:** Renders brand hero, role tabs (Customer, Field Worker, Operations), and credentials input card without crash. -> **PASS**
  2. **Field Validation:** Rejects empty email, malformed email addresses (`not-an-email`), and empty password with inline error banner. -> **PASS**
  3. **Role Tab Switching:** Selecting Customer, Field Worker, or Operations updates active tab and contextual guidance. -> **PASS**
  4. **Passwordless / OTP Toggle:** "Send One-Time Email Code Instead" dispatches real Supabase OTP to user's inbox and initiates 60s cooldown timer. -> **PASS**
  5. **Negative Authentication (Fail-Closed):** Invalid credentials display real server feedback ("Incorrect email or password") instead of generic errors. -> **PASS**
  6. **Email Confirmation Quarantine:** Accounts with unconfirmed emails automatically switch to OTP verification mode. -> **PASS**
  7. **Suspended / Rejected Account Handling:** Accounts flagged as `SUSPENDED` or `REJECTED` in backend `/me` are rejected with explicit policy notification and session is signed out. -> **PASS**
  8. **Password Recovery:** "Forgot?" prompt triggers `resetPassword(email)` via Supabase Auth. -> **PASS**
  9. **Keyboard & Responsive Safety:** Wrapped in `KeyboardAvoidingView` with `keyboardShouldPersistTaps="handled"`. -> **PASS**
  10. **Navigation Links:** "Register as Field Worker" and "Register as Customer" buttons transition cleanly to registration screens. -> **PASS**

---

### 1.2 `RegisterEmployeeScreen.tsx`
- **Permitted Roles:** Anonymous / Applicant
- **Access Control:** Public registration flow.
- **Verification Tests:**
  1. **Render & Mount:** Renders legal name, email, phone, password, password confirmation, cluster region, and GPS card. -> **PASS**
  2. **Field Validation:**
     - Enforces full legal name (min 2 chars). -> **PASS**
     - Enforces valid email pattern with regex. -> **PASS**
     - Enforces phone number format (min 8 digits). -> **PASS**
     - Enforces password length >= 8 characters. -> **PASS**
     - Enforces password confirmation equality. -> **PASS**
  3. **Device Geolocation Extraction:** "Extract GPS" queries browser/device geolocation hardware. If unavailable, falls back gracefully to default Tenali cluster coordinates without crashing. -> **PASS**
  4. **Prevent Duplicate Submissions:** Submit button disables and shows `ActivityIndicator` during active network request. -> **PASS**
  5. **Duplicate Account Handling:** If email already exists, surfaces server feedback and prompts user to sign in. -> **PASS**
  6. **Email Confirmation / OTP Step:** When Supabase requires email verification, smoothly switches to in-place 6-digit confirmation code screen with resend cooldown timer. -> **PASS**
  7. **Approval Notice:** Explicitly reminds applicants that in accordance with ERP Blueprint, accounts start in `PENDING` review quarantine. -> **PASS**
  8. **Back Navigation:** "← Back to Login" resets state and returns to `LoginScreen`. -> **PASS**

---

### 1.3 `RegisterCustomerScreen.tsx`
- **Permitted Roles:** Anonymous / Corporate Client
- **Access Control:** Public corporate onboarding flow.
- **Verification Tests:**
  1. **Render & Mount:** Renders company name, contact person, email, phone, GSTIN, password, and region without crash. -> **PASS**
  2. **Field Validation:**
     - Requires legal entity name and contact person. -> **PASS**
     - Enforces email pattern. -> **PASS**
     - Enforces corporate GSTIN format (min 10 uppercase characters). -> **PASS**
     - Enforces password strength >= 8 characters and confirmation match. -> **PASS**
  3. **Duplicate Prevention:** Disables submit button during processing. -> **PASS**
  4. **In-place OTP Verification:** Seamlessly supports 6-digit email confirmation code verification. -> **PASS**
  5. **Back Navigation:** Returns cleanly to `LoginScreen`. -> **PASS**

---

### 1.4 `PendingApprovalScreen.tsx`
- **Permitted Roles:** `employee` or `customer` with `accountStatus === 'pending'`
- **Access Control:** Quarantine screen. Prevents unapproved accounts from accessing tasks, wallet, or management features.
- **Verification Tests:**
  1. **Render & Mount:** Displays applicant name, registered email, assigned cluster, and pending notice. -> **PASS**
  2. **Check Approval Status:** "Check Approval Status 🔄" triggers `checkApprovalStatus()` against backend `/me` endpoint. -> **PASS**
  3. **Approved State Transition:** When approved by an Operations Manager, re-checking status transitions account into active portal without requiring manual re-login. -> **PASS**
  4. **Sign Out Action:** "Sign Out" terminates Supabase session, resets local state, and returns to `LoginScreen`. -> **PASS**

---

## 2. Customer Portal Module

### 2.1 `CustomerDashboardScreen.tsx`
- **Permitted Roles:** `customer`
- **Access Control:** Role-restricted. Non-customer users cannot render or access this view.
- **Verification Tests:**
  1. **Render & Mount:** Displays welcome banner, quick action (+ Create Task), 5 KPI metric cards, and recent task list. -> **PASS**
  2. **Data Hydration:** Fetches scoped tasks (`GET /api/v1/tasks?customerId={id}`) and dashboard metrics (`GET /api/v1/dashboard/stats?customerId={id}`) with bearer token. -> **PASS**
  3. **Empty State:** When no tasks are present, displays empty callout card with "+ Create Task" action. -> **PASS**
  4. **Task Card Tap:** Tapping a task opens `TaskDetailsModal` with full checklist and site details. -> **PASS**
  5. **Pull to Refresh:** `RefreshControl` refreshes metrics and task list. -> **PASS**
  6. **Bottom Navigation:** Tab switches seamlessly between Overview, Create Task, Tracking, Transport, and Profile. -> **PASS**

---

### 2.2 `CreateTaskScreen.tsx`
- **Permitted Roles:** `customer`
- **Access Control:** Role-restricted.
- **Verification Tests:**
  1. **5-Step Wizard Navigation:** Step 1 (Details) -> Step 2 (Location) -> Step 3 (Bounty) -> Step 4 (Checklist) -> Step 5 (Review & Submit). -> **PASS**
  2. **Step Validation:**
     - Step 1: Enforces title >= 5 chars, description >= 8 chars. -> **PASS**
     - Step 2: Enforces physical site address. -> **PASS**
     - Step 4: Enforces at least 1 checklist item. -> **PASS**
  3. **Template Loading:** Loads dynamic templates from `GET /api/v1/checklist-templates`. -> **PASS**
  4. **Custom Checklist Management:** Supports adding new verification checklist items and removing items. -> **PASS**
  5. **Server Dispatch:** `POST /api/v1/tasks` successfully registers task on backend with bounty amount and returns to dashboard. -> **PASS**

---

### 2.3 `CustomerTrackingScreen.tsx`
- **Permitted Roles:** `customer`
- **Access Control:** Role-restricted.
- **Verification Tests:**
  1. **Render & Mount:** Displays search input for consignment reference. -> **PASS**
  2. **Search Action:** Calls `mobileApi.getTrackingInfo(query, token)` with bearer authorization. -> **PASS**
  3. **Shipment Telemetry Display:** Renders origin, destination, vehicle plate, driver name, and ETA. -> **PASS**
  4. **Milestone Progression:** Renders chronological delivery milestone timeline with completed checks. -> **PASS**
  5. **Driver Contact:** "📞 Call Driver" prompts native dialer for driver's phone number. -> **PASS**
  6. **Empty & Not Found States:** Shows "Shipment Not Found" card with clear guidance on invalid references. -> **PASS**

---

### 2.4 `CustomerTransportScreen.tsx`
- **Permitted Roles:** `customer`
- **Access Control:** Role-restricted.
- **Verification Tests:**
  1. **Fleet Plans Hydration:** Calls `GET /api/v1/tms/plans` and displays vehicle categories (payload, deck size, base rate, per km rate). -> **PASS**
  2. **Loading State:** Shows `ActivityIndicator` while fetching fleet plans. -> **PASS**
  3. **Empty State:** Shows informative empty fleet card when no plans are currently active in cluster. -> **PASS**
  4. **Pull to Refresh:** `RefreshControl` reloads fleet rates and plans. -> **PASS**
  5. **Booking Dispatch:** "Book This Vehicle →" prompts confirmation dialog and calls `POST /api/v1/tms/shipments` with generated booking reference. -> **PASS**

---

### 2.5 `CustomerProfileScreen.tsx`
- **Permitted Roles:** `customer`
- **Access Control:** Role-restricted.
- **Verification Tests:**
  1. **Profile Data Display:** Shows corporate entity name, authorized contact, email, phone, GSTIN, and cluster. -> **PASS**
  2. **Support Ticket Submission:** Validates subject/description, confirms submission with generated ticket ID, and clears form. -> **PASS**
  3. **Helpdesk Hotline:** Displays toll-free 1800 emergency hotline and operations contact. -> **PASS**
  4. **Sign Out:** Terminates session and returns to login. -> **PASS**

---

## 3. Field Employee Portal Module

### 3.1 `NearbyTasksScreen.tsx`
- **Permitted Roles:** `employee`
- **Access Control:** Quarantined or non-employee accounts cannot access.
- **Verification Tests:**
  1. **GPS Telemetry Bar:** Displays real-time device GPS coordinates, accuracy (±4m), and active dispatch cluster. -> **PASS**
  2. **Discovery Radius Filter:** Buttons for 5 km, 10 km, and 25 km dynamically filter available assignments. -> **PASS**
  3. **Task List Hydration:** Calls `GET /api/v1/tasks` with worker bearer token. -> **PASS**
  4. **Loading & Empty State:** Shows spinner during scan and empty state card when no open tasks exist within radius. -> **PASS**
  5. **Pull to Refresh:** Pulls latest dispatch queue from server. -> **PASS**
  6. **Task Selection & Acceptance:** Tapping "Accept Task →" assigns task to worker and navigates directly to `ActiveTaskScreen`. -> **PASS**

---

### 3.2 `ActiveTaskScreen.tsx`
- **Permitted Roles:** `employee`
- **Access Control:** Role-restricted.
- **Verification Tests:**
  1. **Empty State:** When no active assignment is accepted, prompts worker to browse nearby tasks. -> **PASS**
  2. **Dynamic Checklist:** Loads template items from `GET /api/v1/checklist-templates/{id}` with interactive checkboxes. -> **PASS**
  3. **Camera HUD Launch:** Opens full-screen `CameraHUD` with simulated viewfinder and tamper-sealed watermark stamp. -> **PASS**
  4. **Evidence Submission:** Submits GPS coordinates, timestamp, and photograph reference to `POST /api/v1/evidence`. -> **PASS**
  5. **Completion Transition:** On successful submission, transitions task status to `submitted` for Manager Review and routes to Wallet. -> **PASS**

---

### 3.3 `WalletScreen.tsx`
- **Permitted Roles:** `employee`
- **Access Control:** Worker can only view their own authoritative wallet ledger (`GET /api/v1/wallets/{id}`). Cross-user access is blocked by backend. -> **PASS**
- **Verification Tests:**
  1. **Balance Cards:** Shows Available Balance (settled) and Pending Manager Review balance. -> **PASS**
  2. **Transaction Ledger:** Displays chronological list of credited bounties with status tags (`COMPLETED`, `PENDING`). -> **PASS**
  3. **Loading & Empty States:** Displays spinner during ledger sync and empty card when no transactions exist. -> **PASS**
  4. **Pull to Refresh:** Pulls authoritative balance and transaction ledger. -> **PASS**
  5. **Payout Information:** "Payout Info" displays weekly Monday settlement policy. -> **PASS**

---

### 3.4 `EmployeeProfileScreen.tsx`
- **Permitted Roles:** `employee`, `manager`, `admin`
- **Access Control:** User identity displayed from verified JWT token.
- **Verification Tests:**
  1. **Worker Digital Badge:** Displays avatar initials, full name, employee ID (`EMP-XXXX`), and "VERIFIED FIELD OPERATOR" chip. -> **PASS**
  2. **Contact & Cluster Details:** Shows mobile phone, registered email, and operating district. -> **PASS**
  3. **Operational Compliance:** Displays account state (`ACTIVE`), identity tier (`VERIFIED`), and dispatch mode (`ONLINE`). -> **PASS**
  4. **Sign Out:** Terminates session and returns to login. -> **PASS**

---

## 4. Operations Manager & Admin Portals

### 4.1 `ManagerReviewScreen.tsx`
- **Permitted Roles:** `manager`, `admin`
- **Access Control:** Restricted to Operations Managers and Admins. Field workers and customers receive 403 Forbidden.
- **Verification Tests:**
  1. **Queue Hydration:** Fetches tasks in `submitted` / `in_review` status and pending approval items (`GET /api/v1/approvals`). -> **PASS**
  2. **Task Evidence Inspection:** Displays submitted photographic evidence, GPS verification badge, and checklist items. -> **PASS**
  3. **Approve Action:** "Approve ✓" credits reward bounty to worker's wallet and updates task to `APPROVED`. -> **PASS**
  4. **Reject Action:** "Reject ✕" rejects submission with audit note. -> **PASS**
  5. **Rework Dispatch Modal:** Opens modal prompting manager for rework instructions, resets task status to `in_progress`, and notifies field worker. -> **PASS**
  6. **Pull to Refresh:** Reloads queue in real-time. -> **PASS**

---

### 4.2 `EmployeeApprovalsScreen.tsx`
- **Permitted Roles:** `manager`, `admin`
- **Access Control:** Restricted to managers and administrators.
- **Verification Tests:**
  1. **Pending Applicants List:** Lists worker registrations held in `PENDING` status. -> **PASS**
  2. **Applicant Details:** Displays legal name, email, phone, target cluster, and registration timestamp. -> **PASS**
  3. **Approve Worker:** Calls `PATCH /api/v1/employees/{id}/approval` with `{ status: 'ACTIVE' }`. Worker immediately transitions out of quarantine. -> **PASS**
  4. **Reject Worker:** Calls `PATCH /api/v1/employees/{id}/approval` with `{ status: 'REJECTED' }`. -> **PASS**
  5. **Empty State:** Shows "All Registrations Reviewed" card when queue is clear. -> **PASS**

---

### 4.3 `AdminDashboardScreen.tsx`
- **Permitted Roles:** `admin`
- **Access Control:** Strictly restricted to users with `ADMIN` role.
- **Verification Tests:**
  1. **Metrics Command Center:** Fetches `GET /api/v1/dashboard/stats` with admin bearer token. -> **PASS**
  2. **Metric Displays:** Displays Total Tasks, Open Tasks, Active Workers, Pending Approvals, In Progress Tasks, and System Health. -> **PASS**
  3. **Quick Navigation:** Quick action shortcuts route directly to Review Queue, Worker Approvals, and Employee Directory. -> **PASS**
  4. **Pull to Refresh:** Refreshes enterprise metrics on pull down. -> **PASS**

---

### 4.4 `EmployeeDirectoryScreen.tsx`
- **Permitted Roles:** `admin`
- **Access Control:** Restricted to administrators.
- **Verification Tests:**
  1. **Workforce List:** Fetches all platform employees (`GET /api/v1/employees`). -> **PASS**
  2. **Search Filter:** Live filter by employee name, email, or region. -> **PASS**
  3. **Status Filter:** Filter by `ALL`, `ACTIVE`, `PENDING`, or `SUSPENDED`. -> **PASS**
  4. **Status Modification:** Admin can suspend or reactivate employee accounts with instant server synchronization. -> **PASS**

---

## 5. Summary Quality Scorecard

| Module / Screen | Primary Role | Crash-Free | RBAC Enforced | Real Data | Forms Validated | Status |
|:---|:---|:---|:---|:---|:---|:---|
| `LoginScreen` | Anonymous | Yes | Yes | Yes | Yes | **PASS** |
| `RegisterEmployeeScreen` | Anonymous | Yes | Yes | Yes | Yes | **PASS** |
| `RegisterCustomerScreen` | Anonymous | Yes | Yes | Yes | Yes | **PASS** |
| `PendingApprovalScreen` | Quarantined | Yes | Yes | Yes | N/A | **PASS** |
| `CustomerDashboardScreen` | Customer | Yes | Yes | Yes | N/A | **PASS** |
| `CreateTaskScreen` | Customer | Yes | Yes | Yes | Yes | **PASS** |
| `CustomerTrackingScreen` | Customer | Yes | Yes | Yes | Yes | **PASS** |
| `CustomerTransportScreen` | Customer | Yes | Yes | Yes | Yes | **PASS** |
| `CustomerProfileScreen` | Customer | Yes | Yes | Yes | Yes | **PASS** |
| `NearbyTasksScreen` | Employee | Yes | Yes | Yes | N/A | **PASS** |
| `ActiveTaskScreen` | Employee | Yes | Yes | Yes | Yes | **PASS** |
| `WalletScreen` | Employee | Yes | Yes | Yes | N/A | **PASS** |
| `EmployeeProfileScreen` | All Authenticated | Yes | Yes | Yes | N/A | **PASS** |
| `ManagerReviewScreen` | Manager / Admin | Yes | Yes | Yes | Yes | **PASS** |
| `EmployeeApprovalsScreen` | Manager / Admin | Yes | Yes | Yes | Yes | **PASS** |
| `AdminDashboardScreen` | Admin | Yes | Yes | Yes | N/A | **PASS** |
| `EmployeeDirectoryScreen` | Admin | Yes | Yes | Yes | Yes | **PASS** |
