import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import type { Role } from '@/types';
import { ROLES, roleCapabilities, type Capability } from '@/config/access';
import { DEMO_CUSTOMER_ID } from '@/data/mockData';
import { useAuth } from './AuthContext';

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  can: (capability: Capability) => boolean;
  /** Demo customer identity used when role === 'customer'. */
  customerId: string | undefined;
  /** Display name for audit-style notes or current user info. */
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
  admin: 'Admin Console',
  manager: 'Meera Joshi (Manager)',
  operations: 'Arjun Patel (Operations)',
  employee: 'Rohan Sharma (Employee)',
  customer: 'Demo Retail Enterprise',
  partner: 'Kavita Transport Logistics',
  field_worker: 'Devendra Kumar (Field Officer)',
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [role, setRoleState] = useState<Role>(readStoredRole);

  // If user signs in with assigned roles from backend, sync active role
  useEffect(() => {
    if (auth.profile?.roles && auth.profile.roles.length > 0) {
      const primaryRole = auth.profile.roles[0].toLowerCase() as Role;
      if (ROLES.includes(primaryRole)) {
        setRoleState(primaryRole);
      }
    }
  }, [auth.profile]);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const currentActorName = useMemo(() => {
    if (auth.profile?.displayName) return auth.profile.displayName;
    if (auth.user?.email) return auth.user.email.split('@')[0];
    return actorNames[role] || 'ChaseHorse User';
  }, [auth.profile, auth.user, role]);

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      setRole,
      can: (capability) => roleCapabilities[role]?.includes(capability) ?? false,
      customerId: role === 'customer' ? (auth.profile?.id || DEMO_CUSTOMER_ID) : undefined,
      actorName: currentActorName,
    }),
    [role, setRole, auth.profile, currentActorName],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
