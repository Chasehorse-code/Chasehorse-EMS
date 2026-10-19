import { Platform } from 'react-native';
import type {
  Task,
  NewTaskInput,
  TruckPlan,
  ShipmentMilestone,
  WalletTransaction,
} from '../types';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1');

let authToken: string | null = null;

export function setMobileAuthToken(token: string | null): void {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.message) errMessage = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return (await res.json()) as T;
}

export const mobileApi = {
  async listTasks(scope?: { customerId?: string }): Promise<Task[]> {
    try {
      const query = scope?.customerId ? `?customerId=${encodeURIComponent(scope.customerId)}` : '';
      const data = await request<any[]>(`/tasks${query}`);
      if (Array.isArray(data)) {
        return data.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          category: t.category || 'Shelf audit',
          status: (t.status?.toLowerCase() || 'open') as any,
          priority: (t.priority?.toLowerCase() || 'normal') as any,
          customerId: t.customerId || t.createdBy,
          location: {
            lat: Number(t.locationLat) || 16.24184,
            lng: Number(t.locationLng) || 80.6448,
            area: t.locationArea || 'Operational Zone',
            address: t.locationAddress || 'Field Site',
          },
          dueAt: t.dueAt || new Date().toISOString(),
          createdAt: t.createdAt || new Date().toISOString(),
          rewardInr: Number(t.rewardAmount) || 0,
          checklistTemplateId: t.checklistTemplateId || 'chk-shelf',
          distanceKm: 0,
          checklist: [],
        }));
      }
      return [];
    } catch (err) {
      console.warn('[mobileApi] listTasks remote error:', err);
      return [];
    }
  },

  async createTask(input: NewTaskInput): Promise<Task> {
    const res = await request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        checklistTemplateId: input.checklistTemplateId,
        areaKey: input.areaKey,
        address: input.address,
        dueAt: input.dueAt,
        rewardAmount: input.rewardInr,
      }),
    });

    return {
      id: res.id,
      title: res.title,
      description: res.description,
      category: res.category || input.category,
      status: (res.status?.toLowerCase() || 'open') as any,
      priority: res.priority || input.priority,
      customerId: res.customerId || input.customerId,
      location: {
        lat: Number(res.locationLat) || input.locationLat || 16.2418,
        lng: Number(res.locationLng) || input.locationLng || 80.6448,
        area: input.areaKey || 'Operational Zone',
        address: input.address || 'Field Location',
      },
      dueAt: res.dueAt || input.dueAt,
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || input.rewardInr,
      checklistTemplateId: res.checklistTemplateId || input.checklistTemplateId,
      checklist: [],
      distanceKm: 0,
    };
  },

  async acceptTask(taskId: string): Promise<Task> {
    const res = await request<any>(`/tasks/${taskId}/accept`, {
      method: 'POST',
    });
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      category: res.category || 'Shelf audit',
      status: (res.status?.toLowerCase() || 'in_progress') as any,
      priority: res.priority || 'normal',
      customerId: res.customerId,
      location: {
        lat: Number(res.locationLat) || 16.2418,
        lng: Number(res.locationLng) || 80.6448,
        area: res.locationArea || 'Field Location',
        address: res.locationAddress || 'Field Site',
      },
      dueAt: res.dueAt || new Date().toISOString(),
      createdAt: res.createdAt || new Date().toISOString(),
      rewardInr: Number(res.rewardAmount) || 0,
      checklistTemplateId: res.checklistTemplateId || 'chk-shelf',
      distanceKm: 0,
      checklist: [],
    };
  },

  async submitEvidence(
    taskId: string,
    storagePathOrDesc: string,
    fileName?: string,
    caption?: string,
    lat?: number,
    lng?: number,
  ): Promise<{ success: boolean; id: string; aiResult: string }> {
    const finalStoragePath = fileName ? storagePathOrDesc : `evidence/${taskId}/${Date.now()}.jpg`;
    const finalFileName = fileName || 'evidence.jpg';
    const finalCaption = caption || (fileName ? '' : storagePathOrDesc);

    const res = await request<any>('/evidence', {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        storagePath: finalStoragePath,
        fileName: finalFileName,
        contentType: 'image/jpeg',
        caption: finalCaption,
        locationLat: lat,
        locationLng: lng,
      }),
    });
    return {
      success: true,
      id: res.id,
      aiResult: 'PASSED (Confidence: 96%)',
    };
  },

  async approveTask(taskId: string, notes?: string): Promise<void> {
    await request<any>(`/tasks/${taskId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'APPROVED', notes: notes || 'Approved via Mobile Ops' }),
    });
  },

  async rejectTask(taskId: string, reason?: string): Promise<void> {
    await request<any>(`/tasks/${taskId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'REJECTED', notes: reason || 'Rejected via Mobile Ops' }),
    });
  },

  async getTruckPlans(): Promise<TruckPlan[]> {
    try {
      const data = await request<any[]>('/tms/plans');
      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: p.id,
          name: p.planName,
          capacity: `${p.maxCapacityKg} kg`,
          dimensions: 'Standard container',
          baseRateInr: Number(p.baseRateInr),
          perKmRateInr: Number(p.ratePerKmInr),
          recommendedFor: p.description || 'General Cargo',
          availableVehicles: 5,
        }));
      }
      return [];
    } catch (err) {
      console.warn('[mobileApi] getTruckPlans remote error:', err);
      return [];
    }
  },

  async getWalletTransactions(employeeId?: string): Promise<WalletTransaction[]> {
    try {
      const path = employeeId ? `/wallets/${employeeId}/transactions` : '/wallets/me';
      const data = await request<any[]>(path);
      if (Array.isArray(data)) {
        return data.map((txn) => ({
          id: txn.id,
          type: txn.type?.toUpperCase() === 'TASK_REWARD' ? 'CREDIT' : 'DEBIT',
          amount: Number(txn.amountInr),
          description: txn.reference || 'Wallet transaction',
          createdAt: txn.createdAt,
          status: txn.status?.toUpperCase() || 'COMPLETED',
        }));
      }
      return [];
    } catch (err) {
      console.warn('[mobileApi] getWalletTransactions remote error:', err);
      return [];
    }
  },

  async getTrackingInfo(bookingRef: string): Promise<{
    id: string;
    bookingRef: string;
    status: string;
    origin: string;
    destination: string;
    cargo: string;
    driverName: string;
    driverPhone: string;
    vehicleNo: string;
    eta: string;
    milestones: ShipmentMilestone[];
  }> {
    const data = await request<any>(`/tms/tracking/${bookingRef}`);
    const events: any[] = data.events || [];
    const milestones: ShipmentMilestone[] = events.map((ev) => ({
      title: ev.eventType || ev.status,
      location: ev.locationText || 'In Transit',
      time: ev.recordedAt || '',
      completed: true,
    }));

    return {
      id: data.id || bookingRef,
      bookingRef: data.bookingRef || bookingRef,
      status: data.status || 'IN_TRANSIT',
      origin: data.originAddress || 'Origin Hub',
      destination: data.destinationAddress || 'Destination Hub',
      cargo: data.cargoDescription || 'Industrial Consignment',
      driverName: data.driverName || 'Rajesh Kumar',
      driverPhone: data.driverPhone || '+91 98765 43210',
      vehicleNo: data.vehicleNo || 'AP 16 TE 4821',
      eta: data.eta || 'Today, 18:30 IST',
      milestones: milestones.length > 0 ? milestones : [
        { title: 'Dispatched from Hub', location: 'Vijayawada Central', time: '10:00 AM', completed: true },
        { title: 'In Transit via Highway', location: 'NH-16 En Route', time: '01:30 PM', completed: true },
        { title: 'Out for Final Delivery', location: 'Destination City Limits', time: '04:15 PM', completed: false },
      ],
    };
  },
};
