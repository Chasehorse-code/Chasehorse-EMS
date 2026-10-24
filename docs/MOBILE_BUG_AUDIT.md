# ChaseHorse-EMS Mobile — Critical Bug Audit Report
**Target System:** ChaseHorse Field Operations Mobile Application (`apps/mobile/`)  
**Backend:** Spring Boot Modular Monolith (`backend/erp-api/`)  
**Authentication & Storage:** Supabase Auth & Storage (`https://phxybimufcrsnxfepiuz.supabase.co`)  
**Audit Date:** October 19, 2026  
**Auditor:** Senior Mobile, Backend & Application Security QA Lead  

---

## 1. Executive Summary
During the comprehensive audit of the ChaseHorse-EMS mobile application, multiple critical bugs preventing user registration, authentication, state persistence, responsive rendering, and module integration were identified and reproduced. 

All root causes were traced to their source in the mobile client code, Supabase client initialization, REST API signatures, and missing interactive verification UX. Every identified defect has been resolved in the codebase, confirmed via automated unit, integration, and TypeScript verification checks, and tested across all mobile personas (Customer, Field Worker, Operations Manager, and Administrator).

---

## 2. Reproduced Defects, Root Causes & Fixes

### BUG-01: Mobile Registration and Login Silent Failure Due to Missing Environment Configuration
- **Severity:** CRITICAL / BLOCKER
- **Affected Files:**
  - `apps/mobile/.env`
  - `apps/mobile/src/config/supabase.ts`
  - `apps/mobile/src/context/AuthContext.tsx`
- **Reproduction Steps:**
  1. Launch mobile app via Metro bundler (`npm start`).
  2. Attempt to sign in or register on `LoginScreen.tsx`, `RegisterEmployeeScreen.tsx`, or `RegisterCustomerScreen.tsx`.
  3. The operation immediately crashes or alerts "Sign In Failed: Invalid credentials or network issue".
- **Root Cause:**
  `apps/mobile` was completely missing a local `.env` configuration file. In `supabase.ts`, `process.env.EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` resolved to `undefined`. `supabase.ts` attempted to instantiate the client with `https://chasehorse-placeholder.supabase.co.invalid`, causing every network request to throw an unconfigured host resolution exception.
- **Fix Implemented:**
  1. Created `apps/mobile/.env` containing valid environment parameters:
     ```env
     EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
     EXPO_PUBLIC_SUPABASE_URL=https://phxybimufcrsnxfepiuz.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OKwNl5c5VD_IKZHi7rL_AQ_rciWCKSp
     ```
  2. Hardened `supabase.ts` with explicit fallback validation so it never attempts requests to `.invalid` endpoints and fails cleanly with descriptive diagnostic feedback when environment variables are missing.
- **Test Result:** **PASS** (Confirmed via `node apps/mobile/scripts/test-mobile-auth-and-qa.mjs` Suite 1 & 3).

---

### BUG-02: Server Error Suppression and Generic Error Masking in Login Flow
- **Severity:** HIGH
- **Affected Files:**
  - `apps/mobile/src/screens/auth/LoginScreen.tsx`
  - `apps/mobile/src/context/AuthContext.tsx`
- **Reproduction Steps:**
  1. Enter an unconfirmed email, wrong password, or suspended account on `LoginScreen`.
  2. Tap "Sign In to Portal".
  3. Screen displays a generic alert: "Sign In Failed: Invalid credentials or network issue", completely concealing whether the email was unconfirmed, the password was incorrect, or the account was suspended/rejected.
- **Root Cause:**
  `LoginScreen.tsx` caught all errors in a catch block and discarded `err.message`:
  ```typescript
  catch (err) {
    Alert.alert('Sign In Failed', 'Invalid credentials or network issue.');
  }
  ```
  Additionally, `AuthContext.tsx` did not distinguish between `EMAIL_NOT_CONFIRMED`, invalid credentials, and account status quarantine.
- **Fix Implemented:**
  1. Refactored `AuthContext.login`:
     - Preserves specific error messages from Supabase (`Invalid login credentials`, `Email not confirmed`).
     - Detects `EMAIL_NOT_CONFIRMED` and sets error code for automated OTP transition.
     - Checks user profile status from backend `/me`: if `suspended` or `rejected`, aborts session and surfaces explicit explanation.
  2. Upgraded `LoginScreen.tsx` with an inline error banner (`errorMessage`) and alert handling that displays actual server error text.
  3. Added automatic transition to the 6-digit OTP verification view when `EMAIL_NOT_CONFIRMED` is detected.
- **Test Result:** **PASS** (Verified with Suite 4 & manual test vectors).

---

### BUG-03: Missing Field Worker Password Handling & Broken OTP Sign-In
- **Severity:** HIGH
- **Affected Files:**
  - `apps/mobile/src/screens/auth/LoginScreen.tsx`
  - `apps/mobile/src/context/AuthContext.tsx`
- **Reproduction Steps:**
  1. Switch role toggle to "Field Worker".
  2. Button label changed to "Send Security OTP →", but clicking it invoked `login(email, password, 'employee')` which called `supabase.auth.signInWithPassword`.
  3. If password was empty, Supabase rejected the request, but the user expected an OTP email to be dispatched.
- **Root Cause:**
  `LoginScreen.tsx` attempted password sign-in even when displaying an OTP label, and `AuthContext.tsx` lacked dedicated `signInWithOtp(email)` and `resendOtp(email)` methods.
- **Fix Implemented:**
  1. Added `signInWithOtp(email)` and `resendOtp(email, type)` to `AuthContext.tsx` using native Supabase Auth methods.
  2. Updated `LoginScreen.tsx` so all roles can sign in with Password by default, while providing an explicit "Send One-Time Email Code Instead" action for passwordless / OTP authentication.
  3. Added a 60-second cooldown timer on the OTP resend button.
- **Test Result:** **PASS** (Verified with `test-mobile-auth-and-qa.mjs` Suite 2 & 4).

---

### BUG-04: Registration Traps Users in Unverified State Without OTP Input Flow
- **Severity:** HIGH
- **Affected Files:**
  - `apps/mobile/src/screens/auth/RegisterEmployeeScreen.tsx`
  - `apps/mobile/src/screens/auth/RegisterCustomerScreen.tsx`
  - `apps/mobile/src/context/AuthContext.tsx`
- **Reproduction Steps:**
  1. Submit registration as a Field Worker or Customer.
  2. If Supabase Auth email confirmation is enabled, the account is created, but no session is returned.
  3. Mobile screen previously showed an alert and popped back to `LoginScreen`, leaving the user with an unconfirmed email and no UI to input the confirmation code sent to their email.
  4. Subsequent sign-in attempts failed with `Email not confirmed`.
- **Root Cause:**
  `registerEmployee` and `registerCustomer` returned `void`, ignoring whether email verification was required, and neither registration screen implemented a verification code input step.
- **Fix Implemented:**
  1. Updated `registerEmployee` and `registerCustomer` to return `{ needsEmailVerification: boolean; email: string }`.
  2. In both `RegisterEmployeeScreen.tsx` and `RegisterCustomerScreen.tsx`, implemented an in-place OTP verification step:
     - 6-digit confirmation code input.
     - "Confirm Code & Submit" button calling `verifyOtp(email, code, 'signup')`.
     - Resend code button with 60s cooldown timer.
     - Clean navigation only upon successful email confirmation.
- **Test Result:** **PASS** (Verified with Suite 2 & export bundle build).

---

### BUG-05: REST API Method Signature Mismatch in Dashboard Stats & Unauthenticated TMS Requests
- **Severity:** HIGH
- **Affected Files:**
  - `apps/mobile/src/api/restApi.ts`
  - `apps/mobile/src/screens/admin/AdminDashboardScreen.tsx`
  - `apps/mobile/src/screens/manager/ManagerReviewScreen.tsx`
  - `apps/mobile/src/screens/employee/NearbyTasksScreen.tsx`
- **Reproduction Steps:**
  1. Sign in as Admin and load `AdminDashboardScreen.tsx`.
  2. Screen previously called `mobileApi.getDashboardStats(user?.token)`.
  3. `restApi.ts` declared `getDashboardStats(customerId?: string, token?: string)`.
  4. The JWT token was passed as `customerId`, producing the URL `/dashboard/stats?customerId=eyJhbGciOi...` without an `Authorization` header, triggering a 401 Unauthorized or UUID parsing exception on the Spring Boot backend.
  5. Similarly, `NearbyTasksScreen` and `ManagerReviewScreen` called `listTasks()`, `approveTask()`, and `rejectTask()` without forwarding `user?.token`.
- **Root Cause:**
  Arity mismatch in `getDashboardStats` and missing token parameter injection in task discovery and manager action handlers.
- **Fix Implemented:**
  1. Overloaded `getDashboardStats` in `restApi.ts` to accept either an options object `{ customerId, token }`, a token string, or `(customerId, token)`.
  2. Updated `AdminDashboardScreen.tsx` to pass `undefined, user?.token`.
  3. In `NearbyTasksScreen.tsx`, imported `useAuth()`, attached `user?.token` to `listTasks`, and added `RefreshControl` and an empty state card.
  4. In `ManagerReviewScreen.tsx`, forwarded `user?.token` to `listTasks`, `approveTask`, `rejectTask`, and `updateTaskStatus`.
- **Test Result:** **PASS** (Confirmed via `npm run typecheck` and `verify-all-modules.mjs`).

---

### BUG-06: Blank States on Customer Transport and Worker Wallet Screens
- **Severity:** MEDIUM
- **Affected Files:**
  - `apps/mobile/src/screens/customer/CustomerTransportScreen.tsx`
  - `apps/mobile/src/screens/employee/WalletScreen.tsx`
- **Reproduction Steps:**
  1. Navigate to "Transport" tab as Customer when no truck plans are returned or during initial loading.
  2. Navigate to "Wallet" tab as Worker when transactions array is empty.
  3. Screen rendered completely blank below the header with no loading spinner, pull-to-refresh, or informational card.
- **Root Cause:**
  Components directly mapped over arrays (`plans.map(...)`, `txns.map(...)`) without guarding for `loading` or `length === 0`.
- **Fix Implemented:**
  1. Added `ActivityIndicator` loading state in both screens.
  2. Added informative empty state cards explaining next steps (e.g. "No open transport plans" and "No transactions recorded yet").
  3. Added `RefreshControl` pull-to-refresh on `ScrollView`.
- **Test Result:** **PASS** (Confirmed via UI inspection and build export).

---

### BUG-07: Pending Approval Quarantine Trapped Users Without Status Refresh
- **Severity:** MEDIUM
- **Affected Files:**
  - `apps/mobile/src/screens/auth/PendingApprovalScreen.tsx`
  - `apps/mobile/src/context/AuthContext.tsx`
- **Reproduction Steps:**
  1. User registers as Field Worker and enters Pending Approval quarantine.
  2. Operations Manager approves the applicant on the backend / admin directory.
  3. Worker had no way to refresh their status without completely logging out and logging back in.
- **Root Cause:**
  `PendingApprovalScreen` only provided a "Sign Out" button, and `AuthContext` lacked a method to re-evaluate the active profile status against `/me`.
- **Fix Implemented:**
  1. Added `checkApprovalStatus()` in `AuthContext.tsx` which retrieves the current session, re-fetches `/me`, and updates `user`.
  2. Added "Check Approval Status 🔄" button in `PendingApprovalScreen.tsx` with loading indicator and instant feedback.
- **Test Result:** **PASS** (Verified with unit test Suite 5).

---

### BUG-08: Form Input Occlusion and Keyboard Clipping on Mobile Viewports
- **Severity:** MEDIUM
- **Affected Files:**
  - `apps/mobile/src/screens/auth/LoginScreen.tsx`
  - `apps/mobile/src/screens/auth/RegisterEmployeeScreen.tsx`
  - `apps/mobile/src/screens/auth/RegisterCustomerScreen.tsx`
- **Reproduction Steps:**
  1. Focus on the bottom inputs (e.g. Password Confirmation, Assigned Cluster) on mobile devices or emulators.
  2. Soft keyboard opens and obscures the input fields and submit button.
- **Root Cause:**
  Screens lacked `KeyboardAvoidingView` wrappers and had fixed height containers instead of `keyboardShouldPersistTaps="handled"` scroll views.
- **Fix Implemented:**
  Wrapped all authentication and registration forms in `KeyboardAvoidingView` with `Platform.OS === 'ios' ? 'padding' : undefined` and enabled scrollable containers with comfortable bottom padding.
- **Test Result:** **PASS** (Verified responsive layout across mobile viewports).

---

## 3. Defect Summary Table

| Defect ID | Category | Severity | Root Cause | Status | Verification Evidence |
|:---|:---|:---|:---|:---|:---|
| **BUG-01** | Configuration | CRITICAL | Missing `.env` and fallback to `.invalid` URL | **FIXED** | `test-mobile-auth-and-qa.mjs` Suite 1 |
| **BUG-02** | Authentication | HIGH | Masked server errors in `LoginScreen` catch block | **FIXED** | Inline error banner & Suite 4 |
| **BUG-03** | Auth / OTP | HIGH | Field worker OTP button invoked password login | **FIXED** | Added `signInWithOtp` & `resendOtp` |
| **BUG-04** | Registration | HIGH | No OTP confirmation view on sign-up completion | **FIXED** | Integrated OTP step in register screens |
| **BUG-05** | API Integration | HIGH | Arity mismatch in `getDashboardStats` | **FIXED** | Overloaded method in `restApi.ts` |
| **BUG-06** | UI / UX | MEDIUM | Missing loading/empty states in Transport & Wallet | **FIXED** | Added indicators, empty cards, `RefreshControl` |
| **BUG-07** | State Mgmt | MEDIUM | No manual status check on Pending Approval screen | **FIXED** | Added `checkApprovalStatus` button |
| **BUG-08** | Responsive UI | MEDIUM | Keyboard clipping inputs on small screens | **FIXED** | Added `KeyboardAvoidingView` |
