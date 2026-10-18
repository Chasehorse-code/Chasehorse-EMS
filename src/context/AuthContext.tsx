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
  /** Sign up with email/password. */
  signUp: (email: string, password: string, displayName?: string) => Promise<{ needsConfirmation: boolean }>;
  /** Send a magic-link/OTP to the email. */
  signInWithOtp: (email: string) => Promise<void>;
  /** Send a password-reset email. */
  resetPassword: (email: string) => Promise<void>;
  /** Update password (when user has a valid session from a reset link). */
  updatePassword: (newPassword: string) => Promise<void>;
  /** Sign out and clear session. */
  signOut: () => Promise<void>;
  /** Refresh the profile from the backend. */
  refreshProfile: () => Promise<void>;
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
  const fetchProfile = useCallback(async (accessToken: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        console.warn('[Auth] /me returned', res.status);
        setProfile(null);
        return;
      }
      const data = await res.json();
      setProfile({
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
      });
    } catch (err) {
      console.warn('[Auth] Failed to fetch profile:', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /* --- Listen for auth state changes ------------------------------ */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) fetchProfile(s.access_token);
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
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setError(null);
    const { data, error: e } = await supabase.auth.signUp({
      email,
      password,
      options: displayName ? { data: { full_name: displayName } } : undefined,
    });
    if (e) {
      setError(e.message);
      throw e;
    }
    // Supabase returns a user with identities=[] if email confirmation is required
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    setError(null);
    const { error: e } = await supabase.auth.signInWithOtp({ email });
    if (e) {
      setError(e.message);
      throw e;
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
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.access_token) await fetchProfile(session.access_token);
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
      signUp,
      signInWithOtp,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
      hasRole,
    }),
    [session, user, profile, loading, profileLoading, error,
     signIn, signUp, signInWithOtp, resetPassword, updatePassword,
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
