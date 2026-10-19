// test-mobile-auth-and-qa.mjs
// Automated Unit & Integration Test Suite for ChaseHorse Mobile Auth, Registration, OTP, & QA flows

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://phxybimufcrsnxfepiuz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OKwNl5c5VD_IKZHi7rL_AQ_rciWCKSp';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  CHASEHORSE MOBILE AUTHENTICATION, REGISTRATION & QA TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Configuration Integrity
  console.log('[Suite 1: Configuration & Environment Integrity]');
  assert(Boolean(SUPABASE_URL && SUPABASE_URL.startsWith('https://')), 'Supabase URL is valid HTTPS endpoint');
  assert(Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20), 'Supabase Anon Key is present and non-empty');
  assert(Boolean(API_BASE_URL), 'API Base URL is defined');

  // Test 2: Input Validation Logic (Simulating Mobile Form Validators)
  console.log('\n[Suite 2: Client-side Input Validation]');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert(!emailRegex.test(''), 'Rejects empty email');
  assert(!emailRegex.test('not-an-email'), 'Rejects invalid email format');
  assert(!emailRegex.test('user@domain'), 'Rejects email without TLD');
  assert(emailRegex.test('worker@chasehorse.com'), 'Accepts valid email');

  const validatePassword = (p) => Boolean(p && p.length >= 8);
  assert(!validatePassword('12345'), 'Rejects password shorter than 8 characters');
  assert(validatePassword('ChaseHorse2026!'), 'Accepts 8+ character password');

  const validateOtp = (otp) => Boolean(otp && /^\d{6}$/.test(otp.trim()));
  assert(!validateOtp('12345'), 'Rejects 5-digit OTP');
  assert(!validateOtp('abcdef'), 'Rejects non-numeric OTP');
  assert(validateOtp('123456'), 'Accepts valid 6-digit numeric OTP');

  // Test 3: Real Supabase Client Connectivity
  console.log('\n[Suite 3: Supabase Authentication Client Handshake]');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  assert(Boolean(supabase.auth), 'Supabase Auth module initialized successfully');

  try {
    const { data, error } = await supabase.auth.getSession();
    assert(error === null, 'Supabase getSession returns without network fault');
    assert(data !== undefined, 'Session query returned valid response object');
  } catch (err) {
    assert(false, `Supabase getSession error: ${err.message}`);
  }

  // Test 4: Real Supabase Auth Negative Authentication (Fail-Closed)
  console.log('\n[Suite 4: Authentication Security & Error Propagation]');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent-user-audit-test@chasehorse.invalid',
      password: 'NonExistentPassword123!',
    });
    assert(Boolean(error), 'Rejects fictitious login credentials with explicit error');
    assert(
      error?.message.toLowerCase().includes('invalid') || error?.message.toLowerCase().includes('credential'),
      `Surfaces actual server error message (Got: "${error?.message}")`,
    );
  } catch (err) {
    assert(false, `Unexpected exception: ${err.message}`);
  }

  // Test 5: Role-Based Account Status Quarantine & Token Contract
  console.log('\n[Suite 5: Account Status Quarantine & Access Control]');
  const mapAccountStatus = (rawStatus) => {
    const s = (rawStatus || 'pending').toLowerCase();
    return s === 'active' || s === 'approved' ? 'active' : s === 'rejected' ? 'rejected' : s === 'suspended' ? 'suspended' : 'pending';
  };
  assert(mapAccountStatus('ACTIVE') === 'active', 'ACTIVE maps to active');
  assert(mapAccountStatus('APPROVED') === 'active', 'APPROVED maps to active');
  assert(mapAccountStatus('PENDING') === 'pending', 'PENDING maps to quarantine pending');
  assert(mapAccountStatus('SUSPENDED') === 'suspended', 'SUSPENDED maps to suspended');
  assert(mapAccountStatus('REJECTED') === 'rejected', 'REJECTED maps to rejected');
  assert(mapAccountStatus(null) === 'pending', 'Missing status defaults safely to pending quarantine');

  // Test 6: Backend Endpoint Security Boundaries
  console.log('\n[Suite 6: Backend ERP API Authorization Boundaries]');
  try {
    const resMe = await fetch(`${API_BASE_URL}/me`);
    assert(resMe.status === 401, 'GET /api/v1/me rejects unauthenticated callers with HTTP 401');

    const resTasks = await fetch(`${API_BASE_URL}/tasks`);
    assert(resTasks.status === 401, 'GET /api/v1/tasks rejects unauthenticated callers with HTTP 401');

    const resApprovals = await fetch(`${API_BASE_URL}/approvals`);
    assert(resApprovals.status === 401, 'GET /api/v1/approvals rejects unauthenticated callers with HTTP 401');

    const resEmployees = await fetch(`${API_BASE_URL}/employees`);
    assert(resEmployees.status === 401, 'GET /api/v1/employees rejects unauthenticated callers with HTTP 401');

    const resStats = await fetch(`${API_BASE_URL}/dashboard/stats`);
    assert(resStats.status === 401, 'GET /api/v1/dashboard/stats rejects unauthenticated callers with HTTP 401');
  } catch (err) {
    assert(false, `Backend connection failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
