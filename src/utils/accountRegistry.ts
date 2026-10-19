import type { Employee, EmployeeApprovalStatus, EmployeeSubRole } from '@/types';

export interface RegisteredAccount {
  id: string;
  email: string;
  password?: string;
  displayName: string;
  phone?: string;
  region?: string;
  skills?: string[];
  accountType: 'EMPLOYEE' | 'CUSTOMER';
  subRole?: EmployeeSubRole;
  accountStatus: 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';
  roles: string[];
  createdAt: string;
}

const REGISTRY_KEY = 'chasehorse_registered_accounts';
const ACTIVE_SESSION_KEY = 'chasehorse_active_session';

export function getStoredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredAccount(account: RegisteredAccount): void {
  try {
    const list = getStoredAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase(),
    );
    list.unshift(account);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[AccountRegistry] Failed to save account:', err);
  }
}

export function updateStoredAccount(
  idOrEmail: string,
  updates: Partial<RegisteredAccount>,
): RegisteredAccount | null {
  try {
    const list = getStoredAccounts();
    const idx = list.findIndex(
      (a) => a.id === idOrEmail || a.email.toLowerCase() === idOrEmail.toLowerCase(),
    );
    if (idx === -1) return null;
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
    return updated;
  } catch (err) {
    console.warn('[AccountRegistry] Failed to update account:', err);
    return null;
  }
}

export function findStoredAccount(email: string): RegisteredAccount | undefined {
  const norm = email.trim().toLowerCase();
  return getStoredAccounts().find((a) => a.email.toLowerCase() === norm);
}

export function accountToEmployee(account: RegisteredAccount): Employee {
  const approval = (
    account.accountStatus === 'active' || account.accountStatus === 'approved'
      ? 'approved'
      : account.accountStatus === 'rejected'
      ? 'rejected'
      : account.accountStatus === 'suspended'
      ? 'suspended'
      : 'pending'
  ) as EmployeeApprovalStatus;

  return {
    id: account.id,
    name: account.displayName,
    email: account.email,
    phone: account.phone || '+91 98000 00000',
    region: account.region || 'Tenali / Guntur',
    skills: account.skills || [],
    approvalStatus: approval,
    subRole: account.subRole || 'field_worker',
    availability: 'available',
    location: { lat: 16.24184, lng: 80.6448, area: account.region || 'Tenali Urban' },
    joinedAt: account.createdAt,
    tasksCompleted: 0,
    rating: 5.0,
    documentsVerified: approval === 'approved',
  };
}

export function getCachedSession(): any | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedSession(data: any | null): void {
  try {
    if (data) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (err) {
    console.warn('[AccountRegistry] Failed to update session cache:', err);
  }
}
