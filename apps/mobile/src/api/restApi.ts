import { Platform } from 'react-native';
import type {
  Task,
  NewTaskInput,
  TruckPlan,
  ShipmentMilestone,
  WalletTransaction,
  DashboardStats,
  ChecklistTemplate,
  EvidenceRecord,
  ApprovalRequestItem,
  EmployeeDirectoryItem,
  AppNotification,
  WalletAccount,
} from '../types';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1');

export const mobileApi = {
  async listTasks(scope?: { customerId?: string }, token?: string): Promise<Task[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/tasks${scope?.customerId ? `?customerId=${scope.customerId}` : ''}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            category: t.category || 'Shelf audit',
            status: (t.status?.toLowerCase() || 'open') as any,
            priority: (t.priority?.toLowerCase() || 'normal') as any,
            customerId: t.customerId || t.createdBy,
            location: {
              lat: Number(t.locationLat) || 0,
              lng: Number(t.locationLng) || 0,
              area: t.locationArea || 'Operational Area',
              address: t.locationAddress || 'Field Location',
            },
            dueAt: t.dueAt || new Date().toISOString(),
            createdAt: t.createdAt || new Date().toISOString(),
            rewardInr: Number(t.rewardAmount) || 0,
            checklistTemplateId: t.checklistTemplateId,
            assigneeId: t.assignedTo,
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  async createTask(input: NewTaskInput, token?: string): Promise<Task> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers,
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

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create task: HTTP ${res.status}`);
    }

    const t = await res.json();
    return {
      id: t.id,
      title: t.title,
      description: t.description || '',
      category: t.category || input.category,
      status: (t.status?.toLowerCase() || 'open') as any,
      priority: (t.priority?.toLowerCase() || input.priority) as any,
      customerId: t.customerId || input.customerId,
      location: {
        lat: Number(t.locationLat) || input.locationLat || 0,
        lng: Number(t.locationLng) || input.locationLng || 0,
        area: input.areaKey || 'Operational Area',
        address: input.address || 'Field Location',
      },
      dueAt: t.dueAt || input.dueAt,
      createdAt: t.createdAt || new Date().toISOString(),
      rewardInr: Number(t.rewardAmount) || input.rewardInr,
      checklistTemplateId: input.checklistTemplateId,
    };
  },

  async acceptTask(taskId: string, token?: string): Promise<Task> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/tasks/${taskId}/accept`, {
      method: 'POST',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to accept task: HTTP ${res.status}`);
    }

    const t = await res.json();
    return {
      id: t.id,
      title: t.title,
      description: t.description || '',
      category: t.category,
      status: (t.status?.toLowerCase() || 'assigned') as any,
      priority: t.priority,
      customerId: t.customerId,
      location: {
        lat: Number(t.locationLat) || 0,
        lng: Number(t.locationLng) || 0,
        area: t.locationArea || 'Operational Area',
        address: t.locationAddress || 'Field Location',
      },
      dueAt: t.dueAt,
      createdAt: t.createdAt,
      rewardInr: Number(t.rewardAmount) || 0,
      checklistTemplateId: t.checklistTemplateId || 'chk-shelf',
      assigneeId: t.assignedTo,
    };
  },

  async submitEvidence(
    taskId: string,
    evidence: { storagePath: string; fileName: string; caption?: string },
    token?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/evidence`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        taskId,
        storagePath: evidence.storagePath,
        fileName: evidence.fileName,
        caption: evidence.caption || '',
        contentType: 'image/jpeg',
        fileSizeBytes: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to submit evidence: HTTP ${res.status}`);
    }

    return { success: true };
  },

  async approveTask(taskId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to approve task: HTTP ${res.status}`);
    }
  },

  async rejectTask(taskId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'REJECTED' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to reject task: HTTP ${res.status}`);
    }
  },

  async updateTaskStatus(taskId: string, status: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: status.toUpperCase() }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update task status: HTTP ${res.status}`);
    }
  },

  async getWalletTransactions(employeeId: string, token?: string): Promise<WalletTransaction[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/wallets/${employeeId}/transactions`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((txn: any) => ({
            id: txn.id,
            type: (txn.type || 'CREDIT').toUpperCase() as any,
            amount: Number(txn.amountInr) || 0,
            description: txn.reference || 'Task Reward',
            createdAt: txn.createdAt || new Date().toISOString(),
            status: (txn.status || 'COMPLETED').toUpperCase() as any,
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  async getTrackingInfo(trackingId: string, token?: string): Promise<any | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${BASE_URL}/tms/tracking/${trackingId}`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  async getTruckPlans(token?: string): Promise<TruckPlan[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${BASE_URL}/tms/plans`, { headers });
      if (res.ok) {
        const plans = await res.json();
        if (Array.isArray(plans)) {
          return plans.map((p: any) => ({
            id: p.id,
            name: p.planName || p.name || 'Commercial Freight',
            capacity: `${p.maxCapacityKg || 1000} kg`,
            dimensions: 'Standard commercial bay',
            baseRateInr: Number(p.baseRateInr || p.basePrice) || 500,
            perKmRateInr: Number(p.ratePerKmInr || p.pricePerKm) || 25,
            availableVehicles: 1,
            recommendedFor: p.description || p.vehicleType || 'Commercial Freight',
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  async createShipment(
    data: {
      originAddress: string;
      destinationAddress: string;
      cargoDescription?: string;
      cargoWeightKg?: number;
      transportPlanId?: string;
    },
    token?: string
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/tms/shipments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create shipment: HTTP ${res.status}`);
    }

    return await res.json();
  },

  async getDashboardStats(
    scopeOrToken?: { customerId?: string; token?: string } | string,
    maybeToken?: string
  ): Promise<DashboardStats> {
    let customerId: string | undefined;
    let token: string | undefined;

    if (typeof scopeOrToken === 'object' && scopeOrToken !== null) {
      customerId = scopeOrToken.customerId;
      token = scopeOrToken.token;
    } else if (typeof scopeOrToken === 'string' && maybeToken !== undefined) {
      customerId = scopeOrToken;
      token = maybeToken;
    } else if (typeof scopeOrToken === 'string' && maybeToken === undefined) {
      if (scopeOrToken.startsWith('ey') || scopeOrToken.length > 50) {
        token = scopeOrToken;
      } else {
        customerId = scopeOrToken;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${BASE_URL}/dashboard/stats${customerId ? `?customerId=${customerId}` : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard stats: HTTP ${res.status}`);
    }
    return await res.json();
  },

  async getWalletAccount(employeeId: string, token?: string): Promise<WalletAccount | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/wallets/${employeeId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return {
          employeeId: data.employeeId,
          balanceInr: Number(data.balanceInr) || 0,
          pendingInr: Number(data.pendingInr) || 0,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async listChecklistTemplates(token?: string): Promise<ChecklistTemplate[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/checklist-templates`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  },

  async getChecklistTemplate(templateId: string, token?: string): Promise<ChecklistTemplate | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/checklist-templates/${templateId}`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  async listEvidence(taskId?: string, token?: string): Promise<EvidenceRecord[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${BASE_URL}/evidence${taskId ? `?taskId=${taskId}` : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  },

  async decideEvidence(
    evidenceId: string,
    status: 'VERIFIED' | 'FLAGGED' | 'REJECTED',
    note: string,
    token?: string
  ): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/evidence/${evidenceId}/manager-decision`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status, note }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Decision failed: HTTP ${res.status}`);
    }
    return true;
  },

  async listApprovals(token?: string): Promise<ApprovalRequestItem[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/approvals`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  },

  async decideApproval(
    approvalId: string,
    stage: 'APPROVED' | 'REJECTED' | 'REWORK',
    note: string,
    token?: string
  ): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/approvals/${approvalId}/decision`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ stage, note }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Approval decision failed: HTTP ${res.status}`);
    }
    return true;
  },

  async listEmployees(token?: string): Promise<EmployeeDirectoryItem[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/employees`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  },

  async setEmployeeApproval(
    employeeId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'PENDING',
    role?: string,
    token?: string
  ): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/employees/${employeeId}/approval`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, role }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update employee status: HTTP ${res.status}`);
    }
    return true;
  },

  async updateProfile(
    data: { displayName?: string; phone?: string; region?: string; avatarUrl?: string },
    token?: string
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/profiles/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update profile: HTTP ${res.status}`);
    }
    return await res.json();
  },

  async listNotifications(token?: string): Promise<AppNotification[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/notifications`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: string, token?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
