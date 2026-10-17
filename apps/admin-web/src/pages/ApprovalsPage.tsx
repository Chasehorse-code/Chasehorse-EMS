import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, StatCard } from '@/components/ui/Card';
import { Async, EmptyState, Notice } from '@/components/ui/States';
import { Badge, DemoTag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextAreaField } from '@/components/ui/Fields';
import { formatDateTime, formatInr } from '@/utils/format';
import { aiStatusLabel, approvalStageLabel } from '@/utils/labels';
import { Hourglass, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { ApprovalRequest, ApprovalStage } from '@/types';

type Tab = 'queue' | 'escalated' | 'decided' | 'all';
type Action = Exclude<ApprovalStage, 'awaiting_ops'>;

const TABS: { id: Tab; label: string }[] = [
  { id: 'queue', label: 'Awaiting' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'decided', label: 'Decided' },
  { id: 'all', label: 'All' },
];

const ACTION_COPY: Record<Action, { title: string; confirm: string; toast: string }> = {
  approved: { title: 'Approve', confirm: 'Approve', toast: 'marked approved' },
  rejected: { title: 'Reject', confirm: 'Reject', toast: 'marked rejected' },
  escalated: { title: 'Escalate', confirm: 'Escalate', toast: 'escalated' },
};

export function ApprovalsPage() {
  const { can, actorName } = useRole();
  const { notify } = useToast();
  const state = useAsync(async () => {
    const [approvals, evidence, tasks] = await Promise.all([api.listApprovals(), api.listEvidence(), api.listTasks()]);
    return { approvals, evidence, tasks };
  }, []);
  const dir = useDirectory();

  const [tab, setTab] = useState<Tab>('queue');
  const [pending, setPending] = useState<{ req: ApprovalRequest; action: Action } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const matches = (a: ApprovalRequest) =>
    tab === 'all' ||
    (tab === 'queue' && a.stage === 'awaiting_ops') ||
    (tab === 'escalated' && a.stage === 'escalated') ||
    (tab === 'decided' && (a.stage === 'approved' || a.stage === 'rejected'));

  const rows = useMemo(
    () => (state.data?.approvals ?? []).filter(matches).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.data, tab],
  );

  const awaiting = state.data?.approvals.filter((a) => a.stage === 'awaiting_ops') ?? [];
  const escalated = state.data?.approvals.filter((a) => a.stage === 'escalated') ?? [];
  const awaitingValue = awaiting.reduce((s, a) => s + a.rewardInr, 0);

  async function confirm() {
    if (!pending) return;
    if (pending.action !== 'approved' && !note.trim()) {
      notify('Add a note explaining this decision.', 'info');
      return;
    }
    setBusy(true);
    try {
      await api.decideApproval(pending.req.id, pending.action, note.trim(), { name: actorName });
      notify(`${pending.req.id} ${ACTION_COPY[pending.action].toast} — demo state only. No payment or wallet entry was created.`);
      setPending(null);
      setNote('');
      state.reload();
    } finally {
      setBusy(false);
    }
  }

  const open = (req: ApprovalRequest, action: Action) => {
    setPending({ req, action });
    setNote('');
  };

  return (
    <>
      <PageHeader
        title="Operations approval queue"
        description="Final sign-off after a manager has approved the evidence."
        actions={<DemoTag />}
      />

      <Notice tone="warning" title="No payments in this prototype">
        Approving an item only changes its status in demo memory. It does not release money, create a wallet entry or notify anyone.
      </Notice>

      <div className="grid grid--stats grid--stats-3">
        <StatCard icon={Hourglass} tone="warning" label="Awaiting operations" value={awaiting.length} hint={`${formatInr(awaitingValue)} in sample rewards`} />
        <StatCard icon={TriangleAlert} tone="danger" label="Escalated" value={escalated.length} hint="Need a second look" />
        <StatCard icon={ShieldCheck} tone="success" label="Decided" value={state.data?.approvals.filter((a) => a.stage === 'approved' || a.stage === 'rejected').length ?? 0} hint="Approved or rejected" />
      </div>

      <Card>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Filter queue">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={`segmented__btn ${tab === t.id ? 'segmented__btn--on' : ''}`} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Async state={state} skeletonLines={5}>
          {({ evidence, tasks }) =>
            rows.length === 0 ? (
              <EmptyState title="Queue is clear" description="Nothing in this view right now." />
            ) : (
              <div className="table-wrap" role="region" aria-label="Approval requests" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Request</th>
                      <th scope="col">Employee</th>
                      <th scope="col" className="num">Reward</th>
                      <th scope="col">AI sample result</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Waiting since</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => {
                      const task = tasks.find((t) => t.id === a.taskId);
                      const ev = evidence.find((e) => e.id === a.evidenceId);
                      const open_ = a.stage === 'awaiting_ops' || a.stage === 'escalated';
                      return (
                        <tr key={a.id}>
                          <td data-label="Request">
                            <span className="cell-title">{task?.title ?? a.taskId}</span>
                            <span className="cell-sub">{a.id} · {a.taskId}</span>
                            {a.note && <span className="cell-sub">Note: {a.note}</span>}
                          </td>
                          <td data-label="Employee">{dir.employeeName(a.employeeId)}</td>
                          <td data-label="Reward" className="num">{formatInr(a.rewardInr)}</td>
                          <td data-label="AI sample result">{ev ? <Badge tone={aiStatusLabel[ev.ai.status].tone}>{aiStatusLabel[ev.ai.status].label}</Badge> : '—'}</td>
                          <td data-label="Stage"><Badge tone={approvalStageLabel[a.stage].tone}>{approvalStageLabel[a.stage].label}</Badge></td>
                          <td data-label="Waiting since">{formatDateTime(a.submittedAt)}</td>
                          <td className="actions">
                            {open_ && can('decideApprovals') ? (
                              <span className="btn-row btn-row--end">
                                <Button size="sm" variant="success" icon={<Check size={14} />} onClick={() => open(a, 'approved')} aria-label={`Approve ${a.id}`}>Approve</Button>
                                {a.stage !== 'escalated' && <Button size="sm" icon={<ArrowUpRight size={14} />} onClick={() => open(a, 'escalated')} aria-label={`Escalate ${a.id}`}>Escalate</Button>}
                                <Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => open(a, 'rejected')} aria-label={`Reject ${a.id}`}>Reject</Button>
                              </span>
                            ) : a.decidedBy ? (
                              <span className="muted small">{a.decidedBy}</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </Async>
        {!can('decideApprovals') && <Notice>Your demo role can view the queue but not decide on items.</Notice>}
      </Card>

      <Dialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        title={pending ? `${ACTION_COPY[pending.action].title} ${pending.req.id}` : 'Decision'}
        footer={
          pending && (
            <>
              <Button variant={pending.action === 'rejected' ? 'danger' : pending.action === 'approved' ? 'success' : 'primary'} disabled={busy} onClick={confirm}>
                {ACTION_COPY[pending.action].confirm}
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            </>
          )
        }
      >
        {pending && (
          <div className="stack">
            <p>
              {dir.employeeName(pending.req.employeeId)} · {formatInr(pending.req.rewardInr)} sample reward
            </p>
            <TextAreaField label={pending.action === 'approved' ? 'Note (optional)' : 'Note (required)'} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="muted small">Demo only: this updates the status in browser memory. No payment, payout or wallet transaction happens.</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
