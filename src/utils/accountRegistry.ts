/**
 * DEPRECATED: Client account registry previously used for local mock simulation.
 * Real authentication and role provisioning are managed authoritatively via Supabase Auth
 * and Spring Boot backend `app_profiles` / `app_role_assignments`.
 * Passwords and authenticated sessions are never stored in browser storage.
 */

export interface RegisteredAccount {
  id: string;
  email: string;
  displayName: string;
  accountType: 'EMPLOYEE' | 'CUSTOMER';
  accountStatus: 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';
  roles: string[];
  createdAt: string;
}

export function getStoredAccounts(): RegisteredAccount[] {
  return [];
}

export function saveStoredAccount(_account: RegisteredAccount): void {
  // Production security: no-op; all account creation persisted to server DB
}

export function updateStoredAccount(_idOrEmail: string, _updates: any): null {
  return null;
}

export function findStoredAccount(_email: string): undefined {
  return undefined;
}
