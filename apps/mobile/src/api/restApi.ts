import { Platform } from 'react-native';
import type {
  Task,
  NewTaskInput,
  TruckPlan,
  ShipmentMilestone,
  WalletTransaction,
  UserProfile,
} from '../types';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1');

// In-memory / client-cached store for demo & offline continuity
let clientTasks: Task[] = [
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
      area: 'Tenali Main Market',
      address: 'Shop #14, Market Road, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    rewardInr: 350,
    checklistTemplateId: 'chk-shelf',
    distanceKm: 1.2,
    checklist: [
      { id: 'c1', label: 'Verify shelf placement & SKU facing count', done: true, requiresPhoto: true },
      { id: 'c2', label: 'Inspect promotional standee and discount signage', done: false, requiresPhoto: true },
      { id: 'c3', label: 'Record product expiry date on top rack', done: false, requiresPhoto: false },
    ],
  },
  {
    id: 'TSK-FLD-8822',
    title: 'Telecom Fiber DP Box & Pole Physical Tagging',
    description: 'Audit roadside distribution point box lock condition, barcode sticker legibility, and drop-cable dressing.',
    category: 'Equipment inspection',
    status: 'open',
    priority: 'normal',
    customerId: 'cust-telecom',
    location: {
      lat: 16.248,
      lng: 80.638,
      area: 'Auto Nagar Cluster',
      address: 'Near 33kV Substation, Auto Nagar, Tenali',
    },
    dueAt: new Date(Date.now() + 18 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    rewardInr: 450,
    checklistTemplateId: 'chk-telecom',
    distanceKm: 2.8,
    checklist: [
      { id: 'c4', label: 'Inspect DP box lock & hinge integrity', done: false, requiresPhoto: true },
      { id: 'c5', label: 'Scan barcode/QR code on pole asset tag', done: false, requiresPhoto: true },
      { id: 'c6', label: 'Confirm fiber drop-cable dressing & clearance', done: false, requiresPhoto: false },
    ],
  },
  {
    id: 'TSK-FLD-8823',
    title: 'Brand Out-of-Home Billboard Lighting Check',
    description: 'Evening photo proof verifying floodlight illumination, vinyl integrity, and absence of visual obstruction.',
    category: 'Signage check',
    status: 'open',
    priority: 'normal',
    customerId: 'cust-apex',
    location: {
      lat: 16.235,
      lng: 80.652,
      area: 'Tenali Bypass Junction',
      address: 'Guntur-Tenali Highway Flyover Pillar 24',
    },
    dueAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    rewardInr: 500,
    checklistTemplateId: 'chk-ooh',
    distanceKm: 4.5,
    checklist: [
      { id: 'c7', label: 'Inspect night-time floodlight illumination', done: false, requiresPhoto: true },
      { id: 'c8', label: 'Confirm vinyl integrity and zero obstruction', done: false, requiresPhoto: true },
    ],
  },
  {
    id: 'TSK-FLD-8824',
    title: 'Fintech Merchant QR Standee & Soundbox Verification',
    description: 'Check active merchant transaction QR code scan, verify speaker battery, and ensure no competitor sticker overlap.',
    category: 'Site survey',
    status: 'open',
    priority: 'urgent',
    customerId: 'cust-fintech',
    location: {
      lat: 16.2435,
      lng: 80.642,
      area: 'Railway Station Road',
      address: 'Station Road Commercial Complex, Tenali',
    },
    dueAt: new Date(Date.now() + 36 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    rewardInr: 300,
    checklistTemplateId: 'chk-fintech',
    distanceKm: 0.8,
    checklist: [
      { id: 'c9', label: 'Scan merchant QR to confirm active VPA', done: false, requiresPhoto: true },
      { id: 'c10', label: 'Verify soundbox power & battery level', done: false, requiresPhoto: false },
      { id: 'c11', label: 'Confirm zero competitor sticker overlap', done: false, requiresPhoto: true },
    ],
  },
];

let clientWallet: WalletTransaction[] = [
  {
    id: 'TXN-901',
    type: 'CREDIT',
    amount: 450,
    description: 'Task Reward: FMCG Retail Shelf Planogram Audit #8819',
    createdAt: '18 Oct 2026, 17:30',
    status: 'COMPLETED',
  },
  {
    id: 'TXN-902',
    type: 'CREDIT',
    amount: 500,
    description: 'Task Reward: Highway OOH Billboard Night Inspection #8815',
    createdAt: '17 Oct 2026, 21:15',
    status: 'COMPLETED',
  },
  {
    id: 'TXN-903',
    type: 'CREDIT',
    amount: 350,
    description: 'Task Reward: Retail Merchant Standee Verification #8802',
    createdAt: '16 Oct 2026, 14:40',
    status: 'COMPLETED',
  },
  {
    id: 'TXN-904',
    type: 'HOLD',
    amount: 350,
    description: 'Pending Approval: Retail Shelf Facing Audit #8821',
    createdAt: 'Today, 09:15',
    status: 'PENDING',
  },
];

const TRUCK_PLANS: TruckPlan[] = [
  {
    id: 'trk-1',
    name: 'Tata Ace / Bolero Maxi',
    capacity: '1.2 – 1.7 Tons',
    dimensions: '7.5ft x 4.8ft x 4.5ft',
    baseRateInr: 850,
    perKmRateInr: 28,
    recommendedFor: 'Intra-city retail distribution, cartons, FMCG store delivery',
    availableVehicles: 14,
  },
  {
    id: 'trk-2',
    name: '14ft Eicher Open / Container',
    capacity: '4.0 Tons',
    dimensions: '14ft x 6.5ft x 7ft',
    baseRateInr: 2200,
    perKmRateInr: 45,
    recommendedFor: 'Industrial hardware, electronics crates, regional hub transfer',
    availableVehicles: 8,
  },
  {
    id: 'trk-3',
    name: '20ft Heavy Commercial Container',
    capacity: '8.5 Tons',
    dimensions: '20ft x 7.5ft x 8ft',
    baseRateInr: 4500,
    perKmRateInr: 72,
    recommendedFor: 'Inter-district transport, factory pallets, bulk agricultural cargo',
    availableVehicles: 5,
  },
  {
    id: 'trk-4',
    name: '32ft Multi-Axle High Cube',
    capacity: '15.0 Tons',
    dimensions: '32ft x 8ft x 8.5ft',
    baseRateInr: 8900,
    perKmRateInr: 110,
    recommendedFor: 'Long-haul national highway logistics, full-truckload bulk freight',
    availableVehicles: 3,
  },
];

export const mobileApi = {
  async listTasks(scope?: { customerId?: string }): Promise<Task[]> {
    try {
      const res = await fetch(`${BASE_URL}/tasks${scope?.customerId ? `?customerId=${scope.customerId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Remote unavailable, return clientTasks
    }
    if (scope?.customerId) {
      return clientTasks.filter((t) => !t.customerId || t.customerId === scope.customerId || t.customerId === 'cust-apex');
    }
    return clientTasks;
  },

  async createTask(input: NewTaskInput): Promise<Task> {
    const id = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTask: Task = {
      id,
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
      checklistTemplateId: input.checklistTemplateId,
      checklist: (input.checklistItems && input.checklistItems.length > 0
        ? input.checklistItems
        : ['Verify storefront presence', 'Capture photo proof of asset', 'Record ambient observations']
      ).map((item, idx) => ({
        id: `ci-${idx}`,
        label: item,
        done: false,
        requiresPhoto: idx === 1,
      })),
      distanceKm: 1.5,
    };

    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        const data = await res.json();
        clientTasks.unshift(data);
        return data;
      }
    } catch {
      // Remote failed, use fallback
    }

    clientTasks.unshift(newTask);
    return newTask;
  },

  async acceptTask(taskId: string, employeeId?: string): Promise<Task> {
    try {
      const res = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      if (res.ok) {
        const data = await res.json();
        const idx = clientTasks.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          clientTasks[idx] = { ...clientTasks[idx], status: 'in_progress', assigneeId: employeeId };
        }
        return {
          id: data.id,
          title: data.title || 'Field Task',
          description: data.description || '',
          category: data.category || 'Shelf audit',
          status: 'in_progress',
          priority: data.priority?.toLowerCase() || 'normal',
          customerId: data.customerId || 'cust-retail',
          location: {
            lat: Number(data.locationLat) || 16.2418,
            lng: Number(data.locationLng) || 80.6448,
            area: data.locationArea || 'Operational Zone',
            address: data.locationAddress || 'Field Site',
          },
          dueAt: data.dueAt || new Date().toISOString(),
          createdAt: data.createdAt || new Date().toISOString(),
          rewardInr: Number(data.rewardAmount) || 350,
          checklistTemplateId: data.checklistTemplateId || 'chk-shelf',
          distanceKm: 1.2,
        };
      }
    } catch {
      // Remote unavailable, fall back to local client cache
    }

    const idx = clientTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      clientTasks[idx] = {
        ...clientTasks[idx],
        status: 'in_progress',
        assigneeId: employeeId,
      };
      return clientTasks[idx];
    }
    throw new Error('Task not found');
  },

  async submitEvidence(
    taskId: string,
    evidenceNotes: string,
    metadata?: {
      locationLat?: number;
      locationLng?: number;
      storagePath?: string;
    },
  ): Promise<{ success: boolean; status: string; notes?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          storagePath: metadata?.storagePath || `evidence/${taskId}/photo.jpg`,
          fileName: `evidence_${taskId}.jpg`,
          contentType: 'image/jpeg',
          caption: evidenceNotes,
          locationLat: metadata?.locationLat || 16.2418,
          locationLng: metadata?.locationLng || 80.6448,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const idx = clientTasks.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          clientTasks[idx].status = 'submitted';
        }
        return {
          success: true,
          status: data.verificationStatus || 'PENDING_REVIEW',
          notes: data.verificationNotes || 'Submitted to Operations Review queue',
        };
      }
    } catch {
      // Backend unavailable, use client cache
    }

    const idx = clientTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      clientTasks[idx] = {
        ...clientTasks[idx],
        status: 'submitted',
      };
    }
    return {
      success: true,
      status: 'PENDING_REVIEW',
      notes: 'Submitted for Operations Manager review and reward authorization.',
    };
  },

  async approveTask(taskId: string): Promise<void> {
    const idx = clientTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      clientTasks[idx].status = 'approved';
      clientWallet.unshift({
        id: `TXN-${Date.now()}`,
        type: 'CREDIT',
        amount: clientTasks[idx].rewardInr,
        description: `Approved Task Reward: ${clientTasks[idx].title}`,
        createdAt: 'Just now',
        status: 'COMPLETED',
      });
    }
  },

  async rejectTask(taskId: string): Promise<void> {
    try {
      await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
    } catch {
      // Remote unavailable
    }
    const idx = clientTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      clientTasks[idx].status = 'rejected';
    }
  },

  getTruckPlans(): TruckPlan[] {
    return TRUCK_PLANS;
  },

  async getWalletTransactions(employeeId?: string): Promise<WalletTransaction[]> {
    if (employeeId) {
      try {
        const res = await fetch(`${BASE_URL}/wallets/${employeeId}/transactions`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((t: any) => ({
              id: t.id || `TXN-${Math.random()}`,
              type: (t.type || 'CREDIT').toUpperCase() as any,
              amount: Number(t.amountInr || t.amount) || 0,
              description: t.reference || t.description || 'Task Reward Credit',
              createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'Recent',
              status: (t.status || 'COMPLETED').toUpperCase() as any,
            }));
          }
        }
      } catch {
        // Fall back to clientWallet
      }
    }
    return clientWallet;
  },

  getTrackingInfo(trackingId: string): {
    id: string;
    origin: string;
    destination: string;
    driverName: string;
    driverPhone: string;
    vehicleNo: string;
    eta: string;
    milestones: ShipmentMilestone[];
  } {
    return {
      id: trackingId || 'CH20240512001',
      origin: 'Vijayawada Central Logistics Hub',
      destination: 'Apex Retail Partner Store #12, Tenali',
      driverName: 'Koteswara Rao (Staff Driver #D-402)',
      driverPhone: '+91 98480 23456',
      vehicleNo: 'AP-16-TX-9988 (14ft Container)',
      eta: 'Today, 03:30 PM (On Schedule)',
      milestones: [
        { title: 'Consignment Manifested', location: 'Vijayawada Hub', time: '19 Oct 2026, 06:30 AM', completed: true },
        { title: 'Dispatched & In-Transit', location: 'NH-16 Corridor', time: '19 Oct 2026, 09:15 AM', completed: true },
        { title: 'Arrived at Local Cluster', location: 'Tenali Transit Center', time: '19 Oct 2026, 11:45 AM', completed: true },
        { title: 'Out for Field Handover', location: 'Station Road Route #4', time: '19 Oct 2026, 01:20 PM', completed: false, current: true },
        { title: 'Delivered & Evidence Tagged', location: 'Apex Storefront #12', time: 'Expected by 03:30 PM', completed: false },
      ],
    };
  },
};
