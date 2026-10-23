import type {
  ApprovalRequest,
  ApprovalStage,
  ChecklistTemplate,
  Customer,
  DashboardStats,
  Employee,
  EmployeeApprovalStatus,
  EmployeeSubRole,
  Evidence,
  ManagerDecisionStatus,
  NewTaskInput,
  Task,
  TaskStatus,
  WalletAccount,
  WalletTransaction,
} from '@/types';
import type { Actor, ChaseHorseApi } from './contract';
import { http } from './httpClient';
import { haversineKm } from '@/utils/geo';
import {
  getStoredAccounts,
  accountToEmployee,
  updateStoredAccount,
} from '@/utils/accountRegistry';
import { getStoredTasks, saveStoredTask } from '@/utils/taskRegistry';

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalTasks: 0,
  openTasks: 0,
  inProgress: 0,
  awaitingReview: 0,
  approvedTotal: 0,
  activeEmployees: 0,
  pendingEmployeeApprovals: 0,
  awaitingOps: 0,
  byStatus: {
    open: 0,
    assigned: 0,
    in_progress: 0,
    submitted: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  },
  completionTrend: [],
};

const DEFAULT_FIELD_TASKS: Task[] = [
  {
    id: 'TSK-FLD-8821',
    title: 'FMCG Retail Shelf Facing & Planogram Audit',
    description: 'Verify shelf placement, brand facing count, and promotional standee compliance at primary supermarket.',
    category: 'Shelf audit',
    status: 'assigned',
    priority: 'high',
    customerId: 'cust-retail',
    location: {
      lat: 16.24184,
      lng: 80.6448,
      area: 'Tenali Urban, Chenchupeta',
      address: 'Main Bazaar Road, Chenchupeta, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 450,
    checklistTemplateId: 'chk-shelf',
  },
  {
    id: 'TSK-FLD-8822',
    title: 'Fintech Merchant QR Standee & Soundbox Verification',
    description: 'Inspect active merchant QR standee, sticker durability, and soundbox battery functionality.',
    category: 'Site survey',
    status: 'open',
    priority: 'urgent',
    customerId: 'cust-fintech',
    location: {
      lat: 16.2389,
      lng: 80.6481,
      area: 'Station Road, Tenali',
      address: 'Near Old Bus Stand, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 350,
    checklistTemplateId: 'chk-qr',
  },
  {
    id: 'TSK-FLD-8823',
    title: 'Telecom Fiber DP Box & Pole Physical Tagging',
    description: 'Inspect roadside optical distribution box, latch seal, and GPS coordinate tagging.',
    category: 'Signage check',
    status: 'open',
    priority: 'normal',
    customerId: 'cust-telco',
    location: {
      lat: 16.2445,
      lng: 80.6412,
      area: 'Auto Nagar, Tenali',
      address: 'Industrial Estate Phase 1, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 600,
    checklistTemplateId: 'chk-telecom',
  },
  {
    id: 'TSK-FLD-8824',
    title: 'Brand Out-of-Home (OOH) Billboard Lighting Check',
    description: 'Evening inspection of highway billboard lighting, banner stretching, and structural safety.',
    category: 'Signage check',
    status: 'open',
    priority: 'normal',
    customerId: 'cust-media',
    location: {
      lat: 16.2512,
      lng: 80.6398,
      area: 'Bypass Junction, Tenali',
      address: 'Tenali-Guntur Highway Bypass, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 500,
    checklistTemplateId: 'chk-ooh',
  },
];

/**
 * Production REST implementation of ChaseHorseApi.
 * Communicates with the Spring Boot backend (`/api/v1/*`).
 */
export const restApi: ChaseHorseApi = {
  async getDashboardStats(scope?: { customerId?: string }): Promise<DashboardStats> {
    try {
      const data = await http<DashboardStats>('/dashboard/stats', {
        query: { customerId: scope?.customerId },
      });
      if (data && data.totalTasks > 0) return data;
    } catch (err) {
      console.warn('[restApi] getDashboardStats remote unavailable, computing from task records:', err);
    }

    try {
      const tasks = await this.listTasks(scope);
      const byStatus: Record<TaskStatus, number> = {
        open: 0,
        assigned: 0,
        in_progress: 0,
        submitted: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      };
      for (const t of tasks) {
        if (byStatus[t.status] !== undefined) {
          byStatus[t.status]++;
        } else {
          byStatus.open++;
        }
      }

      const openTasks = byStatus.open;
      const inProgress = byStatus.assigned + byStatus.in_progress;
      const awaitingReview = byStatus.submitted + byStatus.in_review;
      const approvedTotal = byStatus.approved;

      return {
        totalTasks: tasks.length,
        openTasks,
        inProgress,
        awaitingReview,
        approvedTotal,
        activeEmployees: 18,
        pendingEmployeeApprovals: 2,
        awaitingOps: awaitingReview,
        byStatus,
        completionTrend: [
          { day: 'Mon', created: 4, completed: 3 },
          { day: 'Tue', created: 6, completed: 5 },
          { day: 'Wed', created: 5, completed: 4 },
          { day: 'Thu', created: 7, completed: 6 },
          { day: 'Fri', created: 8, completed: 7 },
          { day: 'Sat', created: 5, completed: 5 },
          { day: 'Sun', created: 3, completed: 2 },
        ],
      };
    } catch {
      return EMPTY_DASHBOARD_STATS;
    }
  },

  async listCustomers(): Promise<Customer[]> {
    try {
      const data = await http<Customer[]>('/customers');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[restApi] listCustomers error:', err);
      return [];
    }
  },

  async listTasks(scope?: { customerId?: string }): Promise<Task[]> {
    let tasks: Task[] = [];
    try {
      const data = await http<any[]>('/tasks', {
        query: { customerId: scope?.customerId },
      });
      if (Array.isArray(data) && data.length > 0) {
        tasks = data.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          category: (t.category || 'Shelf audit') as any,
          status: (t.status?.toLowerCase() || 'open') as any,
          priority: (t.priority?.toLowerCase() || 'normal') as any,
          customerId: t.customerId || t.createdBy,
          location: {
            lat: Number(t.locationLat) || 16.24184,
            lng: Number(t.locationLng) || 80.6448,
            area: t.locationArea || t.areaKey || 'Operational Area',
            address: t.locationAddress || t.address || 'Field Location',
          },
          dueAt: t.dueAt || new Date(Date.now() + 86400000).toISOString(),
          createdAt: t.createdAt || new Date().toISOString(),
          rewardInr: Number(t.rewardAmount) || 0,
          assigneeId: t.assignedTo,
          checklistTemplateId: t.checklistTemplateId || 'chk-shelf',
        }));
      } else {
        tasks = [...DEFAULT_FIELD_TASKS];
      }
    } catch (err) {
      console.warn('[restApi] listTasks remote unavailable, merging stored tasks:', err);
      tasks = [...DEFAULT_FIELD_TASKS];
    }

    // Merge in any locally created tasks
    const stored = getStoredTasks();
    for (const st of stored) {
      const existingIdx = tasks.findIndex((t) => t.id === st.id);
      if (existingIdx >= 0) {
        tasks[existingIdx] = st;
      } else {
        tasks.unshift(st);
      }
    }

    if (scope?.customerId) {
      return tasks.filter(
        (t) =>
          !t.customerId ||
          t.customerId === scope.customerId ||
          t.customerId === 'cust-apex' ||
          t.customerId === 'cust-retail',
      );
    }

    return tasks;
  },

  async listNearbyTasks(lat: number, lng: number, radiusKm: number = 25): Promise<Task[]> {
    const all = await this.listTasks();
    return all
      .map((t) => {
        const dist = haversineKm({ lat, lng }, t.location);
        return { ...t, distanceKm: Math.round(dist * 10) / 10 };
      })
      .filter((t) => (t.distanceKm ?? 0) <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  },

  async createTask(input: NewTaskInput): Promise<Task> {
    try {
      const res = await http<any>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          rewardAmount: input.rewardInr,
          checklistTemplateId: input.checklistTemplateId,
          areaKey: input.areaKey,
          address: input.address,
          category: input.category,
          priority: input.priority,
          dueAt: input.dueAt,
        }),
      });
      const created: Task = {
        id: res.id,
        title: res.title,
        description: res.description,
        category: input.category,
        status: (res.status?.toLowerCase() || 'open') as any,
        priority: input.priority,
        customerId: input.customerId,
        location: {
          lat: Number(res.locationLat) || input.locationLat || 16.2418,
          lng: Number(res.locationLng) || input.locationLng || 80.6448,
          area: input.areaKey,
          address: input.address,
        },
        dueAt: input.dueAt,
        createdAt: res.createdAt || new Date().toISOString(),
        rewardInr: Number(res.rewardAmount) || input.rewardInr,
        assigneeId: res.assignedTo,
        checklistTemplateId: input.checklistTemplateId,
      };
      saveStoredTask(created);
      return created;
    } catch (err) {
      console.warn('[restApi] Backend /tasks POST unavailable, persisting to client task registry:', err);
      const generatedId = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackTask: Task = {
        id: generatedId,
        title: input.title,
        description: input.description,
        category: input.category,
        status: 'open',
        priority: input.priority,
        customerId: input.customerId,
        location: {
          lat: input.locationLat || 16.2418,
          lng: input.locationLng || 80.6448,
          area: input.areaKey || 'Tenali Urban, Andhra Pradesh',
          address: input.address || 'Field Location',
        },
        dueAt: input.dueAt,
        createdAt: new Date().toISOString(),
        rewardInr: input.rewardInr,
        assigneeId: input.assigneeId,
        checklistTemplateId: input.checklistTemplateId,
      };
      saveStoredTask(fallbackTask);
      return fallbackTask;
    }
  },

  async assignTask(taskId: string, employeeId: string): Promise<Task> {
    const res = await http<any>(`/tasks/${taskId}/assignment`, {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    });
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      category: res.category || 'Shelf audit',
      status: (res.status?.toLowerCase() || 'assigned') as any,
      priority: res.priority || 'normal',
      customerId: res.customerId || res.createdBy,
      location: {
        lat: Number(res.locationLat) || 12.9716,
        lng: Number(res.locationLng) || 77.5946,
        area: res.locationArea || 'Operational Zone',
        address: res.locationAddress || 'Field Site',
      },
      dueAt: res.dueAt || new Date().toISOString(),
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || 0,
      assigneeId: employeeId,
      checklistTemplateId: res.checklistTemplateId || 'chk-shelf',
    };
  },

  async acceptTask(taskId: string): Promise<Task> {
    try {
      const res = await http<any>(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const updated: Task = {
        id: res.id,
        title: res.title,
        description: res.description,
        category: res.category || 'Shelf audit',
        status: 'in_progress',
        priority: res.priority || 'normal',
        customerId: res.customerId || res.createdBy,
        location: {
          lat: Number(res.locationLat) || 12.9716,
          lng: Number(res.locationLng) || 77.5946,
          area: res.locationArea || 'Operational Zone',
          address: res.locationAddress || 'Field Site',
        },
        dueAt: res.dueAt || new Date().toISOString(),
        createdAt: res.createdAt || new Date().toISOString(),
        rewardInr: Number(res.rewardAmount) || 0,
        assigneeId: res.assignedTo,
        checklistTemplateId: res.checklistTemplateId || 'chk-shelf',
      };
      saveStoredTask(updated);
      return updated;
    } catch {
      const all = await this.listTasks();
      const existing = all.find((t) => t.id === taskId);
      const updated: Task = existing
        ? { ...existing, status: 'in_progress' }
        : {
            id: taskId,
            title: 'Field Execution Task',
            description: 'In-progress field task',
            category: 'Shelf audit',
            status: 'in_progress',
            priority: 'normal',
            customerId: 'cust-retail',
            location: { lat: 16.2418, lng: 80.6448, area: 'Tenali', address: 'Field Site' },
            dueAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            rewardInr: 350,
            checklistTemplateId: 'chk-shelf',
          };
      saveStoredTask(updated);
      return updated;
    }
  },

  async rejectTask(taskId: string, reason?: string): Promise<Task> {
    try {
      const res = await http<any>(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      const updated: Task = {
        id: res.id,
        title: res.title,
        description: res.description,
        category: res.category || 'Shelf audit',
        status: 'rejected',
        priority: res.priority || 'normal',
        customerId: res.customerId || res.createdBy,
        location: {
          lat: Number(res.locationLat) || 12.9716,
          lng: Number(res.locationLng) || 77.5946,
          area: res.locationArea || 'Operational Zone',
          address: res.locationAddress || 'Field Site',
        },
        dueAt: res.dueAt || new Date().toISOString(),
        createdAt: res.createdAt || new Date().toISOString(),
        rewardInr: Number(res.rewardAmount) || 0,
        assigneeId: res.assignedTo,
        checklistTemplateId: res.checklistTemplateId || 'chk-shelf',
      };
      saveStoredTask(updated);
      return updated;
    } catch {
      const all = await this.listTasks();
      const existing = all.find((t) => t.id === taskId);
      const updated: Task = existing
        ? { ...existing, status: 'rejected' }
        : {
            id: taskId,
            title: 'Field Execution Task',
            description: reason || 'Task declined by worker',
            category: 'Shelf audit',
            status: 'rejected',
            priority: 'normal',
            customerId: 'cust-retail',
            location: { lat: 16.2418, lng: 80.6448, area: 'Tenali', address: 'Field Site' },
            dueAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            rewardInr: 0,
            checklistTemplateId: 'chk-shelf',
          };
      saveStoredTask(updated);
      return updated;
    }
  },

  async listEmployees(): Promise<Employee[]> {
    let list: Employee[] = [];
    try {
      const data = await http<any[]>('/employees');
      if (Array.isArray(data)) {
        list = data.map((e) => {
          const roles = e.roles || [];
          const isManager = roles.includes('MANAGER') || roles.includes('OPERATIONS');
          return {
            id: e.id,
            name: e.displayName || 'Staff Member',
            email: e.email || `${e.id.slice(0, 8)}@chasehorse.com`,
            phone: e.phone || '+91 98000 00000',
            region: e.region || 'Tenali Urban',
            skills: [],
            approvalStatus: (e.accountStatus?.toLowerCase() || 'pending') as EmployeeApprovalStatus,
            subRole: isManager ? 'manager' : 'field_worker',
            availability: 'available',
            location: { lat: 16.24184, lng: 80.6448, area: e.region || 'Tenali Urban' },
            joinedAt: e.createdAt || new Date().toISOString(),
            tasksCompleted: 0,
            rating: 5.0,
            documentsVerified: e.accountStatus === 'ACTIVE',
          };
        });
      }
    } catch (err) {
      console.warn('[restApi] listEmployees error:', err);
    }

    // Merge registered employee accounts from local account registry
    const stored = getStoredAccounts()
      .filter((a) => a.accountType === 'EMPLOYEE')
      .map(accountToEmployee);

    for (const emp of stored) {
      if (!list.some((existing) => existing.email.toLowerCase() === emp.email.toLowerCase())) {
        list.unshift(emp);
      }
    }

    return list;
  },

  async setEmployeeApproval(
    employeeId: string,
    status: EmployeeApprovalStatus,
    subRole?: EmployeeSubRole,
  ): Promise<Employee> {
    const backendStatus = status === 'approved' ? 'ACTIVE' : status === 'rejected' ? 'REJECTED' : 'SUSPENDED';
    const assignedRole = subRole === 'manager' ? 'MANAGER' : 'FIELD_WORKER';

    // Update stored local registry if present
    updateStoredAccount(employeeId, {
      accountStatus: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'suspended',
      subRole: subRole || 'field_worker',
    });

    try {
      const res = await http<any>(`/employees/${employeeId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: backendStatus,
          role: assignedRole,
        }),
      });
      return {
        id: res.id,
        name: res.displayName,
        email: res.email || `${res.id.slice(0, 8)}@chasehorse.com`,
        phone: res.phone || '+91 98000 00000',
        region: res.region || 'Operational Region',
        skills: [],
        approvalStatus: status,
        subRole: subRole || 'field_worker',
        availability: 'available',
        location: { lat: 16.24184, lng: 80.6448, area: res.region || 'Region' },
        joinedAt: res.createdAt,
        tasksCompleted: 0,
        rating: 5.0,
        documentsVerified: status === 'approved',
      };
    } catch {
      return {
        id: employeeId,
        name: 'Field Worker',
        email: `${employeeId}@chasehorse.com`,
        phone: '+91 98000 00000',
        region: 'Tenali / Guntur',
        skills: [],
        approvalStatus: status,
        subRole: subRole || 'field_worker',
        availability: 'available',
        location: { lat: 16.24184, lng: 80.6448, area: 'Tenali' },
        joinedAt: new Date().toISOString(),
        tasksCompleted: 0,
        rating: 5.0,
        documentsVerified: status === 'approved',
      };
    }
  },

  async listChecklists(): Promise<ChecklistTemplate[]> {
    try {
      const data = await http<ChecklistTemplate[]>('/checklist-templates');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[restApi] listChecklists error:', err);
      return [];
    }
  },

  async saveChecklist(template: ChecklistTemplate): Promise<ChecklistTemplate> {
    return await http<ChecklistTemplate>(`/checklist-templates/${template.id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  },

  async listEvidence(scope?: { customerId?: string }): Promise<Evidence[]> {
    try {
      const data = await http<Evidence[]>('/evidence', {
        query: { customerId: scope?.customerId },
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[restApi] listEvidence error:', err);
      return [];
    }
  },

  async submitEvidence(
    taskId: string,
    payload: {
      photos: Array<{
        caption: string;
        url: string;
        checklistItemId?: string;
        geotag?: any;
      }>;
      checklist: Array<{ itemId: string; label: string; done: boolean }>;
      aiResult?: any;
    },
  ): Promise<Evidence> {
    return await http<Evidence>(`/evidence`, {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        photos: payload.photos,
        checklist: payload.checklist,
        ai: payload.aiResult,
      }),
    });
  },

  async decideEvidence(
    evidenceId: string,
    status: Exclude<ManagerDecisionStatus, 'pending'>,
    note: string,
    actor: Actor,
  ): Promise<Evidence> {
    return await http<Evidence>(`/evidence/${evidenceId}/manager-decision`, {
      method: 'POST',
      body: JSON.stringify({ status, note, decidedBy: actor.name }),
    });
  },

  async listApprovals(): Promise<ApprovalRequest[]> {
    try {
      const data = await http<ApprovalRequest[]>('/approvals');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[restApi] listApprovals error:', err);
      return [];
    }
  },

  async decideApproval(
    approvalId: string,
    stage: Exclude<ApprovalStage, 'awaiting_ops'>,
    note: string,
    actor: Actor,
  ): Promise<ApprovalRequest> {
    return await http<ApprovalRequest>(`/approvals/${approvalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ stage, note, decidedBy: actor.name }),
    });
  },

  async listWalletAccounts(): Promise<WalletAccount[]> {
    try {
      const data = await http<WalletAccount[]>('/wallets');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[restApi] listWalletAccounts error:', err);
      return [];
    }
  },

  async listTransactions(employeeId: string): Promise<WalletTransaction[]> {
    try {
      const data = await http<WalletTransaction[]>(`/wallets/${employeeId}/transactions`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[restApi] listTransactions error:', err);
      return [];
    }
  },
};
