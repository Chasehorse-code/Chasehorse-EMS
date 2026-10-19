import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, Role, EmployeeSubRole } from '../types';

interface RegisterEmployeeInput {
  email: string;
  name: string;
  phone: string;
  region: string;
  subRole: EmployeeSubRole;
  coords: { lat: number; lng: number };
}

interface RegisterCustomerInput {
  email: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  gstin: string;
  region: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  login: (email: string, pass: string, targetRole: Role) => Promise<{ requiresOtp?: boolean }>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  registerEmployee: (data: RegisterEmployeeInput) => Promise<void>;
  registerCustomer: (data: RegisterCustomerInput) => Promise<void>;
  signOut: () => void;
  pendingAccounts: UserProfile[];
  approveAccount: (id: string) => void;
  rejectAccount: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_PENDING: UserProfile[] = [
  {
    id: 'emp-pen-1',
    email: 'k.ramesh@fieldworker.in',
    displayName: 'K. Ramesh',
    phone: '+91 98480 11223',
    role: 'employee',
    subRole: 'on_field',
    accountStatus: 'pending',
    region: 'Tenali Main Market',
    createdAt: '19 Oct 2026, 08:30 AM',
  },
  {
    id: 'emp-pen-2',
    email: 's.venkat@fieldworker.in',
    displayName: 'S. Venkat',
    phone: '+91 99080 44556',
    role: 'employee',
    subRole: 'on_field',
    accountStatus: 'pending',
    region: 'Auto Nagar Cluster',
    createdAt: '19 Oct 2026, 09:10 AM',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default logged in as Customer matching screenshot and web demo
  const [user, setUser] = useState<UserProfile | null>({
    id: 'cust-apex-1',
    email: 'rahul.kumar@apexretail.com',
    displayName: 'Rahul Kumar',
    companyName: 'Apex Retail Brands Pvt Ltd',
    phone: '+91 99000 12345',
    role: 'customer',
    accountStatus: 'active',
    gstin: '37AAACA1234F1Z8',
    region: 'Tenali Urban, Andhra Pradesh',
    createdAt: '19 Oct 2026',
  });

  const [pendingAccounts, setPendingAccounts] = useState<UserProfile[]>(INITIAL_PENDING);

  const login = async (email: string, _pass: string, targetRole: Role): Promise<{ requiresOtp?: boolean }> => {
    // Check if target role is employee -> requires OTP
    if (targetRole === 'employee') {
      return { requiresOtp: true };
    }

    if (targetRole === 'customer') {
      setUser({
        id: `cust-${Date.now()}`,
        email,
        displayName: 'Rahul Kumar',
        companyName: 'Apex Retail Brands Pvt Ltd',
        role: 'customer',
        accountStatus: 'active',
        gstin: '37AAACA1234F1Z8',
        region: 'Tenali Urban, Andhra Pradesh',
        createdAt: '19 Oct 2026',
      });
      return { requiresOtp: false };
    }

    if (targetRole === 'manager') {
      setUser({
        id: `mgr-${Date.now()}`,
        email,
        displayName: 'Suresh Reddy (Ops Lead)',
        companyName: 'ChaseHorse Operations Hub',
        role: 'manager',
        subRole: 'manager',
        accountStatus: 'active',
        region: 'Andhra Pradesh Central Division',
        createdAt: '19 Oct 2026',
      });
      return { requiresOtp: false };
    }

    return { requiresOtp: false };
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    if (otp === '123456' || otp.length === 6) {
      setUser({
        id: `emp-${Date.now()}`,
        email,
        displayName: 'Siva Krishna (Field Worker)',
        role: 'employee',
        subRole: 'on_field',
        accountStatus: 'active',
        region: 'Tenali Urban, Andhra Pradesh',
        phone: '+91 98480 33445',
        createdAt: '19 Oct 2026',
      });
      return true;
    }
    return false;
  };

  const registerEmployee = async (data: RegisterEmployeeInput): Promise<void> => {
    const newEmp: UserProfile = {
      id: `emp-pen-${Date.now()}`,
      email: data.email,
      displayName: data.name,
      phone: data.phone,
      region: data.region,
      role: 'employee',
      subRole: data.subRole,
      accountStatus: 'pending',
      createdAt: 'Just now',
    };
    setPendingAccounts((prev) => [newEmp, ...prev]);
    setUser(newEmp);
  };

  const registerCustomer = async (data: RegisterCustomerInput): Promise<void> => {
    const newCust: UserProfile = {
      id: `cust-${Date.now()}`,
      email: data.email,
      displayName: data.contactPerson,
      companyName: data.companyName,
      phone: data.phone,
      gstin: data.gstin,
      region: data.region,
      role: 'customer',
      accountStatus: 'active',
      createdAt: 'Just now',
    };
    setUser(newCust);
  };

  const signOut = () => {
    setUser(null);
  };

  const approveAccount = (id: string) => {
    setPendingAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const rejectAccount = (id: string) => {
    setPendingAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const isAuthenticated = Boolean(user);
  const isPendingApproval = user?.accountStatus === 'pending';
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isPendingApproval,
        login,
        verifyOtp,
        registerEmployee,
        registerCustomer,
        signOut,
        pendingAccounts,
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
