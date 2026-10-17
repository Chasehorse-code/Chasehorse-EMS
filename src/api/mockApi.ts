/**
 * In-memory MOCK implementation of the API contract.
 *
 * - All data is fictional demo data (see src/data/mockData.ts).
 * - State lives in module memory only: it resets on page refresh.
 * - Nothing here authenticates, verifies, pays or transfers anything.
 */
import {
  AREAS,
  approvals as seedApprovals,
  checklistTemplates as seedChecklists,
  completionTrend,
  customers as seedCustomers,
  employees as seedEmployees,
  evidence as seedEvidence,
  isoOffset,
  tasks as seedTasks,
  walletAccounts as seedWalletAccounts,
  walletTransactions as seedTransactions,
} from '@/data/mockData';
import type { ChaseHorseApi } from './contract';
import type {
  ApprovalRequest,
  ChecklistTemplate,
  DashboardStats,
  Employee,
  Evidence,
  Task,
  TaskStatus,
} from '@/types';

const LATENCY_MS = 220;

const db = {
  customers: structuredClone(seedCustomers),
  employees: structuredClone(seedEmployees),
  tasks: structuredClone(seedTasks),
  checklists: structuredClone(seedChecklists),
  evidence: structuredClone(seedEvidence),
  approvals: structuredClone(seedApprovals),
  wallets: structuredClone(seedWalletAccounts),
  transactions: structuredClone(seedTransactions),
};

/** Simulated network delay + defensive copy so callers can't mutate our state. */
function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), LATENCY_MS);
  });
}

const nextTaskNumber = () =>
  Math.max(...db.tasks.map((t) => Number(t.id.replace('T-', '')))) + 1;

const scopedTasks = (customerId?: string) =>
  customerId ? db.tasks.filter((t) => t.customerId === customerId) : db.tasks;

export const mockApi: ChaseHorseApi = {
  async getDashboardStats(scope) {
    const list = scopedTasks(scope?.customerId);
    const byStatus = {
      open: 0,
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    } as Record<TaskStatus, number>;
    list.forEach((t) => (byStatus[t.status] += 1));

    const stats: DashboardStats = {
      totalTasks: list.length,
      openTasks: byStatus.open,
      inProgress: byStatus.in_progress + byStatus.assigned,
      awaitingReview: byStatus.submitted + byStatus.in_review,
      approvedTotal: byStatus.approved,
      activeEmployees: db.employees.filter((e) => e.approvalStatus === 'approved' && e.availability !== 'offline').length,
      pendingEmployeeApprovals: db.employees.filter((e) => e.approvalStatus === 'pending').length,
      awaitingOps: db.approvals.filter((a) => a.stage === 'awaiting_ops' || a.stage === 'escalated').length,
      byStatus,
      completionTrend,
    };
    return respond(stats);
  },

  listCustomers: () => respond(db.customers),

  listTasks: (scope) => respond(scopedTasks(scope?.customerId)),

  async createTask(input) {
    const area = AREAS[input.areaKey] ?? Object.values(AREAS)[0];
    const task: Task = {
      id: `T-${nextTaskNumber()}`,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      status: input.assigneeId ? 'assigned' : 'open',
      priority: input.priority,
      customerId: input.customerId,
      location: { ...area, address: input.address.trim() || area.area },
      dueAt: new Date(input.dueAt).toISOString(),
      createdAt: isoOffset(0, 0),
      rewardInr: input.rewardInr,
      assigneeId: input.assigneeId || undefined,
      checklistTemplateId: input.checklistTemplateId,
    };
    db.tasks.unshift(task);
    return respond(task);
  },

  async assignTask(taskId, employeeId) {
    const task = db.tasks.find((t) => t.id === taskId);
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!task) throw new Error('Task not found');
    if (!emp || emp.approvalStatus !== 'approved') throw new Error('Only approved employees can be assigned');
    task.assigneeId = employeeId;
    if (task.status === 'open') task.status = 'assigned';
    return respond(task);
  },

  listEmployees: () => respond(db.employees),

  async setEmployeeApproval(employeeId, status) {
    const emp = db.employees.find((e) => e.id === employeeId) as Employee | undefined;
    if (!emp) throw new Error('Employee not found');
    emp.approvalStatus = status;
    if (status !== 'approved') emp.availability = 'offline';
    return respond(emp);
  },

  listChecklists: () => respond(db.checklists),

  async saveChecklist(template) {
    const idx = db.checklists.findIndex((c) => c.id === template.id);
    const saved: ChecklistTemplate = { ...template, updatedAt: isoOffset(0, 0) };
    if (idx >= 0) db.checklists[idx] = saved;
    else db.checklists.push(saved);
    return respond(saved);
  },

  async listEvidence(scope) {
    if (!scope?.customerId) return respond(db.evidence);
    const ids = new Set(scopedTasks(scope.customerId).map((t) => t.id));
    return respond(db.evidence.filter((e) => ids.has(e.taskId)));
  },

  async decideEvidence(evidenceId, status, note, actor) {
    const ev = db.evidence.find((e) => e.id === evidenceId) as Evidence | undefined;
    if (!ev) throw new Error('Evidence not found');
    ev.managerDecision = { status, note, decidedBy: actor.name, decidedAt: isoOffset(0, 0) };

    const task = db.tasks.find((t) => t.id === ev.taskId);
    if (task) {
      task.status = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'in_review';
    }

    // A manager approval hands the item to the operations queue.
    if (status === 'approved' && task && !db.approvals.some((a) => a.evidenceId === ev.id)) {
      const request: ApprovalRequest = {
        id: `AP-${task.id.slice(2)}`,
        taskId: task.id,
        evidenceId: ev.id,
        employeeId: ev.employeeId,
        rewardInr: task.rewardInr,
        stage: 'awaiting_ops',
        submittedAt: isoOffset(0, 0),
      };
      db.approvals.unshift(request);
    }
    return respond(ev);
  },

  listApprovals: () => respond(db.approvals),

  async decideApproval(approvalId, stage, note, actor) {
    const ap = db.approvals.find((a) => a.id === approvalId);
    if (!ap) throw new Error('Approval request not found');
    ap.stage = stage;
    ap.note = note || ap.note;
    if (stage !== 'escalated') {
      ap.decidedAt = isoOffset(0, 0);
      ap.decidedBy = actor.name;
    }
    // Deliberately NOT touching wallets: no payment logic exists in this prototype.
    return respond(ap);
  },

  listWalletAccounts: () => respond(db.wallets),

  listTransactions: (employeeId) =>
    respond(db.transactions.filter((t) => t.employeeId === employeeId)),
};
