import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Eye,
  FileCheck2,
  History,
  Hourglass,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, StatCard } from '@/components/ui/Card';
import { Async, EmptyState, Notice } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextAreaField } from '@/components/ui/Fields';
import { formatDateTime, formatInr } from '@/utils/format';
import { aiStatusLabel, approvalStageLabel } from '@/utils/labels';
import type { ApprovalRequest, ApprovalStage, Evidence, Task } from '@/types';

type Tab = 'queue' | 'rework' | 'escalated' | 'decided' | 'all';
type Action = Exclude<ApprovalStage, 'awaiting_ops'>;

const TABS: { id: Tab; label: string }[] = [
  { id: 'queue', label: 'Awaiting Ops' },
  { id: 'rework', label: 'In Rework' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'decided', label: 'Decided' },
  { id: 'all', label: 'All Submissions' },
];

const ACTION_COPY: Record<Action, { title: string; confirm: string; toast: string }> = {
  approved: { title: 'Approve & Release Reward', confirm: 'Confirm Approval', toast: 'approved and reward released' },
  rework: { title: 'Request Field Rework', confirm: 'Send Rework Instructions', toast: 'returned to operator for rework' },
  rejected: { title: 'Reject Submission', confirm: 'Confirm Rejection', toast: 'rejected' },
  escalated: { title: 'Escalate to Senior Ops', confirm: 'Confirm Escalation', toast: 'escalated for senior review' },
};

export function ApprovalsPage() {
  const { can, actorName } = useRole();
  const { notify } = useToast();
  const state = useAsync(async () => {
    const [approvals, evidence, tasks] = await Promise.all([
      api.listApprovals(),
      api.listEvidence(),
      api.listTasks(),
    ]);
    return { approvals, evidence, tasks };
  }, []);
  const dir = useDirectory();

  const [tab, setTab] = useState<Tab>('queue');
  const [pending, setPending] = useState<{ req: ApprovalRequest; action: Action } | null>(null);
  const [note, setNote] = useState('');
  const [reworkInstructions, setReworkInstructions] = useState('');
  const [inspectingReq, setInspectingReq] = useState<ApprovalRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const matches = (a: ApprovalRequest) =>
    tab === 'all' ||
    (tab === 'queue' && a.stage === 'awaiting_ops') ||
    (tab === 'rework' && a.stage === 'rework') ||
    (tab === 'escalated' && a.stage === 'escalated') ||
    (tab === 'decided' && (a.stage === 'approved' || a.stage === 'rejected'));

  const rows = useMemo(
    () => (state.data?.approvals ?? []).filter(matches).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.data, tab],
  );

  const awaiting = state.data?.approvals.filter((a) => a.stage === 'awaiting_ops') ?? [];
  const inRework = state.data?.approvals.filter((a) => a.stage === 'rework') ?? [];
  const escalated = state.data?.approvals.filter((a) => a.stage === 'escalated') ?? [];
  const decided = state.data?.approvals.filter((a) => a.stage === 'approved' || a.stage === 'rejected') ?? [];
  const awaitingValue = awaiting.reduce((s, a) => s + a.rewardInr, 0);

  const inspectingEvidence: Evidence | undefined = useMemo(() => {
    if (!inspectingReq || !state.data) return undefined;
    return state.data.evidence.find((e) => e.id === inspectingReq.evidenceId || e.taskId === inspectingReq.taskId);
  }, [inspectingReq, state.data]);

  const inspectingTask: Task | undefined = useMemo(() => {
    if (!inspectingReq || !state.data) return undefined;
    return state.data.tasks.find((t) => t.id === inspectingReq.taskId);
  }, [inspectingReq, state.data]);

  async function confirm() {
    if (!pending) return;
    if (pending.action !== 'approved' && !note.trim()) {
      notify('Please enter a note explaining this operational decision.', 'info');
      return;
    }
    if (pending.action === 'rework' && !reworkInstructions.trim()) {
      notify('Please provide specific rework instructions for the field worker.', 'info');
      return;
    }

    setBusy(true);
    try {
      await api.decideApproval(
        pending.req.id,
        pending.action,
        note.trim(),
        { name: actorName },
        reworkInstructions.trim() || undefined,
      );
      notify(`${pending.req.id} ${ACTION_COPY[pending.action].toast}.`);
      setPending(null);
      setNote('');
      setReworkInstructions('');
      if (inspectingReq?.id === pending.req.id) {
        setInspectingReq(null);
      }
      state.reload();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Decision recording failed', 'info');
    } finally {
      setBusy(false);
    }
  }

  const openDecision = (req: ApprovalRequest, action: Action) => {
    setPending({ req, action });
    setNote('');
    setReworkInstructions('');
  };

  return (
    <>
      <PageHeader
        title="Operations Review & Approvals Queue"
        description="Verify photographic proof, inspect AI validation results, and sign off on field task completion and reward credits."
        actions={
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw size={14} />}
            onClick={state.reload}
            title="Refresh approval records"
            aria-label="Refresh queue"
          >
            Refresh Queue
          </Button>
        }
      />

      <div className="grid grid--stats grid--stats-4">
        <StatCard
          icon={Hourglass}
          tone="warning"
          label="Awaiting Operations"
          value={awaiting.length}
          hint={`${formatInr(awaitingValue)} in pending rewards`}
        />
        <StatCard
          icon={AlertTriangle}
          tone="warning"
          label="In Rework"
          value={inRework.length}
          hint="Operator revisions in progress"
        />
        <StatCard
          icon={ShieldAlert}
          tone="danger"
          label="Escalated"
          value={escalated.length}
          hint="Requires senior review"
        />
        <StatCard
          icon={ShieldCheck}
          tone="success"
          label="Decided"
          value={decided.length}
          hint="Approved or rejected"
        />
      </div>

      <Card>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Filter queue by operational state">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`segmented__btn ${tab === t.id ? 'segmented__btn--on' : ''}`}
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Async state={state} skeletonLines={5}>
          {({ evidence, tasks }) =>
            rows.length === 0 ? (
              <EmptyState
                title="Queue is clear"
                description={
                  tab === 'queue'
                    ? 'All field submissions have been reviewed and decided.'
                    : `No items in the '${tab}' state right now.`
                }
              />
            ) : (
              <div className="table-wrap" role="region" aria-label="Approval requests" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Task & ID</th>
                      <th scope="col">Field Worker</th>
                      <th scope="col" className="num">Reward</th>
                      <th scope="col">AI Verification</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Submitted</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => {
                      const task = tasks.find((t) => t.id === a.taskId);
                      const ev = evidence.find((e) => e.id === a.evidenceId || e.taskId === a.taskId);
                      const isOpen = a.stage === 'awaiting_ops' || a.stage === 'escalated';
                      const isRework = a.stage === 'rework';
                      return (
                        <tr key={a.id}>
                          <td data-label="Task & ID">
                            <span className="cell-title">{task?.title ?? a.taskId}</span>
                            <span className="cell-sub">{a.id} · {a.taskId}</span>
                            {a.note && <span className="cell-sub" style={{ color: 'var(--text-muted)' }}>Latest Note: {a.note}</span>}
                            {a.reworkInstructions && (
                              <span className="cell-sub" style={{ color: 'var(--warn)', fontWeight: 600 }}>
                                Rework: {a.reworkInstructions}
                              </span>
                            )}
                          </td>
                          <td data-label="Field Worker">{dir.employeeName(a.employeeId)}</td>
                          <td data-label="Reward" className="num">
                            <strong style={{ color: 'var(--blue-deep)' }}>{formatInr(a.rewardInr)}</strong>
                          </td>
                          <td data-label="AI Verification">
                            {ev ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <Badge tone={aiStatusLabel[ev.ai.status].tone}>
                                  {aiStatusLabel[ev.ai.status].label}
                                </Badge>
                                {ev.ai.confidence !== null && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {(ev.ai.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td data-label="Stage">
                            <Badge tone={approvalStageLabel[a.stage].tone}>
                              {approvalStageLabel[a.stage].label}
                            </Badge>
                          </td>
                          <td data-label="Submitted">{formatDateTime(a.submittedAt)}</td>
                          <td className="actions">
                            <div className="btn-row btn-row--end">
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Eye size={14} />}
                                onClick={() => setInspectingReq(a)}
                                title="Inspect Evidence & AI Details"
                                aria-label={`Inspect evidence for ${a.id}`}
                              >
                                Inspect
                              </Button>

                              {isOpen && can('decideApprovals') && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="success"
                                    icon={<Check size={14} />}
                                    onClick={() => openDecision(a, 'approved')}
                                    aria-label={`Approve ${a.id}`}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    icon={<RotateCcw size={14} />}
                                    onClick={() => openDecision(a, 'rework')}
                                    aria-label={`Request Rework for ${a.id}`}
                                  >
                                    Rework
                                  </Button>
                                  {a.stage !== 'escalated' && (
                                    <Button
                                      size="sm"
                                      icon={<ArrowUpRight size={14} />}
                                      onClick={() => openDecision(a, 'escalated')}
                                      aria-label={`Escalate ${a.id}`}
                                    >
                                      Escalate
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    icon={<X size={14} />}
                                    onClick={() => openDecision(a, 'rejected')}
                                    aria-label={`Reject ${a.id}`}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {isRework && (
                                <span style={{ fontSize: '12px', color: 'var(--warn)', fontWeight: 600 }}>
                                  With Operator
                                </span>
                              )}

                              {a.decidedBy && !isOpen && !isRework && (
                                <span className="muted small">by {a.decidedBy}</span>
                              )}
                            </div>
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
        {!can('decideApprovals') && (
          <Notice tone="info">Your assigned role permits viewing the operations queue, but approval decisions require Operations Manager authorization.</Notice>
        )}
      </Card>

      {/* Decision Action Dialog */}
      <Dialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        title={pending ? `${ACTION_COPY[pending.action].title} — ${pending.req.id}` : 'Operational Decision'}
        footer={
          pending && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant={
                  pending.action === 'rejected'
                    ? 'danger'
                    : pending.action === 'approved'
                    ? 'success'
                    : 'primary'
                }
                disabled={busy}
                onClick={confirm}
              >
                {ACTION_COPY[pending.action].confirm}
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          )
        }
      >
        {pending && (
          <div className="stack" style={{ gap: '14px' }}>
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '12px',
                borderRadius: 'var(--radius)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div>
                <span className="muted small" style={{ display: 'block' }}>Field Operator</span>
                <strong>{dir.employeeName(pending.req.employeeId)}</strong>
              </div>
              <div>
                <span className="muted small" style={{ display: 'block' }}>Reward Amount</span>
                <strong style={{ color: 'var(--blue-deep)' }}>{formatInr(pending.req.rewardInr)}</strong>
              </div>
            </div>

            {pending.action === 'rework' && (
              <TextAreaField
                label="Specific Rework Instructions (Required for Field Worker)"
                hint="Describe clearly what the operator must re-photograph, correct or verify on-site."
                rows={3}
                value={reworkInstructions}
                onChange={(e) => setReworkInstructions(e.target.value)}
              />
            )}

            <TextAreaField
              label={pending.action === 'approved' ? 'Approval Audit Note (Optional)' : 'Decision Reason Note (Required)'}
              hint="Recorded in the server audit trail and status history."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}
      </Dialog>

      {/* Full Evidence Inspection Modal */}
      <Dialog
        open={Boolean(inspectingReq)}
        onClose={() => setInspectingReq(null)}
        title={inspectingReq ? `Evidence & AI Inspection · ${inspectingReq.id}` : 'Evidence Inspection'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {inspectingReq && (inspectingReq.stage === 'awaiting_ops' || inspectingReq.stage === 'escalated') && can('decideApprovals') && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Check size={14} />}
                    onClick={() => {
                      const req = inspectingReq;
                      openDecision(req, 'approved');
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    icon={<RotateCcw size={14} />}
                    onClick={() => {
                      const req = inspectingReq;
                      openDecision(req, 'rework');
                    }}
                  >
                    Request Rework
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<X size={14} />}
                    onClick={() => {
                      const req = inspectingReq;
                      openDecision(req, 'rejected');
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
            <Button variant="ghost" onClick={() => setInspectingReq(null)}>
              Close Inspector
            </Button>
          </div>
        }
      >
        {inspectingReq && (
          <div className="stack" style={{ gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            {/* Header Summary */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0' }}>
                {inspectingTask?.title || inspectingReq.taskId}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', margin: 0 }}>
                Operator: <strong>{dir.employeeName(inspectingReq.employeeId)}</strong> · Reward: <strong>{formatInr(inspectingReq.rewardInr)}</strong>
              </p>
            </div>

            {/* AI Verification Section */}
            {inspectingEvidence?.ai && (
              <div className="panel panel--ai">
                <div className="panel__head">
                  <span className="panel__title">
                    <Sparkles size={16} aria-hidden /> Gemini AI Verification
                  </span>
                  <Badge tone={aiStatusLabel[inspectingEvidence.ai.status].tone}>
                    {aiStatusLabel[inspectingEvidence.ai.status].label}
                  </Badge>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                  {inspectingEvidence.ai.summary}
                </div>
                {inspectingEvidence.ai.checks && inspectingEvidence.ai.checks.length > 0 && (
                  <ul className="ai-checks" style={{ margin: 0, padding: 0 }}>
                    {inspectingEvidence.ai.checks.map((chk) => (
                      <li key={chk.id} style={{ fontSize: '12.5px' }}>
                        {chk.outcome === 'pass' && <Check size={14} className="ico-ok" />}
                        {chk.outcome === 'warn' && <AlertTriangle size={14} className="ico-warn" />}
                        {chk.outcome === 'fail' && <X size={14} className="ico-bad" />}
                        <span>
                          <strong>{chk.label}:</strong> {chk.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Photo Proof Grid */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} /> Photographic Proof & GPS Watermarks ({inspectingEvidence?.photos.length || 0})
              </h4>
              {inspectingEvidence?.photos && inspectingEvidence.photos.length > 0 ? (
                <div className="photo-grid">
                  {inspectingEvidence.photos.map((photo) => (
                    <div key={photo.id} className="photo-card">
                      <div
                        className="photo"
                        style={{
                          backgroundColor: `hsl(${photo.hue || 210}, 45%, 88%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>
                            {photo.caption}
                          </span>
                        </div>
                        {photo.geotag && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(5, 14, 34, 0.85)',
                              color: '#fff',
                              padding: '4px 6px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>GPS: {photo.geotag.lat.toFixed(4)}, {photo.geotag.lng.toFixed(4)}</span>
                            <span>{new Date(photo.geotag.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {photo.geotag?.address || 'GPS verified address'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted small">No photos attached to this submission.</p>
              )}
            </div>

            {/* Checklist Results */}
            {inspectingEvidence?.checklist && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileCheck2 size={14} /> Field Checklist Execution
                </h4>
                <ul className="check-results" style={{ margin: 0, padding: 0 }}>
                  {inspectingEvidence.checklist.map((item) => (
                    <li key={item.itemId} style={{ background: item.done ? 'var(--good-soft)' : 'var(--danger-bg)' }}>
                      {item.done ? <Check size={14} className="ico-ok" /> : <X size={14} className="ico-bad" />}
                      <span style={{ fontSize: '12.5px', flex: 1 }}>{item.label}</span>
                      {item.requiresPhoto && (
                        <span style={{ fontSize: '11px', color: item.photoAttached ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                          {item.photoAttached ? 'Photo attached' : 'Photo missing'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status History & Audit Trail */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={14} /> Decision History & Status Audit
              </h4>
              <div className="audit-trail">
                {(inspectingReq.history && inspectingReq.history.length > 0 ? inspectingReq.history : [
                  {
                    stage: inspectingReq.stage,
                    decidedAt: inspectingReq.submittedAt,
                    decidedBy: inspectingReq.decidedBy || 'System',
                    note: inspectingReq.note || 'Submission recorded.',
                  },
                ]).map((hist, idx) => (
                  <div key={idx} className={`audit-node audit-node--${hist.stage}`}>
                    <div className="audit-node__head">
                      <span className="audit-node__title">
                        {approvalStageLabel[hist.stage]?.label || hist.stage}
                        {hist.decidedBy && ` by ${hist.decidedBy}`}
                      </span>
                      <span className="audit-node__time">{formatDateTime(hist.decidedAt)}</span>
                    </div>
                    {hist.note && <div className="audit-node__note">{hist.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
