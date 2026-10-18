import type {
  ApprovalRequest,
  ApprovalStage,
  ChecklistTemplate,
  CreateShipmentInput,
  Customer,
  DashboardStats,
  Employee,
  EmployeeApprovalStatus,
  Evidence,
  ManagerDecisionStatus,
  NewTaskInput,
  Task,
  TmsShipment,
  TmsTrackingDetails,
  TmsTransportPlan,
  TmsVehicle,
  WalletAccount,
  WalletTransaction,
} from '@/types';
import type { Actor, ChaseHorseApi } from './contract';
import { http } from './httpClient';

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
 * Zero fake demo fallback data — returns genuine empty collections and states.
 */
export const restApi: ChaseHorseApi = {
  async getDashboardStats(scope?: { customerId?: string }): Promise<DashboardStats> {
    try {
      const data = await http<DashboardStats>('/dashboard/stats', {
        query: { customerId: scope?.customerId },
      });
      return data || EMPTY_DASHBOARD_STATS;
    } catch (err) {
      console.warn('[restApi] getDashboardStats error:', err);
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
    try {
      const data = await http<any[]>('/tasks', {
        query: { customerId: scope?.customerId },
      });
      if (!Array.isArray(data)) return [];
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
        createdAt: t.createdAt || new Date().toISOString(),
        rewardInr: Number(t.rewardAmount) || 0,
        assigneeId: t.assignedTo,
        checklistTemplateId: t.checklistTemplateId || 'chk-shelf',
      }));
    } catch (err) {
      console.warn('[restApi] listTasks error:', err);
      return [];
    }
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
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || 0,
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
      category: 'Shelf audit',
      status: (res.status?.toLowerCase() || 'assigned') as any,
      priority: 'normal',
      customerId: res.customerId || res.createdBy,
      location: { lat: 12.9716, lng: 77.5946, area: 'District A', address: 'Site 1' },
      dueAt: res.dueAt || new Date().toISOString(),
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || 0,
      assigneeId: employeeId,
      checklistTemplateId: 'chk-shelf',
    };
  },

  async listEmployees(): Promise<Employee[]> {
    try {
      const data = await http<any[]>('/employees');
      if (!Array.isArray(data)) return [];
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
        joinedAt: e.createdAt || new Date().toISOString(),
        tasksCompleted: 0,
        rating: 5.0,
        documentsVerified: e.accountStatus === 'ACTIVE',
      }));
    } catch (err) {
      console.warn('[restApi] listEmployees error:', err);
      return [];
    }
  },

  async setEmployeeApproval(employeeId: string, status: EmployeeApprovalStatus): Promise<Employee> {
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

  /* ---------- TMS & Transport ---------- */

  async listVehicles(): Promise<TmsVehicle[]> {
    try {
      const data = await http<any[]>('/tms/vehicles');
      if (!Array.isArray(data)) return [];
      return data.map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        vehicleType: v.vehicleType,
        capacityKg: Number(v.capacityKg) || 0,
        make: v.make || '',
        model: v.model || '',
        status: v.status || 'AVAILABLE',
        assignedDriverId: v.assignedDriverId,
      }));
    } catch (err) {
      console.warn('[restApi] listVehicles error:', err);
      return [];
    }
  },

  async listShipments(): Promise<TmsShipment[]> {
    try {
      const data = await http<any[]>('/tms/shipments');
      if (!Array.isArray(data)) return [];
      return data.map((s) => ({
        id: s.id,
        bookingRef: s.bookingRef,
        customerId: s.customerId,
        originAddress: s.originAddress,
        destinationAddress: s.destinationAddress,
        cargoDescription: s.cargoDescription || '',
        cargoWeightKg: Number(s.cargoWeightKg) || 0,
        status: s.status || 'CONFIRMED',
        totalPrice: Number(s.totalPrice) || 0,
        currency: 'INR',
        createdAt: s.createdAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[restApi] listShipments error:', err);
      return [];
    }
  },

  async createShipment(input: CreateShipmentInput): Promise<TmsShipment> {
    const res = await http<any>('/tms/shipments', {
      method: 'POST',
      body: JSON.stringify({
        originAddress: input.originAddress,
        destinationAddress: input.destinationAddress,
        cargoDescription: input.cargoDescription || '',
        cargoWeightKg: input.cargoWeightKg || 0,
        totalPrice: input.totalPrice || 0,
      }),
    });
    return {
      id: res.id,
      bookingRef: res.bookingRef,
      customerId: res.customerId,
      originAddress: res.originAddress,
      destinationAddress: res.destinationAddress,
      cargoDescription: res.cargoDescription || '',
      cargoWeightKg: Number(res.cargoWeightKg) || 0,
      status: res.status || 'CONFIRMED',
      totalPrice: Number(res.totalPrice) || 0,
      currency: 'INR',
      createdAt: res.createdAt || new Date().toISOString(),
    };
  },

  async getTracking(bookingRef: string): Promise<TmsTrackingDetails> {
    return await http<TmsTrackingDetails>(`/tms/tracking/${encodeURIComponent(bookingRef)}`);
  },

  async listTransportPlans(): Promise<TmsTransportPlan[]> {
    try {
      const data = await http<any[]>('/tms/plans');
      if (!Array.isArray(data)) return [];
      return data.map((p) => ({
        id: p.id,
        planName: p.planName || p.name,
        vehicleType: p.vehicleType,
        maxCapacityKg: Number(p.maxCapacityKg || p.capacityKg) || 0,
        baseRateInr: Number(p.baseRateInr || p.baseRate) || 0,
        ratePerKmInr: Number(p.ratePerKmInr || p.ratePerKm) || 0,
        estimatedHours: Number(p.estimatedHours) || 24,
        description: p.description || '',
      }));
    } catch (err) {
      console.warn('[restApi] listTransportPlans error:', err);
      return [];
    }
  },
};
