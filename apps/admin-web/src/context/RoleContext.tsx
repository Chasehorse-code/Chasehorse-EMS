import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '@/types';
import { ROLES, roleCapabilities, type Capability } from '@/config/access';
import { DEMO_CUSTOMER_ID } from '@/data/mockData';

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  can: (capability: Capability) => boolean;
  /** Demo customer identity used when role === 'customer'. */
  customerId: string | undefined;
  /** Display name for audit-style notes in the demo (no real user exists). */
  actorName: string;
}

const RoleContext = createContext<RoleContextValue | null>(null);
const STORAGE_KEY = 'chasehorse.demoRole';

function readStoredRole(): Role {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored && (ROLES as string[]).includes(stored)) return stored as Role;
  } catch {
    /* storage unavailable */
  }
  return 'admin';
}

const actorNames: Record<Role, string> = {
  admin: 'Demo Admin',
  manager: 'Meera Joshi (demo manager)',
  operations: 'Arjun Patel (demo operations)',
  customer: 'Demo Customer',
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readStoredRole);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      setRole,
      can: (capability) => roleCapabilities[role].includes(capability),
      customerId: role === 'customer' ? DEMO_CUSTOMER_ID : undefined,
      actorName: actorNames[role],
    }),
    [role, setRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
