import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Circle, UserCheck, XCircle } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Async, EmptyState, Notice } from '@/components/ui/States';
import { Badge, DemoTag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Meter } from '@/components/ui/Meter';
import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder';
import { TextAreaField } from '@/components/ui/Fields';
import { formatDateTime } from '@/utils/format';
import { aiStatusLabel, managerDecisionLabel } from '@/utils/labels';
import type { Evidence, ManagerDecisionStatus, Task } from '@/types';

type DecisionFilter = ManagerDecisionStatus | 'all';

export function EvidencePage() {
  const { customerId } = useRole();
  const state = useAsync(async () => {
    const [evidence, tasks] = await Promise.all([api.listEvidence({ customerId }), api.listTasks({ customerId })]);
    return { evidence, tasks };
  }, [customerId]);
  const dir = useDirectory();

  const [filter, setFilter] = useState<DecisionFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () =>
      (state.data?.evidence ?? [])
        .filter((e) => filter === 'all' || e.managerDecision.status === filter)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [state.data, filter],
  );

  // Keep a valid selection as the list/filter changes.
  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
    } else if (!items.some((e) => e.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selected = items.find((e) => e.id === selectedId);
  const task = state.data?.tasks.find((t) => t.id === selected?.taskId);

  function choose(id: string) {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 1020px)').matches) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <>
      <PageHeader
        title="Photo evidence review"
        description="Review submitted photos and checklists. AI output and the manager’s decision are shown separately."
        actions={<DemoTag />}
      />

      <Async state={state} skeletonLines={6}>
        {() => (
          <div className="grid grid--evidence">
            <Card aria-labelledby="ev-list">
              <CardHeader id="ev-list" title="Submissions" />
              <div className="field-inline field-inline--block">
                <label htmlFor="ev-filter" className="field__label">Manager decision</label>
                <select id="ev-filter" className="input input--compact" value={filter} onChange={(e) => setFilter(e.target.value as DecisionFilter)}>
                  <option value="all">All</option>
                  <option value="pending">Awaiting manager</option>
                  <option value="rework">Rework requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {items.length === 0 ? (
                <EmptyState title="No submissions" description="Nothing matches this filter." />
              ) : (
                <ul className="ev-list">
                  {items.map((e) => {
                    const t = state.data?.tasks.find((x) => x.id === e.taskId);
                    return (
                      <li key={e.id}>
                        <button type="button" className={`ev-item ${e.id === selectedId ? 'ev-item--on' : ''}`} aria-pressed={e.id === selectedId} onClick={() => choose(e.id)}>
                          <span className="cell-title">{t?.title ?? e.taskId}</span>
                          <span className="cell-sub">{e.id} · {dir.employeeName(e.employeeId)} · {formatDateTime(e.submittedAt)}</span>
                          <span className="ev-item__badges">
                            <Badge tone={managerDecisionLabel[e.managerDecision.status].tone}>{managerDecisionLabel[e.managerDecision.status].label}</Badge>
                            {customerId === undefined && <Badge tone={aiStatusLabel[e.ai.status].tone}>{aiStatusLabel[e.ai.status].label}</Badge>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <div ref={detailRef} className="ev-detail" tabIndex={-1}>
              {selected && task ? (
                <EvidenceDetail key={selected.id} evidence={selected} task={task} employeeName={dir.employeeName(selected.employeeId)} customerName={dir.customerName(task.customerId)} onDecided={state.reload} />
              ) : (
                <Card><EmptyState title="Select a submission" description="Choose an item on the left to review its photos and checklist." /></Card>
              )}
            </div>
          </div>
        )}
      </Async>
    </>
  );
}

function EvidenceDetail({ evidence, task, employeeName, customerName, onDecided }: {
  evidence: Evidence;
  task: Task;
  employeeName: string;
  customerName: string;
  onDecided: () => void;
}) {
  const { can, role, actorName } = useRole();
  const { notify } = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const showAi = can('viewAiResults');
  const canDecide = can('decideEvidence') && evidence.managerDecision.status !== 'approved';
  const ai = evidence.ai;
  const decision = evidence.managerDecision;

  const aiPositive = ai.status === 'passed';
  const aiNegative = ai.status === 'failed';
  const differs =
    showAi &&
    ((aiPositive && (decision.status === 'rejected' || decision.status === 'rework')) ||
      (aiNegative && decision.status === 'approved') ||
      (ai.status === 'flagged' && decision.status === 'approved'));

  const missing = evidence.checklist.filter((c) => c.required && (!c.done || (c.requiresPhoto && !c.photoAttached)));

  async function decide(status: Exclude<ManagerDecisionStatus, 'pending'>) {
    if (status !== 'approved' && !note.trim()) {
      notify('Add a short note so the employee knows what to fix.', 'info');
      return;
    }
    setBusy(true);
    try {
      await api.decideEvidence(evidence.id, status, note.trim(), { name: actorName });
      notify(
        status === 'approved'
          ? 'Manager approval recorded and sent to the operations queue (demo state only).'
          : `Decision recorded: ${managerDecisionLabel[status].label.toLowerCase()} (demo state only).`,
      );
      setNote('');
      onDecided();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <Card aria-labelledby="ev-head">
        <CardHeader
          id="ev-head"
          title={task.title}
          subtitle={`${task.id} · ${evidence.id} · ${task.category}`}
        />
        <dl className="defs defs--wide">
          <div><dt>Submitted by</dt><dd>{employeeName}</dd></div>
          <div><dt>Submitted</dt><dd>{formatDateTime(evidence.submittedAt)}</dd></div>
          <div><dt>Customer</dt><dd>{customerName}</dd></div>
          <div><dt>Location</dt><dd>{task.location.address}, {task.location.area}</dd></div>
        </dl>
      </Card>

      <Card aria-labelledby="ev-photos">
        <CardHeader id="ev-photos" title={`Photos (${evidence.photos.length})`} subtitle="Generated placeholders — not real photographs" />
        {evidence.photos.length === 0 ? (
          <EmptyState title="No photos attached" />
        ) : (
          <ul className="photo-grid">
            {evidence.photos.map((p) => (
              <li key={p.id}>
                <figure className="photo-card">
                  <PhotoPlaceholder hue={p.hue} caption={p.caption} />
                  <figcaption>
                    <span className="cell-title">{p.caption}</span>
                    <span className="cell-sub">{formatDateTime(p.capturedAt)}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card aria-labelledby="ev-check">
        <CardHeader id="ev-check" title="Checklist results" subtitle={missing.length ? `${missing.length} required item${missing.length > 1 ? 's' : ''} incomplete` : 'All required items complete'} />
        <ul className="check-results">
          {evidence.checklist.map((c) => {
            const ok = c.done && (!c.requiresPhoto || c.photoAttached);
            return (
              <li key={c.itemId} className={ok ? '' : 'check-results__bad'}>
                {ok ? <CheckCircle2 size={18} aria-hidden className="ico-ok" /> : c.required ? <XCircle size={18} aria-hidden className="ico-bad" /> : <Circle size={18} aria-hidden className="ico-muted" />}
                <span>
                  {c.label}
                  <span className="cell-sub">
                    {!c.done ? 'Not completed' : c.requiresPhoto && !c.photoAttached ? 'Photo missing' : c.requiresPhoto ? 'Completed with photo' : 'Completed'}
                    {!c.required && ' · optional'}
                  </span>
                </span>
                <span className="sr-only">{ok ? 'Complete' : 'Incomplete'}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {differs && (
        <Notice tone="warning" title="AI result and manager decision differ">
          The sample AI output and the manager’s decision disagree. The manager’s decision is the one that counts.
        </Notice>
      )}

      <div className="grid grid--decision">
        {showAi && (
          <section className="panel panel--ai" aria-labelledby="ai-title">
            <div className="panel__head">
              <h2 id="ai-title" className="panel__title"><Bot size={18} aria-hidden /> AI verification</h2>
              <DemoTag label="Sample output" />
            </div>
            <p className="panel__note">Static demo data — no model runs in this prototype. Advisory only; it never approves or rejects anything.</p>
            <div className="panel__status">
              <Badge tone={aiStatusLabel[ai.status].tone}>{aiStatusLabel[ai.status].label}</Badge>
              {ai.runAt && <span className="muted small">Sample run {formatDateTime(ai.runAt)}</span>}
            </div>
            {ai.confidence !== null && (
              <div>
                <p className="small muted">Sample confidence</p>
                <Meter value={ai.confidence} label="AI sample confidence" tone={ai.status === 'passed' ? 'ai' : ai.status === 'flagged' ? 'warning' : 'danger'} />
              </div>
            )}
            <p>{ai.summary}</p>
            {ai.checks.length > 0 && (
              <ul className="ai-checks">
                {ai.checks.map((c) => (
                  <li key={c.id}>
                    {c.outcome === 'pass' ? <CheckCircle2 size={16} aria-hidden className="ico-ok" /> : c.outcome === 'warn' ? <AlertTriangle size={16} aria-hidden className="ico-warn" /> : <XCircle size={16} aria-hidden className="ico-bad" />}
                    <span>
                      <strong>{c.label}</strong>
                      <span className="cell-sub">{c.detail}</span>
                    </span>
                    <span className="sr-only">{c.outcome === 'pass' ? 'Passed' : c.outcome === 'warn' ? 'Warning' : 'Failed'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="panel panel--manager" aria-labelledby="mgr-title">
          <div className="panel__head">
            <h2 id="mgr-title" className="panel__title"><UserCheck size={18} aria-hidden /> Manager decision</h2>
          </div>
          <p className="panel__note">A person’s decision, recorded independently of the AI output above.</p>
          <div className="panel__status">
            <Badge tone={managerDecisionLabel[decision.status].tone}>{managerDecisionLabel[decision.status].label}</Badge>
            {decision.decidedAt && <span className="muted small">{decision.decidedBy} · {formatDateTime(decision.decidedAt)}</span>}
          </div>
          {decision.note && <blockquote className="quote">{decision.note}</blockquote>}

          {canDecide ? (
            <div className="stack stack--tight">
              <TextAreaField label="Note to employee" rows={3} value={note} onChange={(e) => setNote(e.target.value)} hint="Required when rejecting or requesting rework." />
              <div className="btn-row">
                <Button variant="success" disabled={busy} onClick={() => decide('approved')}>Approve</Button>
                <Button disabled={busy} onClick={() => decide('rework')}>Request rework</Button>
                <Button variant="danger" disabled={busy} onClick={() => decide('rejected')}>Reject</Button>
              </div>
              <p className="muted small">Approving sends the task to the operations approval queue. Demo state only.</p>
            </div>
          ) : decision.status === 'approved' ? (
            <p className="muted small">Approved evidence moves to the operations queue; no further manager action is needed.</p>
          ) : (
            <p className="muted small">{role === 'customer' ? 'You can follow the outcome here; decisions are made by the service team.' : 'Your demo role can’t record manager decisions.'}</p>
          )}
        </section>
      </div>
    </div>
  );
}
