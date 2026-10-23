/**
 * Domain types for ChaseHorse Field Task & Employee Operations Platform.
 * Shaped to map 1:1 onto Spring Boot DTOs and Supabase PostgreSQL tables.
 */

export type Role =
  | 'admin'
  | 'operations_manager'
  | 'employee'
  | 'customer'
  // Backward-compatibility aliases:
  | 'manager'
  | 'operations'
  | 'field_worker';

export type EmployeeSubRole = 'manager' | 'field_worker';

export interface GeoPoint {
  lat: number;
  lng: number;
  area: string;
}

/* ---------- Employees (On-field workers & Operations Managers) ---------- */

export type EmployeeApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type Availability = 'available' | 'on_task' | 'offline';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  skills?: string[];
  approvalStatus: EmployeeApprovalStatus;
  subRole?: EmployeeSubRole;
  availability: Availability;
  location: GeoPoint;
  joinedAt: string; // ISO
  tasksCompleted: number;
  rating: number; // 0-5
  documentsVerified: boolean;
}

/* ---------- Customers ---------- */

export interface Customer {
  id: string;
  name: string;
  contact: string;
}

/* ---------- Checklists ---------- */

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  requiresPhoto: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: TaskCategory;
  items: ChecklistItem[];
  updatedAt: string;
}

/* ---------- Tasks ---------- */

export type TaskCategory =
  | 'Shelf audit'
  | 'Site survey'
  | 'Signage check'
  | 'Equipment inspection'
  | 'Delivery proof';

export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  customerId: string;
  location: GeoPoint & { address: string };
  dueAt: string;
  createdAt: string;
  rewardInr: number;
  assigneeId?: string;
  checklistTemplateId: string;
  distanceKm?: number;
}

export interface NewTaskInput {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  customerId: string;
  areaKey: string;
  address: string;
  dueAt: string;
  rewardInr: number;
  assigneeId?: string;
  checklistTemplateId: string;
  locationLat?: number;
  locationLng?: number;
}

/* ---------- Geotag & Evidence Metadata ---------- */

export interface GeotagMetadata {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  timestamp: string;
  taskId?: string;
  employeeName?: string;
  source: 'in_app_camera' | 'manual_upload';
}

export interface EvidencePhoto {
  id: string;
  caption: string;
  capturedAt: string;
  url?: string;
  hue?: number;
  checklistItemId?: string;
  geotag?: GeotagMetadata;
}

export interface ChecklistResult {
  itemId: string;
  label: string;
  done: boolean;
  required: boolean;
  requiresPhoto: boolean;
  photoAttached: boolean;
}

export type AiVerificationStatus = 'not_run' | 'passed' | 'flagged' | 'failed';

export interface AiCheck {
  id: string;
  label: string;
  outcome: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface AiVerification {
  status: AiVerificationStatus;
  confidence: number | null; // 0-1
  summary: string;
  checks: AiCheck[];
  runAt: string | null;
  model?: string;
  locationMatch?: boolean;
  timestampValid?: boolean;
  contentValid?: boolean;
}

export type ManagerDecisionStatus = 'pending' | 'approved' | 'rework' | 'rejected';

export interface ManagerDecision {
  status: ManagerDecisionStatus;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

export interface Evidence {
  id: string;
  taskId: string;
  employeeId: string;
  submittedAt: string;
  photos: EvidencePhoto[];
  checklist: ChecklistResult[];
  ai: AiVerification;
  managerDecision: ManagerDecision;
}

export type ApprovalStage = 'awaiting_ops' | 'approved' | 'rejected' | 'escalated' | 'rework';

export interface ApprovalAuditEntry {
  stage: ApprovalStage;
  decidedAt: string;
  decidedBy?: string;
  note?: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  evidenceId: string;
  employeeId: string;
  rewardInr: number;
  stage: ApprovalStage;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
  reworkInstructions?: string;
  history?: ApprovalAuditEntry[];
}

/* ---------- Wallet ---------- */

export type TransactionType = 'task_reward' | 'bonus' | 'withdrawal' | 'adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface WalletAccount {
  employeeId: string;
  balanceInr: number;
  pendingInr: number;
}

export interface WalletTransaction {
  id: string;
  employeeId: string;
  type: TransactionType;
  /** Signed: credits positive, debits negative. */
  amountInr: number;
  status: TransactionStatus;
  createdAt: string;
  reference: string;
  taskId?: string;
}

/* ---------- Dashboard ---------- */

export interface DashboardStats {
  totalTasks: number;
  openTasks: number;
  inProgress: number;
  awaitingReview: number;
  approvedTotal: number;
  activeEmployees: number;
  pendingEmployeeApprovals: number;
  awaitingOps: number;
  byStatus: Record<TaskStatus, number>;
  completionTrend: { day: string; completed: number; created: number }[];
}
