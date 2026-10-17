import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, Plus, Trash2 } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Async, Notice } from '@/components/ui/States';
import { DemoTag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Fields';
import { formatDate } from '@/utils/format';
import type { ChecklistTemplate, TaskCategory } from '@/types';

const CATEGORIES: TaskCategory[] = ['Shelf audit', 'Site survey', 'Signage check', 'Equipment inspection', 'Delivery proof'];

let itemCounter = 0;
const newItemId = () => `n${++itemCounter}`;

export function ChecklistsPage() {
  const { can } = useRole();
  const { notify } = useToast();
  const state = useAsync(() => api.listChecklists(), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChecklistTemplate | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const editable = can('editChecklists');

  const list = state.data;

  // Select the first template once loaded.
  useEffect(() => {
    if (list && !activeId && list.length) setActiveId(list[0].id);
  }, [list, activeId]);

  // Load the selected template into the editor when it changes.
  useEffect(() => {
    if (!list || !activeId) return;
    const found = list.find((t) => t.id === activeId);
    if (found) {
      setDraft(structuredClone(found));
      setDirty(false);
    }
  }, [list, activeId]);

  function update(patch: Partial<ChecklistTemplate>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  }

  function updateItem(id: string, patch: Partial<ChecklistTemplate['items'][number]>) {
    if (!draft) return;
    update({ items: draft.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }

  function move(index: number, dir: -1 | 1) {
    if (!draft) return;
    const items = [...draft.items];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    update({ items });
  }

  function startNew() {
    const id = `cl-new-${Date.now()}`;
    setActiveId(id);
    setDraft({ id, name: 'New checklist', category: 'Shelf audit', items: [{ id: newItemId(), label: '', required: true, requiresPhoto: false }], updatedAt: new Date().toISOString() });
    setDirty(true);
  }

  async function save() {
    if (!draft) return;
    const cleaned = { ...draft, name: draft.name.trim() || 'Untitled checklist', items: draft.items.filter((i) => i.label.trim()) };
    if (cleaned.items.length === 0) {
      notify('Add at least one checklist item before saving.', 'info');
      return;
    }
    setBusy(true);
    try {
      await api.saveChecklist(cleaned);
      notify('Checklist saved to demo data only (resets on refresh).');
      setActiveId(cleaned.id);
      state.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Task checklists"
        description="Configure the steps and photo requirements employees must complete for each task category."
        actions={
          <>
            <DemoTag />
            {editable && <Button icon={<Plus size={16} />} onClick={startNew}>New template</Button>}
          </>
        }
      />

      <Async state={state} skeletonLines={6}>
        {(templates) => (
          <div className="grid grid--checklists">
            <Card aria-labelledby="tpl-list">
              <CardHeader id="tpl-list" title="Templates" />
              <ul className="tpl-list">
                {[...templates, ...(draft && !templates.some((t) => t.id === draft.id) ? [draft] : [])].map((t) => (
                  <li key={t.id}>
                    <button type="button" className={`tpl ${t.id === activeId ? 'tpl--on' : ''}`} aria-pressed={t.id === activeId} onClick={() => setActiveId(t.id)}>
                      <span className="cell-title">{t.name}</span>
                      <span className="cell-sub">{t.category} · {t.items.length} items · {formatDate(t.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card aria-labelledby="tpl-edit">
              <CardHeader id="tpl-edit" title="Edit template" subtitle={dirty ? 'Unsaved changes' : 'All changes saved'} />
              {!draft ? (
                <p className="muted">Select a template.</p>
              ) : (
                <div className="form">
                  <div className="form__row">
                    <TextField label="Template name" value={draft.name} disabled={!editable} onChange={(e) => update({ name: e.target.value })} />
                    <SelectField label="Category" value={draft.category} disabled={!editable} onChange={(e) => update({ category: e.target.value as TaskCategory })}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </SelectField>
                  </div>

                  <fieldset className="items" disabled={!editable}>
                    <legend className="field__label">Checklist items</legend>
                    {draft.items.map((it, idx) => (
                      <div key={it.id} className="item-row">
                        <span className="item-row__n" aria-hidden>{idx + 1}</span>
                        <div className="item-row__label">
                          <label htmlFor={`item-${it.id}`} className="sr-only">Item {idx + 1} description</label>
                          <input id={`item-${it.id}`} className="input" value={it.label} placeholder="Describe the step" onChange={(e) => updateItem(it.id, { label: e.target.value })} />
                        </div>
                        <label className="check check--compact">
                          <input type="checkbox" checked={it.required} onChange={(e) => updateItem(it.id, { required: e.target.checked })} />
                          <span>Required</span>
                        </label>
                        <label className="check check--compact">
                          <input type="checkbox" checked={it.requiresPhoto} onChange={(e) => updateItem(it.id, { requiresPhoto: e.target.checked })} />
                          <span><Camera size={13} aria-hidden /> Photo</span>
                        </label>
                        <div className="item-row__btns">
                          <button type="button" className="icon-btn" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label={`Move item ${idx + 1} up`}><ArrowUp size={16} aria-hidden /></button>
                          <button type="button" className="icon-btn" onClick={() => move(idx, 1)} disabled={idx === draft.items.length - 1} aria-label={`Move item ${idx + 1} down`}><ArrowDown size={16} aria-hidden /></button>
                          <button type="button" className="icon-btn icon-btn--danger" onClick={() => update({ items: draft.items.filter((x) => x.id !== it.id) })} aria-label={`Remove item ${idx + 1}`}><Trash2 size={16} aria-hidden /></button>
                        </div>
                      </div>
                    ))}
                    <Button size="sm" icon={<Plus size={14} />} onClick={() => update({ items: [...draft.items, { id: newItemId(), label: '', required: true, requiresPhoto: false }] })}>Add item</Button>
                  </fieldset>

                  <div className="form__actions">
                    <Button variant="primary" disabled={!editable || !dirty || busy} onClick={save}>Save template</Button>
                    <Button variant="ghost" disabled={!dirty} onClick={() => { const orig = templates.find((t) => t.id === draft.id); if (orig) { setDraft(structuredClone(orig)); setDirty(false); } else { setActiveId(templates[0]?.id ?? null); } }}>Discard changes</Button>
                  </div>
                  {!editable && <Notice>Your demo role can view but not edit checklists.</Notice>}
                </div>
              )}
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
