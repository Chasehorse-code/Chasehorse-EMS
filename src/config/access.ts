import type { LucideIcon } from 'lucide-react';
import {
  Camera,
  ClipboardList,
  Compass,
  LayoutDashboard,
  ListChecks,
  MapPin,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import type { Role } from '@/types';

export const roleMeta: Record<Role, { label: string; blurb: string }> = {
  admin: { label: 'Admin', blurb: 'Full access to all modules, users and configurations' },
  manager: { label: 'Manager', blurb: 'Teams, tasks, checklists and evidence review' },
  operations: { label: 'Operations', blurb: 'Dispatch, fleet logistics, nearby monitoring and reward approvals' },
  employee: { label: 'Employee', blurb: 'Internal staff execution, task status and attendance' },
  customer: { label: 'Customer', blurb: 'Create task requests and monitor real-time fulfillment' },
  partner: { label: 'Partner', blurb: 'Third-party transport and logistics coordination' },
  field_worker: { label: 'Field Worker', blurb: 'Mobile task execution, photos, checklists and rewards' },
};

export const ROLES: Role[] = [
  'admin',
  'manager',
  'operations',
  'employee',
  'customer',
  'partner',
  'field_worker',
];

export type Capability =
  | 'createTasks'
  | 'assignTasks'
  | 'manageEmployees'
  | 'editChecklists'
  | 'decideEvidence'
  | 'decideApprovals'
  | 'viewAiResults'
  | 'manageTms'
  | 'manageWallets';

export const roleCapabilities: Record<Role, Capability[]> = {
  admin: [
    'createTasks',
    'assignTasks',
    'manageEmployees',
    'editChecklists',
    'decideEvidence',
    'decideApprovals',
    'viewAiResults',
    'manageTms',
    'manageWallets',
  ],
  manager: [
    'createTasks',
    'assignTasks',
    'manageEmployees',
    'editChecklists',
    'decideEvidence',
    'viewAiResults',
    'manageTms',
  ],
  operations: [
    'createTasks',
    'assignTasks',
    'decideApprovals',
    'viewAiResults',
    'manageTms',
    'manageWallets',
  ],
  employee: [
    'viewAiResults',
  ],
  customer: [
    'createTasks',
  ],
  partner: [
    'manageTms',
  ],
  field_worker: [],
};

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'operations', 'customer', 'partner'] },
  { to: '/truck-plans', label: 'Truck Plans', icon: Truck, roles: ['admin', 'manager', 'operations', 'customer', 'partner'] },
  { to: '/bookings', label: 'Bookings', icon: ClipboardList, roles: ['admin', 'manager', 'operations', 'customer', 'partner'] },
  { to: '/tracking', label: 'Shipment Tracking', icon: Compass, roles: ['admin', 'manager', 'operations', 'customer', 'partner', 'employee', 'field_worker'] },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'manager', 'operations', 'customer', 'employee', 'field_worker'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
  { to: '/checklists', label: 'Checklists', icon: ListChecks, roles: ['admin', 'manager'] },
  { to: '/evidence', label: 'Photo evidence', icon: Camera, roles: ['admin', 'manager', 'operations', 'customer', 'field_worker'] },
  { to: '/approvals', label: 'Approval queue', icon: ShieldCheck, roles: ['admin', 'operations', 'manager'] },
  { to: '/wallet', label: 'Wallets', icon: Wallet, roles: ['admin', 'operations', 'employee', 'field_worker'] },
  { to: '/nearby', label: 'Nearby tasks', icon: MapPin, roles: ['admin', 'manager', 'operations', 'employee', 'field_worker'] },
];

export function canAccessPath(role: Role, pathname: string): boolean {
  if (pathname === '/tasks/new' || pathname === '/bookings/new') return true;
  const match = navItems
    .filter((n) => (n.end ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match ? match.roles.includes(role) : true;
}
