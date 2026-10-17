import type { LucideIcon } from 'lucide-react';
import {
  Camera,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type { Role } from '@/types';

/**
 * ROLE-BASED NAVIGATION — PROTOTYPE ONLY.
 *
 * These rules only control what the demo UI shows. They are NOT a security
 * boundary: there is no authentication in this prototype and the role is
 * chosen from a dropdown. In production, authorization must be enforced by the
 * Spring Boot API (and Supabase row-level security); the frontend would merely
 * mirror the roles/permissions returned by the server.
 */

export const roleMeta: Record<Role, { label: string; blurb: string }> = {
  admin: { label: 'Admin', blurb: 'Full access to every area' },
  manager: { label: 'Manager', blurb: 'Teams, tasks, checklists and evidence review' },
  operations: { label: 'Operations', blurb: 'Dispatch, nearby monitoring and reward approvals' },
  customer: { label: 'Customer', blurb: 'Read-only view of your own requests' },
};

export const ROLES: Role[] = ['admin', 'manager', 'operations', 'customer'];

export type Capability =
  | 'createTasks'
  | 'assignTasks'
  | 'manageEmployees'
  | 'editChecklists'
  | 'decideEvidence'
  | 'decideApprovals'
  | 'viewAiResults';

export const roleCapabilities: Record<Role, Capability[]> = {
  admin: ['createTasks', 'assignTasks', 'manageEmployees', 'editChecklists', 'decideEvidence', 'decideApprovals', 'viewAiResults'],
  manager: ['createTasks', 'assignTasks', 'manageEmployees', 'editChecklists', 'decideEvidence', 'viewAiResults'],
  operations: ['createTasks', 'assignTasks', 'decideApprovals', 'viewAiResults'],
  customer: [],
};

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'manager', 'operations', 'customer'], end: true },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'manager', 'operations', 'customer'] },
  { to: '/nearby', label: 'Nearby tasks', icon: MapPin, roles: ['admin', 'manager', 'operations'] },
  { to: '/checklists', label: 'Checklists', icon: ListChecks, roles: ['admin', 'manager'] },
  { to: '/evidence', label: 'Photo evidence', icon: Camera, roles: ['admin', 'manager', 'operations', 'customer'] },
  { to: '/approvals', label: 'Approval queue', icon: ShieldCheck, roles: ['admin', 'operations'] },
  { to: '/wallet', label: 'Wallets', icon: Wallet, roles: ['admin', 'operations'] },
];

export function canAccessPath(role: Role, pathname: string): boolean {
  if (pathname === '/tasks/new') return roleCapabilities[role].includes('createTasks');
  const match = navItems
    .filter((n) => (n.end ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match ? match.roles.includes(role) : true;
}
