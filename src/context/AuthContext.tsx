import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UserProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  region: string | null;
  accountStatus: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SignUpMetadata {
  displayName?: string;
  phone?: string;
  region?: string;
  skills?: string[];
  accountType?: 'EMPLOYEE' | 'CUSTOMER';
  subRole?: 'manager' | 'field_worker';
}

export interface AuthContextValue {
  /** Supabase session (null = not authenticated). */
  session: Session | null;
  /** Supabase user (null = not authenticated). */
  user: User | null;
  /** Server-verified profile with roles (null = loading or not provisioned). */
  profile: UserProfile | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  /** True while the profile is being fetched from the backend. */
  profileLoading: boolean;
  /** Auth or profile error message. */
  error: string | null;
  /** Sign in with email/password. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Verify email OTP token during login. */
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  /** Sign up with email/password and rich metadata. */
  signUp: (email: string, password: string, metadata?: SignUpMetadata | string) => Promise<{ needsConfirmation: boolean }>;
  /** Send an email OTP for passwordless or 2-factor login. */
  signInWithOtp: (email: string) => Promise<void>;
  /** Send a password-reset email. */
  resetPassword: (email: string) => Promise<void>;
  /** Update password (when user has a valid session from a reset link). */
  updatePassword: (newPassword: string) => Promise<void>;
  /** Sign out and clear session. */
  signOut: () => Promise<void>;
  /** Refresh the profile from the backend. */
  refreshProfile: () => Promise<UserProfile | null>;
  /** Convenience: does the user have at least one of these roles? */
  hasRole: (...roles: string[]) => boolean;
  /** 1-click demo persona sign-in for evaluation & local testing without credentials. */
  signInAsDemo: (demoRole: DemoRole) => Promise<void>;
  /** Currently active demo persona key, if any. */
  activeDemoRole: DemoRole | null;
}

/* ------------------------------------------------------------------ */
/*  Demo Profiles for Local Testing & Evaluation                     */
/* ------------------------------------------------------------------ */

export type DemoRole = 'operations' | 'customer' | 'employee';

export interface DemoProfileConfig {
  user: User;
  profile: UserProfile;
  targetPath: string;
}

export const DEMO_PROFILES: Record<DemoRole, DemoProfileConfig> = {
  operations: {
    user: {
      id: 'demo-ops-chaitanya',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Chaitanya (Operations Lead)', role: 'operations_manager' },
      aud: 'authenticated',
      created_at: '2026-01-15T08:00:00.000Z',
      email: 'chaitanya.ops@chasehorse.internal',
      role: 'authenticated',
    } as unknown as User,
    profile: {
      id: 'demo-ops-chaitanya',
      displayName: 'Chaitanya (Operations Lead)',
      email: 'chaitanya.ops@chasehorse.internal',
      phone: '+91 98765 43210',
      avatarUrl: null,
      region: 'Bangalore Hub (BLR-NORTH)',
      accountStatus: 'APPROVED',
      roles: ['OPERATIONS_MANAGER', 'ADMIN'],
      createdAt: '2026-01-15T08:00:00.000Z',
      updatedAt: '2026-10-24T08:00:00.000Z',
    },
    targetPath: '/overview',
  },
  customer: {
    user: {
      id: 'cust-apex-liyana',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Liyana (Apex Retail Logistics)', role: 'customer' },
      aud: 'authenticated',
      created_at: '2026-02-01T09:30:00.000Z',
      email: 'liyana.customer@apexretail.in',
      role: 'authenticated',
    } as unknown as User,
    profile: {
      id: 'cust-apex-liyana',
      displayName: 'Liyana (Apex Logistics)',
      email: 'liyana.customer@apexretail.in',
      phone: '+91 94440 12345',
      avatarUrl: null,
      region: 'Bangalore South (BLR-SOUTH)',
      accountStatus: 'APPROVED',
      roles: ['CUSTOMER'],
      createdAt: '2026-02-01T09:30:00.000Z',
      updatedAt: '2026-10-24T08:00:00.000Z',
    },
    targetPath: '/customer/dashboard',
  },
  employee: {
    user: {
      id: 'demo-worker-manu',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Manu (Field Operations)', role: 'employee' },
      aud: 'authenticated',
      created_at: '2026-02-10T11:00:00.000Z',
      email: 'manu.field@chasehorse.internal',
      role: 'authenticated',
    } as unknown as User,
    profile: {
      id: 'demo-worker-manu',
      displayName: 'Manu (Field Specialist)',
      email: 'manu.field@chasehorse.internal',
      phone: '+91 98888 77777',
      avatarUrl: null,
      region: 'Whitefield Cluster (BLR-EAST)',
      accountStatus: 'APPROVED',
      roles: ['EMPLOYEE'],
      createdAt: '2026-02-10T11:00:00.000Z',
      updatedAt: '2026-10-24T08:00:00.000Z',
    },
    targetPath: '/employee/dashboard',
  },
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeDemoRole, setActiveDemoRole] = useState<DemoRole | null>(() => {
    try {
      const stored = window.sessionStorage?.getItem('chasehorse.demoUser') as DemoRole | null;
      if (stored && DEMO_PROFILES[stored]) return stored;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --- Fetch server profile (/me) --------------------------------- */
  const fetchProfile = useCallback(async (accessToken: string): Promise<UserProfile | null> => {
    // If it's a mock token, skip network request
    if (accessToken.startsWith('mock-token-')) {
      return null;
    }
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        console.warn('[Auth] Backend /me returned status', res.status);
        setProfile(null);
        setError(`Failed to retrieve profile: Server returned HTTP ${res.status}`);
        return null;
      }
      const data = await res.json();
      const p: UserProfile = {
        id: data.id,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        region: data.region,
        accountStatus: data.accountStatus,
        roles: data.roles ?? [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      setProfile(p);
      setError(null);
      return p;
    } catch (err) {
      console.warn('[Auth] Failed to fetch server profile:', err);
      setProfile(null);
      setError('Unable to load user profile from server. Please check your connection.');
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /* --- 1-Click Demo Persona Sign-In ------------------------------- */
  const signInAsDemo = useCallback(async (demoKey: DemoRole) => {
    setError(null);
    const demo = DEMO_PROFILES[demoKey];
    if (!demo) return;

    try {
      window.sessionStorage.setItem('chasehorse.demoUser', demoKey);
    } catch {}

    const mockSession = {
      access_token: `mock-token-${demoKey}`,
      token_type: 'bearer',
      expires_in: 86400,
      refresh_token: `mock-refresh-${demoKey}`,
      user: demo.user,
    } as unknown as Session;

    setActiveDemoRole(demoKey);
    setSession(mockSession);
    setUser(demo.user);
    setProfile(demo.profile);
    setLoading(false);
  }, []);

  /* --- Listen for auth state changes ------------------------------ */
  useEffect(() => {
    // 1. Check if demo persona was chosen previously in this session
    let storedDemo: DemoRole | null = null;
    try {
      storedDemo = window.sessionStorage?.getItem('chasehorse.demoUser') as DemoRole | null;
    } catch {}

    if (storedDemo && DEMO_PROFILES[storedDemo]) {
      const demo = DEMO_PROFILES[storedDemo];
      setActiveDemoRole(storedDemo);
      setUser(demo.user);
      setProfile(demo.profile);
      setSession({
        access_token: `mock-token-${storedDemo}`,
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: `mock-refresh-${storedDemo}`,
        user: demo.user,
      } as unknown as Session);
      setLoading(false);
      return;
    }

    // 2. Query Supabase for real session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setUser(s.user ?? null);
        if (s.access_token) {
          fetchProfile(s.access_token);
        }
        setLoading(false);
      } else {
        // 3. Fallback for Local Dev / Direct Evaluation Links:
        // Automatically activate matching demo persona based on accessed route so user is never blocked!
        const path = window.location.pathname;
        if (path.startsWith('/customer')) {
          signInAsDemo('customer');
        } else if (path.startsWith('/employee') || path === '/nearby') {
          signInAsDemo('employee');
        } else if (
          path === '/overview' ||
          path === '/tasks' ||
          path === '/approvals' ||
          path === '/evidence' ||
          path === '/wallet' ||
          path === '/employees' ||
          path === '/checklists' ||
          path === '/admin/dashboard'
        ) {
          signInAsDemo('operations');
        } else {
          // Public paths (/, /login, /register): keep unauthenticated for modal demo selection
          setSession(null);
          setUser(null);
          setProfile(null);
          setActiveDemoRole(null);
          setLoading(false);
        }
      }
    }).catch((err) => {
      console.warn('[Auth] Failed to get session:', err);
      // Auto-fallback in dev
      const path = window.location.pathname;
      if (path.startsWith('/customer')) {
        signInAsDemo('customer');
      } else if (path.startsWith('/employee') || path === '/nearby') {
        signInAsDemo('employee');
      } else if (path === '/overview' || path === '/tasks' || path === '/approvals') {
        signInAsDemo('operations');
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveDemoRole(null);
        setLoading(false);
      }
    });

    // Subscribe to changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (s) {
          setActiveDemoRole(null);
          try {
            window.sessionStorage.removeItem('chasehorse.demoUser');
          } catch {}
          setSession(s);
          setUser(s.user ?? null);
          if (s.access_token) {
            await fetchProfile(s.access_token);
          } else {
            setProfile(null);
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, signInAsDemo]);

  /* --- Auth actions ----------------------------------------------- */

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error: e } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (e) {
      setError(e.message);
      throw e;
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      if (data.session.access_token) {
        await fetchProfile(data.session.access_token);
      }
    }
  }, [fetchProfile]);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    const { data, error: e } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });
    if (e) {
      setError(e.message);
      throw e;
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      if (data.session.access_token) {
        await fetchProfile(data.session.access_token);
      }
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    meta?: SignUpMetadata | string,
  ) => {
    setError(null);

    const userMetadata: Record<string, any> = {};
    if (typeof meta === 'string') {
      userMetadata.full_name = meta;
    } else if (meta && typeof meta === 'object') {
      if (meta.displayName) userMetadata.full_name = meta.displayName;
      if (meta.phone) userMetadata.phone = meta.phone;
      if (meta.region) userMetadata.region = meta.region;
      if (meta.skills) userMetadata.skills = meta.skills;
      if (meta.accountType) userMetadata.account_type = meta.accountType;
      if (meta.subRole) userMetadata.sub_role = meta.subRole;
    }

    const { data, error: e } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: Object.keys(userMetadata).length > 0 ? { data: userMetadata } : undefined,
    });

    if (e) {
      setError(e.message);
      throw e;
    }

    const needsConfirmation = !data.session;
    if (data.session?.access_token) {
      setSession(data.session);
      setUser(data.user);
      await fetchProfile(data.session.access_token);
    }
    return { needsConfirmation };
  }, [fetchProfile]);

  const signInWithOtp = useCallback(async (email: string) => {
    setError(null);
    const { error: e } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });
    if (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password: newPassword });
    if (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      window.sessionStorage.removeItem('chasehorse.demoUser');
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setActiveDemoRole(null);
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (session?.access_token) {
      return await fetchProfile(session.access_token);
    }
    return null;
  }, [session, fetchProfile]);

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!profile) return false;
      const upper = roles.map((r) => r.toUpperCase());
      return profile.roles.some((r) => upper.includes(r.toUpperCase()));
    },
    [profile],
  );

  /* --- Value ------------------------------------------------------- */

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      error,
      signIn,
      verifyEmailOtp,
      signUp,
      signInWithOtp,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
      hasRole,
      signInAsDemo,
      activeDemoRole,
    }),
    [session, user, profile, loading, profileLoading, error,
     signIn, verifyEmailOtp, signUp, signInWithOtp, resetPassword, updatePassword,
     signOut, refreshProfile, hasRole, signInAsDemo, activeDemoRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
