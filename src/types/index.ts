/**
 * Domain types. These are shaped to map 1:1 onto future Spring Boot DTOs and
 * Supabase PostgreSQL tables (snake_case columns <-> camelCase JSON via Jackson).
 * IDs are strings so they can be UUIDs in the real backend.
 */

export type Role =
  | 'admin'
  | 'manager'
  | 'operations'
  | 'employee'
  | 'customer'
  | 'partner'
  | 'field_worker';

export interface GeoPoint {
  lat: number;
  lng: number;
  area: string;
}

/* ---------- Employees ---------- */

export type EmployeeApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type Availability = 'available' | 'on_task' | 'offline';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  skills: string[];
  approvalStatus: EmployeeApprovalStatus;
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
}

/* ---------- Evidence & verification ---------- */

export interface EvidencePhoto {
  id: string;
  caption: string;
  capturedAt: string;
  /** Used only to tint the generated placeholder image. Real backend: storage URL. */
  hue: number;
  checklistItemId?: string;
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

/**
 * Sample AI output. In this prototype no model runs; these records are static
 * demo data. They are advisory only and never change approval state.
 */
export interface AiVerification {
  status: AiVerificationStatus;
  confidence: number | null; // 0-1
  summary: string;
  checks: AiCheck[];
  runAt: string | null;
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

/* ---------- Operations approval queue ---------- */

export type ApprovalStage = 'awaiting_ops' | 'approved' | 'rejected' | 'escalated';

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

/* ---------- Transport Management System (TMS) ---------- */

export type TmsVehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE';
export type TmsShipmentStatus = 'CONFIRMED' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface TmsVehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacityKg: number;
  make: string;
  model: string;
  status: TmsVehicleStatus;
  assignedDriverId?: string;
}

export interface TmsTransportPlan {
  id: string;
  planName: string;
  vehicleType: string;
  maxCapacityKg: number;
  baseRateInr: number;
  ratePerKmInr: number;
  estimatedHours: number;
  description: string;
}

export interface TmsShipment {
  id: string;
  bookingRef: string;
  customerId: string;
  originAddress: string;
  destinationAddress: string;
  cargoDescription: string;
  cargoWeightKg: number;
  status: TmsShipmentStatus;
  totalPrice: number;
  currency?: string;
  createdAt: string;
}

export interface CreateShipmentInput {
  originAddress: string;
  destinationAddress: string;
  cargoDescription?: string;
  cargoWeightKg?: number;
  totalPrice?: number;
  transportPlanId?: string;
}

export interface TmsTrackingEvent {
  id: string;
  bookingId: string;
  eventType: string;
  locationText: string;
  notes?: string;
  recordedAt: string;
}

export interface TmsTrackingDetails {
  id: string;
  bookingRef: string;
  status: TmsShipmentStatus;
  originAddress: string;
  destinationAddress: string;
  cargoDescription?: string;
  cargoWeightKg?: number;
  totalPrice?: number;
  createdAt: string;
  events: TmsTrackingEvent[];
}

