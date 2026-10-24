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
}

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
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --- Fetch server profile (/me) --------------------------------- */
  const fetchProfile = useCallback(async (accessToken: string): Promise<UserProfile | null> => {
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

  /* --- Listen for auth state changes ------------------------------ */
  useEffect(() => {
    // Get initial verified session from Supabase
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setUser(s.user ?? null);
        if (s.access_token) {
          fetchProfile(s.access_token);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('[Auth] Failed to get session:', err);
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    // Subscribe to changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.access_token) {
          await fetchProfile(s.access_token);
        } else {
          setProfile(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
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
    }),
    [session, user, profile, loading, profileLoading, error,
     signIn, verifyEmailOtp, signUp, signInWithOtp, resetPassword, updatePassword,
     signOut, refreshProfile, hasRole],
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
