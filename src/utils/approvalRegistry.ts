import type { ApprovalAuditEntry, ApprovalRequest, ApprovalStage } from '@/types';

const APPROVALS_STORAGE_KEY = 'chasehorse_approvals_registry';

export const DEFAULT_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APP-8821',
    taskId: 'TSK-FLD-8821',
    evidenceId: 'ev-shelf-01',
    employeeId: 'emp-101',
    rewardInr: 450,
    stage: 'awaiting_ops',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    history: [
      {
        stage: 'awaiting_ops',
        decidedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        decidedBy: 'System AI Engine',
        note: 'AI passed location and clarity checks with 94% confidence. Awaiting Operations sign-off.',
      },
    ],
  },
  {
    id: 'APP-8822',
    taskId: 'TSK-FLD-8822',
    evidenceId: 'ev-qr-02',
    employeeId: 'emp-102',
    rewardInr: 350,
    stage: 'escalated',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    note: 'Merchant QR standee photo was taken 120m outside geofence boundary.',
    history: [
      {
        stage: 'awaiting_ops',
        decidedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        decidedBy: 'System AI Engine',
        note: 'Submitted by field operator.',
      },
      {
        stage: 'escalated',
        decidedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        decidedBy: 'Operations Lead',
        note: 'Flagged for GPS discrepancy. Escalated for Senior Manager confirmation.',
      },
    ],
  },
  {
    id: 'APP-8823',
    taskId: 'TSK-FLD-8823',
    evidenceId: 'ev-telecom-03',
    employeeId: 'emp-103',
    rewardInr: 600,
    stage: 'rework',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    decidedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    decidedBy: 'Operations Manager',
    note: 'DP Box latch seal not visible in photo. Please capture a close-up of the serial tag.',
    reworkInstructions: 'Re-inspect pole latch #4B and take high-resolution photo showing tamper seal intact.',
    history: [
      {
        stage: 'awaiting_ops',
        decidedAt: new Date(Date.now() - 86400000).toISOString(),
        decidedBy: 'System',
        note: 'Submitted by operator.',
      },
      {
        stage: 'rework',
        decidedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        decidedBy: 'Operations Manager',
        note: 'Rework requested: DP Box latch seal not visible in photo.',
      },
    ],
  },
  {
    id: 'APP-8820',
    taskId: 'TSK-FLD-8824',
    evidenceId: 'ev-billboard-04',
    employeeId: 'emp-104',
    rewardInr: 500,
    stage: 'approved',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    decidedAt: new Date(Date.now() - 86400000).toISOString(),
    decidedBy: 'Operations Manager',
    note: 'Lighting and banner compliance fully verified. Payout credited.',
    history: [
      {
        stage: 'awaiting_ops',
        decidedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        decidedBy: 'System',
        note: 'Evidence uploaded.',
      },
      {
        stage: 'approved',
        decidedAt: new Date(Date.now() - 86400000).toISOString(),
        decidedBy: 'Operations Manager',
        note: 'Verified and approved for disbursement.',
      },
    ],
  },
];

export function getStoredApprovals(): ApprovalRequest[] {
  try {
    const raw = localStorage.getItem(APPROVALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(DEFAULT_APPROVALS));
      return DEFAULT_APPROVALS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_APPROVALS;
  }
}

export function saveStoredApproval(item: ApprovalRequest): void {
  try {
    const list = getStoredApprovals().filter((a) => a.id !== item.id);
    list.unshift(item);
    localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[ApprovalRegistry] Save error:', err);
  }
}

export function updateStoredApprovalDecision(
  id: string,
  stage: ApprovalStage,
  note: string,
  decidedBy: string,
  reworkInstructions?: string,
): ApprovalRequest | null {
  try {
    const list = getStoredApprovals();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = list[idx];
    const now = new Date().toISOString();
    const newHistory: ApprovalAuditEntry[] = [
      ...(current.history || []),
      {
        stage,
        decidedAt: now,
        decidedBy,
        note,
      },
    ];

    const updated: ApprovalRequest = {
      ...current,
      stage,
      decidedAt: now,
      decidedBy,
      note,
      reworkInstructions: reworkInstructions || current.reworkInstructions,
      history: newHistory,
    };

    list[idx] = updated;
    localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(list));
    return updated;
  } catch (err) {
    console.warn('[ApprovalRegistry] Update error:', err);
    return null;
  }
}
