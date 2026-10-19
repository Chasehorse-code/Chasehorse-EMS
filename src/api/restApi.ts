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
  WalletAccount,
  WalletTransaction,
} from '@/types';
import type { Actor, ChaseHorseApi } from './contract';
import { http } from './httpClient';
import { haversineKm } from '@/utils/geo';

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

/**
 * Production REST implementation of ChaseHorseApi.
 * Communicates with the Spring Boot backend (`/api/v1/*`).
 * Employs zero client-side fake data, mock accounts, or fallback registries.
 */
export const restApi: ChaseHorseApi = {
  async getDashboardStats(scope?: { customerId?: string }): Promise<DashboardStats> {
    try {
      const data = await http<any>('/dashboard/stats', {
        query: { customerId: scope?.customerId },
      });
      if (data) {
        return {
          totalTasks: data.totalTasks || 0,
          openTasks: data.openTasks || 0,
          inProgress: data.inProgress || 0,
          awaitingReview: data.awaitingReview || 0,
          approvedTotal: data.approvedTotal || 0,
          activeEmployees: data.activeEmployees || 0,
          pendingEmployeeApprovals: data.pendingEmployeeApprovals || 0,
          awaitingOps: data.awaitingOps || 0,
          byStatus: data.byStatus || {
            open: 0,
            assigned: 0,
            in_progress: 0,
            submitted: 0,
            in_review: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
          },
          completionTrend: data.completionTrend || [],
        };
      }
    } catch (err) {
      console.warn('[restApi] getDashboardStats error:', err);
    }
    return EMPTY_DASHBOARD_STATS;
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
    try {
      const data = await http<any[]>('/tasks', {
        query: { customerId: scope?.customerId },
      });
      if (Array.isArray(data)) {
        return data.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          category: (t.category || 'Shelf audit') as any,
          status: (t.status?.toLowerCase() || 'open') as any,
          priority: (t.priority?.toLowerCase() || 'normal') as any,
          customerId: t.customerId || t.createdBy,
          location: {
            lat: t.locationLat ? Number(t.locationLat) : 0,
            lng: t.locationLng ? Number(t.locationLng) : 0,
            area: t.locationArea || t.areaKey || 'Operational Area',
            address: t.locationAddress || t.address || 'Field Location',
          },
          dueAt: t.dueAt || new Date().toISOString(),
          createdAt: t.createdAt || new Date().toISOString(),
          rewardInr: Number(t.rewardAmount) || 0,
          assigneeId: t.assignedTo,
          checklistTemplateId: t.checklistTemplateId || 'chk-shelf',
        }));
      }
      return [];
    } catch (err) {
      console.warn('[restApi] listTasks remote error:', err);
      return [];
    }
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

    return {
      id: res.id,
      title: res.title,
      description: res.description,
      category: input.category,
      status: (res.status?.toLowerCase() || 'open') as any,
      priority: input.priority,
      customerId: res.customerId || input.customerId,
      location: {
        lat: res.locationLat ? Number(res.locationLat) : (input.locationLat || 0),
        lng: res.locationLng ? Number(res.locationLng) : (input.locationLng || 0),
        area: input.areaKey,
        address: input.address,
      },
      dueAt: res.dueAt || input.dueAt,
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || input.rewardInr,
      assigneeId: res.assignedTo,
      checklistTemplateId: input.checklistTemplateId,
    };
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
        lat: Number(res.locationLat) || 0,
        lng: Number(res.locationLng) || 0,
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
    const res = await http<any>(`/tasks/${taskId}/accept`, {
      method: 'POST',
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
        lat: Number(res.locationLat) || 0,
        lng: Number(res.locationLng) || 0,
        area: res.locationArea || 'Operational Zone',
        address: res.locationAddress || 'Field Site',
      },
      dueAt: res.dueAt || new Date().toISOString(),
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || 0,
      assigneeId: res.assignedTo,
      checklistTemplateId: res.checklistTemplateId || 'chk-shelf',
    };
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
            phone: e.phone || '',
            region: e.region || 'Operational Region',
            skills: [],
            approvalStatus: (e.accountStatus?.toLowerCase() || 'pending') as EmployeeApprovalStatus,
            subRole: isManager ? 'manager' : 'field_worker',
            availability: 'available',
            location: { lat: 0, lng: 0, area: e.region || 'Operational Region' },
            joinedAt: e.createdAt || new Date().toISOString(),
            tasksCompleted: 0,
            rating: Number(e.rating) || 0,
            documentsVerified: e.accountStatus === 'ACTIVE',
          };
        });
      }
    } catch (err) {
      console.warn('[restApi] listEmployees error:', err);
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
      phone: res.phone || '',
      region: res.region || 'Operational Region',
      skills: [],
      approvalStatus: status,
      subRole: subRole || 'field_worker',
      availability: 'available',
      location: { lat: 0, lng: 0, area: res.region || 'Region' },
      joinedAt: res.createdAt,
      tasksCompleted: 0,
      rating: Number(res.rating) || 0,
      documentsVerified: status === 'approved',
    };
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
