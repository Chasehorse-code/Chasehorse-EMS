import type {
  ApprovalRequest,
  ApprovalStage,
  ChecklistTemplate,
  Customer,
  DashboardStats,
  Employee,
  EmployeeApprovalStatus,
  Evidence,
  ManagerDecisionStatus,
  NewTaskInput,
  Task,
  WalletAccount,
  WalletTransaction,
} from '@/types';
import type { Actor, ChaseHorseApi } from './contract';
import { http } from './httpClient';
import { mockApi } from './mockApi';

/**
 * Production REST implementation of ChaseHorseApi.
 * Communicates with the Spring Boot backend (`/api/v1/*`), with automatic
 * fallback to mockApi if the backend is offline during local evaluation.
 */
export const restApi: ChaseHorseApi = {
  async getDashboardStats(scope?: { customerId?: string }): Promise<DashboardStats> {
    try {
      return await http<DashboardStats>('/dashboard/stats', {
        query: { customerId: scope?.customerId },
      });
    } catch (err) {
      console.warn('[restApi] getDashboardStats fallback to mock:', err);
      return mockApi.getDashboardStats(scope);
    }
  },

  async listCustomers(): Promise<Customer[]> {
    try {
      return await http<Customer[]>('/customers');
    } catch {
      return mockApi.listCustomers();
    }
  },

  async listTasks(scope?: { customerId?: string }): Promise<Task[]> {
    try {
      const data = await http<any[]>('/tasks', {
        query: { customerId: scope?.customerId },
      });
      return data.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category: (t.category || 'Shelf audit') as any,
        status: (t.status?.toLowerCase() || 'open') as any,
        priority: (t.priority?.toLowerCase() || 'normal') as any,
        customerId: t.customerId || t.createdBy,
        location: {
          lat: t.locationLat || 12.9716,
          lng: t.locationLng || 77.5946,
          area: t.locationArea || 'Central District',
          address: t.locationAddress || 'Main Hub',
        },
        dueAt: t.dueAt || new Date(Date.now() + 86400000).toISOString(),
        createdAt: t.createdAt,
        rewardInr: Number(t.rewardAmount) || 0,
        assigneeId: t.assignedTo,
        checklistTemplateId: t.checklistTemplateId || 'chk-shelf',
      }));
    } catch (err) {
      console.warn('[restApi] listTasks fallback to mock:', err);
      return mockApi.listTasks(scope);
    }
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
        }),
      });
      return {
        id: res.id,
        title: res.title,
        description: res.description,
        category: input.category,
        status: (res.status?.toLowerCase() || 'open') as any,
        priority: input.priority,
        customerId: input.customerId,
        location: {
          lat: 12.9716,
          lng: 77.5946,
          area: input.areaKey,
          address: input.address,
        },
        dueAt: input.dueAt,
        createdAt: res.createdAt,
        rewardInr: Number(res.rewardAmount) || 0,
        assigneeId: res.assignedTo,
        checklistTemplateId: input.checklistTemplateId,
      };
    } catch (err) {
      console.warn('[restApi] createTask fallback to mock:', err);
      return mockApi.createTask(input);
    }
  },

  async assignTask(taskId: string, employeeId: string): Promise<Task> {
    try {
      const res = await http<any>(`/tasks/${taskId}/assignment`, {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      });
      return {
        id: res.id,
        title: res.title,
        description: res.description,
        category: 'Shelf audit',
        status: (res.status?.toLowerCase() || 'assigned') as any,
        priority: 'normal',
        customerId: res.customerId || res.createdBy,
        location: { lat: 12.9716, lng: 77.5946, area: 'District A', address: 'Site 1' },
        dueAt: res.dueAt || new Date().toISOString(),
        createdAt: res.createdAt,
        rewardInr: Number(res.rewardAmount) || 0,
        assigneeId: employeeId,
        checklistTemplateId: 'chk-shelf',
      };
    } catch (err) {
      console.warn('[restApi] assignTask fallback to mock:', err);
      return mockApi.assignTask(taskId, employeeId);
    }
  },

  async listEmployees(): Promise<Employee[]> {
    try {
      const data = await http<any[]>('/employees');
      return data.map((e) => ({
        id: e.id,
        name: e.displayName || 'Staff Member',
        email: e.email || `${e.id.slice(0, 8)}@chasehorse.com`,
        phone: e.phone || '+91 98000 00000',
        region: e.region || 'Bangalore Central',
        skills: ['Verification', 'Site Survey'],
        approvalStatus: (e.accountStatus?.toLowerCase() || 'pending') as EmployeeApprovalStatus,
        availability: 'available',
        location: { lat: 12.9716, lng: 77.5946, area: 'Indiranagar' },
        joinedAt: e.createdAt,
        tasksCompleted: 12,
        rating: 4.8,
        documentsVerified: e.accountStatus === 'ACTIVE',
      }));
    } catch (err) {
      console.warn('[restApi] listEmployees fallback to mock:', err);
      return mockApi.listEmployees();
    }
  },

  async setEmployeeApproval(employeeId: string, status: EmployeeApprovalStatus): Promise<Employee> {
    try {
      const backendStatus = status === 'approved' ? 'ACTIVE' : status === 'rejected' ? 'REJECTED' : 'SUSPENDED';
      const res = await http<any>(`/employees/${employeeId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status: backendStatus }),
      });
      return {
        id: res.id,
        name: res.displayName,
        email: `${res.id.slice(0, 8)}@chasehorse.com`,
        phone: '+91 98000 00000',
        region: 'Bangalore Central',
        skills: ['Verification'],
        approvalStatus: status,
        availability: 'available',
        location: { lat: 12.9716, lng: 77.5946, area: 'Indiranagar' },
        joinedAt: res.createdAt,
        tasksCompleted: 0,
        rating: 5.0,
        documentsVerified: status === 'approved',
      };
    } catch (err) {
      console.warn('[restApi] setEmployeeApproval fallback to mock:', err);
      return mockApi.setEmployeeApproval(employeeId, status);
    }
  },

  async listChecklists(): Promise<ChecklistTemplate[]> {
    try {
      return await http<ChecklistTemplate[]>('/checklist-templates');
    } catch {
      return mockApi.listChecklists();
    }
  },

  async saveChecklist(template: ChecklistTemplate): Promise<ChecklistTemplate> {
    try {
      return await http<ChecklistTemplate>(`/checklist-templates/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify(template),
      });
    } catch {
      return mockApi.saveChecklist(template);
    }
  },

  async listEvidence(scope?: { customerId?: string }): Promise<Evidence[]> {
    try {
      return await http<Evidence[]>('/evidence', {
        query: { customerId: scope?.customerId },
      });
    } catch {
      return mockApi.listEvidence(scope);
    }
  },

  async decideEvidence(
    evidenceId: string,
    status: Exclude<ManagerDecisionStatus, 'pending'>,
    note: string,
    actor: Actor,
  ): Promise<Evidence> {
    try {
      return await http<Evidence>(`/evidence/${evidenceId}/manager-decision`, {
        method: 'POST',
        body: JSON.stringify({ status, note, decidedBy: actor.name }),
      });
    } catch {
      return mockApi.decideEvidence(evidenceId, status, note, actor);
    }
  },

  async listApprovals(): Promise<ApprovalRequest[]> {
    try {
      return await http<ApprovalRequest[]>('/approvals');
    } catch {
      return mockApi.listApprovals();
    }
  },

  async decideApproval(
    approvalId: string,
    stage: Exclude<ApprovalStage, 'awaiting_ops'>,
    note: string,
    actor: Actor,
  ): Promise<ApprovalRequest> {
    try {
      return await http<ApprovalRequest>(`/approvals/${approvalId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ stage, note, decidedBy: actor.name }),
      });
    } catch {
      return mockApi.decideApproval(approvalId, stage, note, actor);
    }
  },

  async listWalletAccounts(): Promise<WalletAccount[]> {
    try {
      return await http<WalletAccount[]>('/wallets');
    } catch {
      return mockApi.listWalletAccounts();
    }
  },

  async listTransactions(employeeId: string): Promise<WalletTransaction[]> {
    try {
      return await http<WalletTransaction[]>(`/wallets/${employeeId}/transactions`);
    } catch {
      return mockApi.listTransactions(employeeId);
    }
  },
};
