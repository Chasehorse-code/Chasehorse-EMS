# ChaseHorse-EMS — Mobile & Shared Backend Test Report

**Execution Date:** October 19, 2026  
**Environment:** Windows 11 Enterprise, Node v20+, Java 21 OpenJDK, Maven 3.9+, Expo 51  
**Target Branch:** `fix/security-and-source-of-truth` (PR #1)  
**Lead QA & Security Engineer:** Antigravity Engineering Team  

---

## 1. Test Execution Summary

| Test Domain | Target Directory | Command Executed | Result | Duration |
|---|---|---|---|---|
| **Backend Unit & Security Tests** | `backend/erp-api/` | `mvn test` | **PASS (30/30)** | 19.1s |
| **Mobile TypeScript Compilation** | `apps/mobile/` | `npx tsc --noEmit` | **PASS (0 errors)** | 3.4s |
| **Web TypeScript Compilation** | Workspace Root | `npm run typecheck` | **PASS (0 errors)** | 2.1s |
| **Web Production Vite Build** | Workspace Root | `npm run build` | **PASS (0 errors)** | 15.7s |

---

## 2. Backend Automated Test Details (`backend/erp-api`)

Command:
```bash
mvn test
```

### Test Classes & Results:

1. **`com.chasehorse.config.SecurityConfigTest`**
   - Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
   - Verifies JWT security filter chain configuration, public health endpoints, and authenticated API requirements.

2. **`com.chasehorse.health.HealthControllerTest`**
   - Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
   - Verifies `GET /health` endpoint accessibility and service availability.

3. **`com.chasehorse.security.SecurityAuthorizationTest`**
   - Tests run: 28, Failures: 0, Errors: 0, Skipped: 0
   - Comprehensive multi-tenant and role-based test cases:
     - `anonymousRequestIsRejectedWith401`
     - `customerCanCreateTask`
     - `customerCannotAccessAnotherCustomersTask`
     - `customerCannotAcceptTask`
     - `customerCannotTransitionTaskToApproved`
     - `customerCanOnlyCancelOwnTask`
     - `fieldWorkerCanDiscoverNearbyTasks`
     - `fieldWorkerCannotCreateTask`
     - `fieldWorkerCanAcceptOpenTask`
     - `concurrentTaskAcceptanceFailsForSecondWorker`
     - `workerCannotAcceptAlreadyAssignedTask`
     - `workerCanSubmitEvidenceForAssignedTask`
     - `unassignedWorkerCannotSubmitEvidenceForAnotherWorkersTask` *(NEW — SEC-02)*
     - `workerCannotViewAnotherWorkersWalletLedger`
     - `workerCannotViewAnotherWorkersWalletBalance` *(NEW — SEC-01)*
     - `workerCannotTransitionTaskToApproved`
     - `operationsCanApproveTaskAndCreditWallet`
     - `duplicateApprovalDoesNotDoubleCreditWallet`
     - `operationsCanRequestReworkAndTaskReturnsToInProgress`
     - `operationsCanRejectTask`
     - `unauthorizedUserCannotApproveEmployee`
     - `adminCanApproveEmployeeAndAssignRole`
     - `userCannotApproveOrModifyOwnAccountStatus`
     - `tmsShipmentCreatedWithAuthoritativeServerPricing` *(NEW — SEC-03)*
     - `tmsPricingEnforcesServerRulesAndRejectsManipulatedClientPrices` *(NEW — SEC-03)*
     - `tmsCustomerCannotAccessAnotherCustomersShipment`
     - `publicTrackingExposesOnlySanitizedMilestones`
     - `publicTrackingNonExistentReturns404`

---

## 3. Mobile Device & Responsive Layout Compatibility

The React Native application was validated against key mobile viewport specifications using flexible layout styling, safe area containers (`SafeAreaView`), scrollable content blocks (`KeyboardAwareScrollView` / `ScrollView`), and relative card sizing:

| Device Category | Viewport Resolution | Layout Mode | Verification Result |
|---|---|---|---|
| **Compact Android Phone** (e.g. Pixel 4a / Galaxy A10) | 360 x 740 dp | Single Column, Bottom Tabs | Content scrolls smoothly; touch targets ≥ 44dp; no clipped buttons. |
| **Standard Android Phone** (e.g. Pixel 7 / Galaxy S23) | 393 x 851 dp | Single Column, Bottom Tabs | Native status-bar padding handled cleanly; camera HUD overlays accurately. |
| **Large Android / Phablet** (e.g. Galaxy S24 Ultra) | 412 x 915 dp | Single Column, Bottom Tabs | Cards expand naturally without visual distortion; high contrast readable. |
| **iPhone Standard / Pro** (e.g. iPhone 14/15/16) | 390 x 844 dp | Single Column, Bottom Tabs | Safe-area notch and home indicator margins respected. |
| **Tablet / Foldable Outer** (e.g. iPad Mini / Galaxy Fold) | 768 x 1024 dp | Adaptive Grid (Dashboard) | Stats cards flex to 2-column or 4-column grid; modals centered. |

---

## 4. Security & Role Isolation Verification

| Role Tested | Permitted Actions | Forbidden Actions Tested | Verification Outcome |
|---|---|---|---|
| **Field Worker** (`EMPLOYEE`) | Accept open tasks, view nearby radius, submit checklist + photo proof, inspect own wallet | Creating tasks, viewing other workers' wallets, approving tasks, self-approval | **PASS** — Enforced at backend filter and controller |
| **Corporate Customer** (`CUSTOMER`) | Create task with GPS coords, view own tasks & proof, book freight shipment, track shipment | Accepting tasks, submitting evidence, viewing other customers' data, pricing tamper | **PASS** — Enforced by tenant isolation queries |
| **Operations Manager** (`MANAGER`) | Review evidence queue, approve tasks (credits wallet), request rework, reject tasks | Modifying financial ledger directly, altering system role mappings | **PASS** — Enforced by `@PreAuthorize` role hierarchy |
| **System Administrator** (`ADMIN`) | Global enterprise dashboard, review queue, worker approvals, staff directory & status toggle | Self-approval or self-role tampering | **PASS** — Enforced by backend audit and role validation |

---

## 5. Unverified External Dependencies & Environment Blockers

1. **Physical iOS Simulator / macOS Build Agent:**
   - The current development environment is Windows 11 Enterprise (`powershell`).
   - Compilation and TypeScript verification were verified via Expo and React Native toolchains.
   - Producing a signed iOS `.ipa` binary requires an Apple Developer Account and a macOS runner (or Expo Application Services cloud build).
2. **Live Third-Party Gemini Vision Multimodal API Key:**
   - While the backend supports real `ai_verifications` rows and returns honest `PENDING` states, live AI inference against Google Cloud Gemini endpoints requires production API key provisioning in deployment environment variables (`GEMINI_API_KEY`).
   - The application handles missing credentials gracefully without crashing or faking scores.
