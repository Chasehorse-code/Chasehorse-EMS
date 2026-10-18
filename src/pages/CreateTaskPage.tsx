import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useToast } from '@/context/ToastContext';
import { OPERATIONAL_HUBS } from '@/config/locations';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/States';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Fields';
import { toDateTimeLocal } from '@/utils/format';
import { haversineKm } from '@/utils/geo';
import type { TaskCategory, TaskPriority } from '@/types';

const CATEGORIES: TaskCategory[] = ['Shelf audit', 'Site survey', 'Signage check', 'Equipment inspection', 'Delivery proof'];
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

type Errors = Partial<Record<'title' | 'customerId' | 'dueAt' | 'rewardInr', string>>;

export function CreateTaskPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const dir = useDirectory();
  const checklists = useAsync(() => api.listChecklists(), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Shelf audit');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [customerId, setCustomerId] = useState('');
  const [areaKey, setAreaKey] = useState('central');
  const [address, setAddress] = useState('');
  const [dueAt, setDueAt] = useState(toDateTimeLocal(new Date(Date.now() + 2 * 86_400_000).toISOString()));
  const [rewardInr, setRewardInr] = useState('450');
  const [assigneeId, setAssigneeId] = useState('');
  const [templateOverride, setTemplateOverride] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const templates = checklists.data ?? [];
  const templateId = templateOverride || templates.find((t) => t.category === category)?.id || '';
  const template = templates.find((t) => t.id === templateId);

  const approved = useMemo(() => {
    const target = OPERATIONAL_HUBS[areaKey] || OPERATIONAL_HUBS.central;
    return dir.employees
      .filter((e) => e.approvalStatus === 'approved')
      .map((e) => ({ e, km: haversineKm(e.location, target) }))
      .sort((a, b) => a.km - b.km);
  }, [dir.employees, areaKey]);


  function validate(): Errors {
    const next: Errors = {};
    if (title.trim().length < 5) next.title = 'Enter a title of at least 5 characters.';
    if (!customerId) next.customerId = 'Choose a customer.';
    if (!dueAt) next.dueAt = 'Choose a due date and time.';
    const reward = Number(rewardInr);
    if (rewardInr === '' || Number.isNaN(reward) || reward < 0) next.rewardInr = 'Enter a reward of 0 or more.';
    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const task = await api.createTask({
        title,
        description,
        category,
        priority,
        customerId,
        areaKey,
        address,
        dueAt: new Date(dueAt + '+05:30').toISOString(),
        rewardInr: Number(rewardInr),
        assigneeId: assigneeId || undefined,
        checklistTemplateId: templateId,
      });
      notify(`${task.id} created${assigneeId ? ' and assigned' : ''} — demo state only, not saved.`);
      navigate('/tasks');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create task', 'info');
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create task"
        description="Define a field task, pick a checklist and optionally assign it right away."
        actions={
          <Link to="/tasks" className="btn btn--ghost btn--md">
            <span className="btn__icon" aria-hidden><ArrowLeft size={16} /></span>
            Back to tasks
          </Link>
        }
      />

      <div className="grid grid--form">
        <Card aria-labelledby="task-details">
          <CardHeader id="task-details" title="Task details" />
          <form onSubmit={onSubmit} noValidate className="form">
            <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} placeholder="e.g. Shelf audit — Store 70" />
            <TextAreaField label="Instructions" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} hint="Shown to the assigned employee." />

            <div className="form__row">
              <SelectField label="Category" value={category} onChange={(e) => { setCategory(e.target.value as TaskCategory); setTemplateOverride(''); }}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </SelectField>
              <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
              </SelectField>
            </div>

            <SelectField label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)} error={errors.customerId}>
              <option value="">Select a customer…</option>
              {dir.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>

            <div className="form__row">
              <SelectField label="Area" value={areaKey} onChange={(e) => setAreaKey(e.target.value)}>
                {Object.entries(OPERATIONAL_HUBS).map(([k, a]) => <option key={k} value={k}>{a.name}</option>)}
              </SelectField>
              <TextField label="Street / landmark" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
            </div>

            <div className="form__row">
              <TextField label="Due" type="datetime-local" required value={dueAt} onChange={(e) => setDueAt(e.target.value)} error={errors.dueAt} />
              <TextField label="Reward (INR)" type="number" inputMode="numeric" min={0} step={10} required value={rewardInr} onChange={(e) => setRewardInr(e.target.value)} error={errors.rewardInr} hint="Display value only — no payment is processed." />
            </div>

            <SelectField label="Checklist template" value={templateId} onChange={(e) => setTemplateOverride(e.target.value)} hint="Defaults to the template for the chosen category.">
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
            </SelectField>

            <SelectField label="Assign now (optional)" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} hint="Only approved employees are listed, nearest first.">
              <option value="">Leave unassigned (task will be Open)</option>
              {approved.map(({ e, km }) => <option key={e.id} value={e.id}>{e.name} — {km.toFixed(1)} km</option>)}
            </SelectField>

            <div className="form__actions">
              <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Creating…' : 'Create task'}</Button>
              <Link to="/tasks" className="btn btn--ghost btn--md">Cancel</Link>
            </div>
          </form>
        </Card>

        <div className="stack">
          <Card aria-labelledby="cl-preview">
            <CardHeader id="cl-preview" title="Checklist preview" subtitle={template?.name ?? 'No template selected'} />
            {template ? (
              <ol className="preview-list">
                {template.items.map((it) => (
                  <li key={it.id}>
                    <span>{it.label}</span>
                    <span className="preview-list__tags">
                      {it.required ? <span className="chip chip--strong">Required</span> : <span className="chip">Optional</span>}
                      {it.requiresPhoto && <span className="chip chip--photo"><Camera size={12} aria-hidden /> Photo</span>}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">Loading templates…</p>
            )}
          </Card>
          <Notice title="Demo behaviour">
            Creating a task adds it to in-memory demo data so you can see it in the lists. Nothing is sent to a server, and no notification reaches an employee.
          </Notice>
        </div>
      </div>
    </>
  );
}
