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
        console.warn('[Auth] /me returned', res.status);
        setProfile(null);
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
      return p;
    } catch (err) {
      console.warn('[Auth] Failed to fetch profile:', err);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /* --- Listen for auth state changes ------------------------------ */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.access_token) fetchProfile(s.access_token);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Subscribe to changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.access_token) {
          fetchProfile(s.access_token);
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
    try {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) throw e;
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.session.access_token) {
          await fetchProfile(data.session.access_token);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
      throw err;
    }
  }, [fetchProfile]);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    try {
      const { data, error: e } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email',
      });
      if (e) throw e;
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.session.access_token) {
          await fetchProfile(data.session.access_token);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP code';
      setError(msg);
      throw err;
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

    try {
      const { data, error: e } = await supabase.auth.signUp({
        email,
        password,
        options: Object.keys(userMetadata).length > 0 ? { data: userMetadata } : undefined,
      });

      if (e) {
        setError(e.message);
        throw e;
      }

      const needsConfirmation = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.session.access_token) {
          await fetchProfile(data.session.access_token);
        }
      }
      return { needsConfirmation };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  }, [fetchProfile]);

  const signInWithOtp = useCallback(async (email: string) => {
    setError(null);
    try {
      const { error: e } = await supabase.auth.signInWithOtp({ email });
      if (e) throw e;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('rate limit')) {
        console.warn('[Auth] signInWithOtp rate limit ignored:', msg);
        return;
      }
      setError(msg);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
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
