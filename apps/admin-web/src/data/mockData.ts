/**
 * ============================================================================
 *  DEMO DATA — FICTIONAL. NOT REAL PEOPLE, CUSTOMERS, TASKS OR MONEY.
 * ============================================================================
 * Everything here is generated for the prototype. Names, e-mails (".test"
 * domain), phone numbers, amounts and AI outputs are invented. Nothing is
 * read from or written to a backend. Replace `src/api/mockApi.ts` with a real
 * REST client when the Spring Boot service is available.
 */
import type {
  ApprovalRequest,
  ChecklistItem,
  ChecklistResult,
  ChecklistTemplate,
  Customer,
  Employee,
  Evidence,
  GeoPoint,
  AiVerification,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  WalletAccount,
  WalletTransaction,
} from '@/types';

/** Fixed "now" so the demo looks identical on every load. */
export const DEMO_NOW = Date.UTC(2026, 9, 15, 4, 30, 0); // 15 Oct 2026, 10:00 IST

const DAY = 86_400_000;
export const isoOffset = (days: number, hour = 0): string =>
  new Date(DEMO_NOW + days * DAY + hour * 3_600_000).toISOString();

/** Small deterministic PRNG so demo numbers are stable. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ areas */

export const AREAS: Record<string, GeoPoint> = {
  benz: { area: 'Benz Circle', lat: 16.4985, lng: 80.6563 },
  labbipet: { area: 'Labbipet', lat: 16.5045, lng: 80.642 },
  patamata: { area: 'Patamata', lat: 16.493, lng: 80.673 },
  gunadala: { area: 'Gunadala', lat: 16.529, lng: 80.664 },
  mangalagiri: { area: 'Mangalagiri', lat: 16.43, lng: 80.568 },
  tadepalli: { area: 'Tadepalli', lat: 16.475, lng: 80.6 },
  kanuru: { area: 'Kanuru', lat: 16.487, lng: 80.7 },
  gannavaram: { area: 'Gannavaram', lat: 16.538, lng: 80.803 },
  guntur: { area: 'Guntur (Brodipet)', lat: 16.303, lng: 80.443 },
};

/* -------------------------------------------------------------- customers */

export const DEMO_CUSTOMER_ID = 'c1';

export const customers: Customer[] = [
  { id: 'c1', name: 'Sample Mart Retail (demo)', contact: 'ops@samplemart.test' },
  { id: 'c2', name: 'Demo Telecom Towers (demo)', contact: 'sites@demotelecom.test' },
  { id: 'c3', name: 'Example Foods Distribution (demo)', contact: 'logistics@examplefoods.test' },
  { id: 'c4', name: 'Test Pharma Stores (demo)', contact: 'audit@testpharma.test' },
];

/* -------------------------------------------------------------- employees */

type EmpSeed = [
  id: string,
  name: string,
  status: Employee['approvalStatus'],
  availability: Employee['availability'],
  areaKey: string,
  skills: string[],
  completed: number,
  rating: number,
  joinedDaysAgo: number,
  docs: boolean,
];

const empSeeds: EmpSeed[] = [
  ['e1', 'Ravi Teja Kumar', 'approved', 'available', 'benz', ['Shelf audit', 'Signage check'], 128, 4.8, 410, true],
  ['e2', 'Lakshmi Prasanna', 'approved', 'on_task', 'labbipet', ['Signage check', 'Delivery proof'], 96, 4.6, 380, true],
  ['e3', 'Suresh Babu', 'approved', 'available', 'mangalagiri', ['Site survey', 'Equipment inspection'], 74, 4.7, 300, true],
  ['e4', 'Anitha Reddy', 'approved', 'on_task', 'patamata', ['Equipment inspection'], 61, 4.4, 250, true],
  ['e5', 'Venkata Rao', 'approved', 'available', 'kanuru', ['Delivery proof', 'Shelf audit'], 88, 4.5, 330, true],
  ['e6', 'Priya Sharma', 'approved', 'on_task', 'gunadala', ['Shelf audit', 'Signage check'], 52, 4.9, 190, true],
  ['e7', 'Mohammed Imran', 'approved', 'offline', 'tadepalli', ['Shelf audit'], 39, 4.2, 150, true],
  ['e8', 'Sravani Devi', 'approved', 'available', 'tadepalli', ['Site survey', 'Delivery proof'], 27, 4.3, 90, true],
  ['e9', 'Kiran Kumar', 'pending', 'offline', 'guntur', ['Shelf audit'], 0, 0, 6, false],
  ['e10', 'Harika Chowdary', 'pending', 'offline', 'benz', ['Signage check', 'Site survey'], 0, 0, 3, true],
  ['e11', 'Naveen Varma', 'rejected', 'offline', 'gannavaram', ['Delivery proof'], 0, 0, 40, false],
  ['e12', 'Deepika Nair', 'suspended', 'offline', 'labbipet', ['Equipment inspection'], 33, 3.1, 220, true],
];

export const employees: Employee[] = empSeeds.map(
  ([id, name, approvalStatus, availability, areaKey, skills, tasksCompleted, rating, joinedAgo, documentsVerified], i) => {
    const base = AREAS[areaKey];
    const r = mulberry32(i + 11);
    return {
      id,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@demo.chasehorse.test`,
      phone: `+91 90000 ${String(10000 + i * 137).slice(-5)}`,
      region: base.area,
      skills,
      approvalStatus,
      availability,
      location: {
        area: base.area,
        lat: +(base.lat + (r() - 0.5) * 0.012).toFixed(5),
        lng: +(base.lng + (r() - 0.5) * 0.012).toFixed(5),
      },
      joinedAt: isoOffset(-joinedAgo, 5),
      tasksCompleted,
      rating,
      documentsVerified,
    };
  },
);

/* -------------------------------------------------------------- checklists */

const item = (id: string, label: string, required = true, requiresPhoto = false): ChecklistItem => ({
  id,
  label,
  required,
  requiresPhoto,
});

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'cl-shelf',
    name: 'Standard shelf audit',
    category: 'Shelf audit',
    updatedAt: isoOffset(-12, 6),
    items: [
      item('i1', 'Photograph full shelf (wide shot)', true, true),
      item('i2', 'Confirm planogram is followed', true, false),
      item('i3', 'Photograph any out-of-stock facings', true, true),
      item('i4', 'Check price tags are visible', true, false),
      item('i5', 'Note competitor displays nearby', false, false),
    ],
  },
  {
    id: 'cl-site',
    name: 'Tower site survey',
    category: 'Site survey',
    updatedAt: isoOffset(-30, 6),
    items: [
      item('i1', 'Photograph site entrance', true, true),
      item('i2', 'Photograph tower base and fencing', true, true),
      item('i3', 'Record access road condition', true, false),
      item('i4', 'Photograph power meter', true, true),
      item('i5', 'Note any visible damage', false, true),
    ],
  },
  {
    id: 'cl-signage',
    name: 'Signage condition check',
    category: 'Signage check',
    updatedAt: isoOffset(-5, 6),
    items: [
      item('i1', 'Photograph signage from the street', true, true),
      item('i2', 'Confirm lighting works', true, false),
      item('i3', 'Check for fading or damage', true, true),
    ],
  },
  {
    id: 'cl-equip',
    name: 'Equipment inspection',
    category: 'Equipment inspection',
    updatedAt: isoOffset(-21, 6),
    items: [
      item('i1', 'Photograph equipment tag / serial', true, true),
      item('i2', 'Confirm unit powers on', true, false),
      item('i3', 'Photograph temperature display', true, true),
      item('i4', 'Check seals and door gaskets', true, false),
      item('i5', 'Record any unusual noise', false, false),
    ],
  },
  {
    id: 'cl-delivery',
    name: 'Delivery proof',
    category: 'Delivery proof',
    updatedAt: isoOffset(-9, 6),
    items: [
      item('i1', 'Photograph delivered pallet with label', true, true),
      item('i2', 'Photograph receiver signature sheet', true, true),
      item('i3', 'Confirm quantity matches invoice', true, false),
    ],
  },
];

const templateFor = (category: TaskCategory): ChecklistTemplate =>
  checklistTemplates.find((t) => t.category === category)!;

/* -------------------------------------------------------------------- tasks */

type TaskSeed = [
  id: string,
  title: string,
  category: TaskCategory,
  status: TaskStatus,
  priority: TaskPriority,
  customerId: string,
  areaKey: string,
  address: string,
  dueOffsetDays: number,
  reward: number,
  assigneeId?: string,
];

const taskSeeds: TaskSeed[] = [
  ['T-1001', 'Cold-drink shelf audit — Store 14', 'Shelf audit', 'approved', 'normal', 'c1', 'benz', 'MG Road, near Benz Circle', -3, 450, 'e1'],
  ['T-1002', 'Tower site survey — Sector B', 'Site survey', 'approved', 'high', 'c2', 'mangalagiri', 'NH-16 service road', -2, 1200, 'e3'],
  ['T-1003', 'Storefront signage check', 'Signage check', 'in_review', 'normal', 'c1', 'labbipet', 'Eluru Road, Labbipet', 0, 380, 'e2'],
  ['T-1004', 'Cooler inspection — Depot 2', 'Equipment inspection', 'submitted', 'high', 'c3', 'patamata', 'Industrial lane 4, Patamata', 1, 700, 'e4'],
  ['T-1005', 'Delivery proof — pallet 88', 'Delivery proof', 'submitted', 'normal', 'c3', 'kanuru', 'Kanuru main road', 1, 320, 'e5'],
  ['T-1006', 'Shelf audit — Store 22', 'Shelf audit', 'in_progress', 'normal', 'c1', 'gunadala', 'Gunadala junction', 2, 450, 'e6'],
  ['T-1007', 'Pharmacy planogram audit', 'Shelf audit', 'assigned', 'high', 'c4', 'tadepalli', 'Tadepalli bus stand road', 3, 520, 'e7'],
  ['T-1008', 'Rooftop tower site survey', 'Site survey', 'open', 'urgent', 'c2', 'gannavaram', 'Airport road, Gannavaram', 2, 1500],
  ['T-1009', 'Signage check — 5 outlets', 'Signage check', 'open', 'normal', 'c1', 'guntur', 'Brodipet 4/5', 4, 900],
  ['T-1010', 'Fridge inspection — Depot 3', 'Equipment inspection', 'open', 'high', 'c3', 'benz', 'Service road, Benz Circle', 3, 650],
  ['T-1011', 'Delivery proof — pallet 91', 'Delivery proof', 'rejected', 'normal', 'c3', 'kanuru', 'Kanuru market yard', -1, 320, 'e8'],
  ['T-1012', 'Shelf audit — Store 31', 'Shelf audit', 'approved', 'normal', 'c1', 'labbipet', 'Bandar Road, Labbipet', -4, 450, 'e1'],
  ['T-1013', 'Generator inspection', 'Equipment inspection', 'approved', 'high', 'c2', 'mangalagiri', 'Mangalagiri industrial area', -5, 800, 'e3'],
  ['T-1014', 'Signage replacement check', 'Signage check', 'approved', 'low', 'c4', 'patamata', 'Patamata main road', -6, 380, 'e2'],
  ['T-1015', 'Delivery proof — pallet 95', 'Delivery proof', 'approved', 'normal', 'c3', 'gunadala', 'Gunadala warehouse row', -3, 320, 'e5'],
  ['T-1016', 'Site survey — new tower plot', 'Site survey', 'in_progress', 'high', 'c2', 'tadepalli', 'Tadepalli outskirts', 2, 1100, 'e8'],
  ['T-1017', 'Shelf audit — Store 40', 'Shelf audit', 'open', 'low', 'c1', 'benz', 'Ring Road, Benz Circle', 5, 450],
  ['T-1018', 'Cooler inspection — Depot 1', 'Equipment inspection', 'assigned', 'normal', 'c3', 'labbipet', 'Labbipet cold store', 2, 650, 'e4'],
  ['T-1019', 'Pharmacy signage check', 'Signage check', 'submitted', 'normal', 'c4', 'gunadala', 'Gunadala market', 1, 380, 'e6'],
  ['T-1020', 'Delivery proof — pallet 99', 'Delivery proof', 'open', 'urgent', 'c3', 'kanuru', 'Kanuru dispatch yard', 1, 360],
  ['T-1021', 'Shelf audit — Store 52', 'Shelf audit', 'cancelled', 'low', 'c1', 'guntur', 'Arundelpet, Guntur', -2, 450],
  ['T-1022', 'Site survey — boundary check', 'Site survey', 'open', 'normal', 'c2', 'gannavaram', 'Gannavaram bypass', 6, 950],
  ['T-1023', 'Shelf audit — Store 61', 'Shelf audit', 'approved', 'normal', 'c1', 'benz', 'Benz Circle flyover side', -7, 450, 'e7'],
  ['T-1024', 'Equipment inspection — Rack 9', 'Equipment inspection', 'in_review', 'high', 'c3', 'patamata', 'Patamata cold chain hub', 0, 700, 'e4'],
];

export const tasks: Task[] = taskSeeds.map(
  ([id, title, category, status, priority, customerId, areaKey, address, due, rewardInr, assigneeId], i) => {
    const area = AREAS[areaKey];
    const r = mulberry32(i + 101);
    return {
      id,
      title,
      description: `${category} for ${customers.find((c) => c.id === customerId)!.name}. Follow the checklist and capture clear, well-lit photos. (Demo task)`,
      category,
      status,
      priority,
      customerId,
      location: {
        ...area,
        lat: +(area.lat + (r() - 0.5) * 0.01).toFixed(5),
        lng: +(area.lng + (r() - 0.5) * 0.01).toFixed(5),
        address,
      },
      dueAt: isoOffset(due, 12),
      createdAt: isoOffset(-8 - (i % 6), 6),
      rewardInr,
      assigneeId,
      checklistTemplateId: templateFor(category).id,
    };
  },
);

/* ----------------------------------------------------------------- evidence */

type AiVariant = 'passed_high' | 'passed' | 'flagged' | 'failed' | 'not_run';

const aiPlans: Record<string, AiVariant> = {
  'T-1001': 'passed_high',
  'T-1002': 'passed',
  'T-1003': 'flagged',
  'T-1004': 'passed',
  'T-1005': 'not_run',
  'T-1011': 'failed',
  'T-1012': 'passed_high',
  'T-1013': 'passed',
  'T-1014': 'passed_high',
  'T-1015': 'flagged',
  'T-1019': 'passed',
  'T-1023': 'passed_high',
  'T-1024': 'flagged',
};

function buildAi(variant: AiVariant, submittedAt: string): AiVerification {
  const runAt = new Date(new Date(submittedAt).getTime() + 4 * 60_000).toISOString();
  const mk = (
    id: string,
    label: string,
    outcome: 'pass' | 'warn' | 'fail',
    detail: string,
  ) => ({ id, label, outcome, detail });

  switch (variant) {
    case 'passed_high':
      return {
        status: 'passed',
        confidence: 0.94,
        runAt,
        summary: 'Sample output: all required photos present and consistent with the task site.',
        checks: [
          mk('a1', 'Required photos present', 'pass', 'All photo-required steps have an attached image.'),
          mk('a2', 'Image clarity', 'pass', 'No blur or low-light issues detected.'),
          mk('a3', 'Location match', 'pass', 'Capture location is within 60 m of the task site.'),
          mk('a4', 'Duplicate image check', 'pass', 'No reused images found.'),
        ],
      };
    case 'passed':
      return {
        status: 'passed',
        confidence: 0.86,
        runAt,
        summary: 'Sample output: evidence looks consistent. One minor note.',
        checks: [
          mk('a1', 'Required photos present', 'pass', 'All photo-required steps have an attached image.'),
          mk('a2', 'Image clarity', 'warn', 'One image is slightly dark but readable.'),
          mk('a3', 'Location match', 'pass', 'Capture location is within 120 m of the task site.'),
          mk('a4', 'Duplicate image check', 'pass', 'No reused images found.'),
        ],
      };
    case 'flagged':
      return {
        status: 'flagged',
        confidence: 0.61,
        runAt,
        summary: 'Sample output: needs a human look — capture location is further than expected.',
        checks: [
          mk('a1', 'Required photos present', 'pass', 'All photo-required steps have an attached image.'),
          mk('a2', 'Image clarity', 'warn', 'Two images are out of focus.'),
          mk('a3', 'Location match', 'warn', 'Capture location is ~480 m from the task site.'),
          mk('a4', 'Duplicate image check', 'pass', 'No reused images found.'),
        ],
      };
    case 'failed':
      return {
        status: 'failed',
        confidence: 0.32,
        runAt,
        summary: 'Sample output: key evidence missing or unreadable.',
        checks: [
          mk('a1', 'Required photos present', 'fail', 'Pallet label photo is missing.'),
          mk('a2', 'Image clarity', 'fail', 'Remaining images are too blurry to read.'),
          mk('a3', 'Location match', 'warn', 'Capture location is ~300 m from the task site.'),
          mk('a4', 'Duplicate image check', 'pass', 'No reused images found.'),
        ],
      };
    default:
      return {
        status: 'not_run',
        confidence: null,
        runAt: null,
        summary: 'No AI output exists for this submission (demo: not run).',
        checks: [],
      };
  }
}

export const MANAGER_NAME = 'Meera Joshi (demo manager)';

function buildEvidence(task: Task, index: number): Evidence {
  const tpl = checklistTemplates.find((t) => t.id === task.checklistTemplateId)!;
  const submittedAt = isoOffset(
    task.status === 'approved' ? -1 - (index % 5) : task.status === 'rejected' ? -1 : 0,
    3 + (index % 5),
  );
  const variant = aiPlans[task.id] ?? 'not_run';
  const rejected = task.status === 'rejected';
  const flaggedMissing = variant === 'flagged' && index % 2 === 0;

  const photos: Evidence['photos'] = [];
  const checklist: ChecklistResult[] = tpl.items.map((it, idx) => {
    const skipPhoto = rejected && it.requiresPhoto && idx === 0;
    const missingPhoto = skipPhoto || (flaggedMissing && it.requiresPhoto && idx === tpl.items.length - 1);
    const photoAttached = it.requiresPhoto && !missingPhoto;
    if (photoAttached) {
      photos.push({
        id: `${task.id}-p${photos.length + 1}`,
        caption: it.label,
        capturedAt: isoOffset(task.status === 'approved' ? -1 - (index % 5) : 0, 2 + (index % 5)),
        hue: (index * 47 + idx * 31) % 360,
        checklistItemId: it.id,
      });
    }
    return {
      itemId: it.id,
      label: it.label,
      required: it.required,
      requiresPhoto: it.requiresPhoto,
      done: rejected ? idx > 0 : true,
      photoAttached,
    };
  });

  let managerDecision: Evidence['managerDecision'] = { status: 'pending' };
  if (task.status === 'approved') {
    managerDecision = {
      status: 'approved',
      decidedBy: MANAGER_NAME,
      decidedAt: isoOffset(-(index % 4), 7),
      note: 'Evidence is clear and complete.',
    };
  } else if (rejected) {
    managerDecision = {
      status: 'rejected',
      decidedBy: MANAGER_NAME,
      decidedAt: isoOffset(-1, 8),
      note: 'Pallet label is not visible in any photo.',
    };
  } else if (task.id === 'T-1024') {
    managerDecision = {
      status: 'rework',
      decidedBy: MANAGER_NAME,
      decidedAt: isoOffset(0, 5),
      note: 'Please retake the temperature display photo.',
    };
  }

  return {
    id: `EV-${task.id.slice(2)}`,
    taskId: task.id,
    employeeId: task.assigneeId!,
    submittedAt,
    photos,
    checklist,
    ai: buildAi(variant, submittedAt),
    managerDecision,
  };
}

const evidenceStatuses: TaskStatus[] = ['submitted', 'in_review', 'approved', 'rejected'];

export const evidence: Evidence[] = tasks
  .filter((t) => evidenceStatuses.includes(t.status))
  .map((t, i) => buildEvidence(t, i));

/* ----------------------------------------------------------- approval queue */

const approvalPlan: Record<string, ApprovalRequest['stage']> = {
  'T-1001': 'approved',
  'T-1002': 'awaiting_ops',
  'T-1012': 'awaiting_ops',
  'T-1013': 'awaiting_ops',
  'T-1014': 'approved',
  'T-1015': 'escalated',
  'T-1023': 'awaiting_ops',
};

export const OPS_NAME = 'Arjun Patel (demo operations)';

export const approvals: ApprovalRequest[] = tasks
  .filter((t) => approvalPlan[t.id])
  .map((t) => {
    const ev = evidence.find((e) => e.taskId === t.id)!;
    const stage = approvalPlan[t.id];
    return {
      id: `AP-${t.id.slice(2)}`,
      taskId: t.id,
      evidenceId: ev.id,
      employeeId: t.assigneeId!,
      rewardInr: t.rewardInr,
      stage,
      submittedAt: ev.managerDecision.decidedAt ?? ev.submittedAt,
      ...(stage === 'approved'
        ? { decidedAt: isoOffset(-1, 9), decidedBy: OPS_NAME, note: 'Reward release approved.' }
        : {}),
      ...(stage === 'escalated'
        ? { note: 'AI flagged location mismatch — escalated for a second look.' }
        : {}),
    };
  });

/* ------------------------------------------------------------------- wallet */

export const walletAccounts: WalletAccount[] = [];
export const walletTransactions: WalletTransaction[] = [];

(function seedWallet() {
  const approvedEmployees = employees.filter((e) => e.approvalStatus === 'approved' || e.approvalStatus === 'suspended');
  let txCounter = 5000;

  approvedEmployees.forEach((emp, idx) => {
    const r = mulberry32(idx + 701);
    const txs: WalletTransaction[] = [];

    // Historical completed rewards
    const history = 3 + Math.floor(r() * 4);
    for (let k = 0; k < history; k++) {
      const amount = [320, 380, 450, 520, 650, 800][Math.floor(r() * 6)];
      txs.push({
        id: `TX-${++txCounter}`,
        employeeId: emp.id,
        type: 'task_reward',
        amountInr: amount,
        status: 'completed',
        createdAt: isoOffset(-(10 + k * 6 + Math.floor(r() * 4)), 9),
        reference: `DEMO-REWARD-${txCounter}`,
        taskId: `T-0${900 + Math.floor(r() * 90)}`,
      });
    }
    if (r() > 0.5) {
      txs.push({
        id: `TX-${++txCounter}`,
        employeeId: emp.id,
        type: 'bonus',
        amountInr: 200,
        status: 'completed',
        createdAt: isoOffset(-14, 10),
        reference: `DEMO-BONUS-${txCounter}`,
      });
    }
    // One historical withdrawal
    const earned = txs.reduce((s, t) => s + t.amountInr, 0);
    const withdraw = Math.floor((earned * 0.4) / 50) * 50;
    if (withdraw > 0) {
      txs.push({
        id: `TX-${++txCounter}`,
        employeeId: emp.id,
        type: 'withdrawal',
        amountInr: -withdraw,
        status: 'completed',
        createdAt: isoOffset(-5, 11),
        reference: `DEMO-WD-${txCounter}`,
      });
    }
    if (idx === 3) {
      txs.push({
        id: `TX-${++txCounter}`,
        employeeId: emp.id,
        type: 'withdrawal',
        amountInr: -500,
        status: 'failed',
        createdAt: isoOffset(-2, 11),
        reference: `DEMO-WD-${txCounter}`,
      });
    }

    // Link seeded approvals
    approvals
      .filter((a) => a.employeeId === emp.id)
      .forEach((a) => {
        const pending = a.stage === 'awaiting_ops' || a.stage === 'escalated';
        txs.push({
          id: `TX-${++txCounter}`,
          employeeId: emp.id,
          type: 'task_reward',
          amountInr: a.rewardInr,
          status: pending ? 'pending' : 'completed',
          createdAt: a.decidedAt ?? a.submittedAt,
          reference: `DEMO-REWARD-${txCounter}`,
          taskId: a.taskId,
        });
      });

    txs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    walletTransactions.push(...txs);
    walletAccounts.push({
      employeeId: emp.id,
      balanceInr: txs.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amountInr, 0),
      pendingInr: txs.filter((t) => t.status === 'pending').reduce((s, t) => s + t.amountInr, 0),
    });
  });
})();

/* ------------------------------------------------------------- trend (demo) */

export const completionTrend: { day: string; completed: number; created: number }[] = (() => {
  const r = mulberry32(2026);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(DEMO_NOW + (i - 13) * DAY);
    return {
      day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
      created: 3 + Math.floor(r() * 6),
      completed: 2 + Math.floor(r() * 6),
    };
  });
})();
