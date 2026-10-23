import type {
  AiVerificationStatus,
  ApprovalStage,
  Availability,
  EmployeeApprovalStatus,
  ManagerDecisionStatus,
  TaskPriority,
  TaskStatus,
  TransactionStatus,
  TransactionType,
} from '@/types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'ai';

interface Label {
  label: string;
  tone: Tone;
}

export const taskStatusLabel: Record<TaskStatus, Label> = {
  open: { label: 'Open', tone: 'info' },
  assigned: { label: 'Assigned', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'warning' },
  submitted: { label: 'Submitted', tone: 'warning' },
  in_review: { label: 'In review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const priorityLabel: Record<TaskPriority, Label> = {
  low: { label: 'Low', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'info' },
  high: { label: 'High', tone: 'warning' },
  urgent: { label: 'Urgent', tone: 'danger' },
};

export const employeeApprovalLabel: Record<EmployeeApprovalStatus, Label> = {
  pending: { label: 'Pending approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  suspended: { label: 'Suspended', tone: 'neutral' },
};

export const availabilityLabel: Record<Availability, Label> = {
  available: { label: 'Available', tone: 'success' },
  on_task: { label: 'On a task', tone: 'info' },
  offline: { label: 'Offline', tone: 'neutral' },
};

export const aiStatusLabel: Record<AiVerificationStatus, Label> = {
  passed: { label: 'AI: looks consistent', tone: 'ai' },
  flagged: { label: 'AI: needs a look', tone: 'warning' },
  failed: { label: 'AI: issues found', tone: 'danger' },
  not_run: { label: 'AI: not run', tone: 'neutral' },
};

export const managerDecisionLabel: Record<ManagerDecisionStatus, Label> = {
  pending: { label: 'Awaiting manager', tone: 'warning' },
  approved: { label: 'Manager approved', tone: 'success' },
  rework: { label: 'Rework requested', tone: 'warning' },
  rejected: { label: 'Manager rejected', tone: 'danger' },
};

export const approvalStageLabel: Record<ApprovalStage, Label> = {
  awaiting_ops: { label: 'Awaiting operations', tone: 'warning' },
  approved: { label: 'Operations approved', tone: 'success' },
  rejected: { label: 'Operations rejected', tone: 'danger' },
  escalated: { label: 'Escalated', tone: 'danger' },
  rework: { label: 'Rework requested', tone: 'warning' },
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  task_reward: 'Task reward',
  bonus: 'Bonus',
  withdrawal: 'Withdrawal',
  adjustment: 'Adjustment',
};

export const transactionStatusLabel: Record<TransactionStatus, Label> = {
  completed: { label: 'Completed', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
};

export const taskStatusOrder: TaskStatus[] = [
  'open',
  'assigned',
  'in_progress',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'cancelled',
];
