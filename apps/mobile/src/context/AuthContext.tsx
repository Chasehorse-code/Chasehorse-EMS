import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import type { UserProfile, Role, EmployeeSubRole } from '../types';

interface RegisterEmployeeInput {
  email: string;
  name: string;
  phone: string;
  region: string;
  subRole: EmployeeSubRole;
  coords: { lat: number; lng: number };
  password?: string;
}

interface RegisterCustomerInput {
  email: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  gstin: string;
  region: string;
  password?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  loading: boolean;
  login: (email: string, pass: string, targetRole: Role) => Promise<{ requiresOtp?: boolean }>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  registerEmployee: (data: RegisterEmployeeInput) => Promise<void>;
  registerCustomer: (data: RegisterCustomerInput) => Promise<void>;
  signOut: () => void;
  pendingAccounts: UserProfile[];
  refreshPendingAccounts: () => Promise<void>;
  approveAccount: (id: string) => Promise<void>;
  rejectAccount: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://phxybimufcrsnxfepiuz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Never default to a logged-in demo user; begin unauthenticated
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServerProfile = async (accessToken: string): Promise<UserProfile> => {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Profile loading failed: Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const roles: string[] = data.roles || [];
    let mappedRole: Role = 'employee';
    if (roles.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'MANAGER' || r.toUpperCase() === 'OPERATIONS')) {
      mappedRole = 'manager';
    } else if (roles.some((r) => r.toUpperCase() === 'CUSTOMER')) {
      mappedRole = 'customer';
    }

    const rawStatus = (data.accountStatus || 'pending').toLowerCase();
    const accountStatus: UserProfile['accountStatus'] =
      rawStatus === 'active' || rawStatus === 'approved'
        ? 'active'
        : rawStatus === 'rejected'
        ? 'rejected'
        : rawStatus === 'suspended'
        ? 'suspended'
        : 'pending';

    return {
      id: data.id,
      email: data.email || '',
      displayName: data.displayName || 'Authorized User',
      phone: data.phone,
      region: data.region,
      role: mappedRole,
      accountStatus,
      createdAt: data.createdAt || new Date().toISOString(),
      token: accessToken,
    };
  };

  const login = async (email: string, pass: string, _targetRole: Role): Promise<{ requiresOtp?: boolean }> => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Check if Supabase keys are configured
      if (!SUPABASE_ANON_KEY) {
        throw new Error(
          'Mobile authentication configuration missing: EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
          'Cannot establish verified security session.',
        );
      }

      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: pass,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.message || 'Invalid email or password.');
      }

      if (data.access_token) {
        const verifiedProfile = await fetchServerProfile(data.access_token);
        setUser(verifiedProfile);
        return { requiresOtp: false };
      }

      return { requiresOtp: true };
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (!SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing (EXPO_PUBLIC_SUPABASE_ANON_KEY).');
      }

      const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email: email.trim().toLowerCase(),
          token: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.access_token) {
        return false;
      }

      const verifiedProfile = await fetchServerProfile(data.access_token);
      setUser(verifiedProfile);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerEmployee = async (data: RegisterEmployeeInput): Promise<void> => {
    setLoading(true);
    try {
      if (!SUPABASE_ANON_KEY) {
        throw new Error('Supabase authentication credentials missing. Cannot register on-field worker.');
      }

      const defaultPassword = data.password || 'ChaseHorse2026!';
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: defaultPassword,
          data: {
            full_name: data.name,
            phone: data.phone,
            region: data.region,
            account_type: 'EMPLOYEE',
            sub_role: data.subRole,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error_description || result.message || 'Registration failed.');
      }

      if (result.access_token) {
        const verifiedProfile = await fetchServerProfile(result.access_token);
        setUser(verifiedProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (data: RegisterCustomerInput): Promise<void> => {
    setLoading(true);
    try {
      if (!SUPABASE_ANON_KEY) {
        throw new Error('Supabase authentication credentials missing. Cannot register corporate customer.');
      }

      const defaultPassword = data.password || 'ChaseHorse2026!';
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: defaultPassword,
          data: {
            full_name: data.contactPerson,
            company_name: data.companyName,
            phone: data.phone,
            gstin: data.gstin,
            region: data.region,
            account_type: 'CUSTOMER',
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error_description || result.message || 'Registration failed.');
      }

      if (result.access_token) {
        const verifiedProfile = await fetchServerProfile(result.access_token);
        setUser(verifiedProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshPendingAccounts = useCallback(async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const pendingList: UserProfile[] = (data || [])
          .filter((e: any) => (e.accountStatus || '').toUpperCase() === 'PENDING')
          .map((e: any) => ({
            id: e.id,
            email: e.email,
            displayName: e.displayName || 'Worker Applicant',
            phone: e.phone,
            region: e.region,
            role: 'employee' as Role,
            subRole: 'on_field' as EmployeeSubRole,
            accountStatus: 'pending' as const,
            createdAt: e.createdAt || new Date().toISOString(),
          }));
        setPendingAccounts(pendingList);
      }
    } catch {
      // Fail closed
    }
  }, [user]);

  const approveAccount = async (id: string) => {
    if (!user?.token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/employees/${id}/approval`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    if (!res.ok) {
      throw new Error(`Failed to approve employee: HTTP ${res.status}`);
    }
    await refreshPendingAccounts();
  };

  const rejectAccount = async (id: string) => {
    if (!user?.token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/employees/${id}/approval`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    if (!res.ok) {
      throw new Error(`Failed to reject employee: HTTP ${res.status}`);
    }
    await refreshPendingAccounts();
  };

  const signOut = () => {
    setUser(null);
    setPendingAccounts([]);
  };

  const isAuthenticated = Boolean(user && user.token);
  const isPendingApproval = user?.accountStatus === 'pending';
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isPendingApproval,
        loading,
        login,
        verifyOtp,
        registerEmployee,
        registerCustomer,
        signOut,
        pendingAccounts,
        refreshPendingAccounts,
        approveAccount,
        rejectAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
