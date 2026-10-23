import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Plus, RotateCcw, Search, UserPlus } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField } from '@/components/ui/Fields';
import { formatDate, formatInr } from '@/utils/format';
import { haversineKm } from '@/utils/geo';
import { priorityLabel, taskStatusLabel, taskStatusOrder } from '@/utils/labels';
import { TaskBoard } from '@/components/operations/TaskBoard';
import type { Task, TaskStatus } from '@/types';

const ASSIGNABLE: TaskStatus[] = ['open', 'assigned'];

export function TasksPage() {
  const { role, customerId, can } = useRole();
  const { notify } = useToast();
  const isCustomer = role === 'customer';
  const state = useAsync(() => api.listTasks({ customerId }), [customerId]);
  const dir = useDirectory();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [assigning, setAssigning] = useState<Task | null>(null);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (state.data ?? [])
      .filter((t) => (status === 'all' || t.status === status) && (!q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.location.area.toLowerCase().includes(q)))
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [state.data, status, query]);

  const candidates = useMemo(() => {
    if (!assigning) return [];
    return dir.employees
      .filter((e) => e.approvalStatus === 'approved')
      .map((e) => ({ e, km: haversineKm(e.location, assigning.location) }))
      .sort((a, b) => a.km - b.km);
  }, [assigning, dir.employees]);

  async function confirmAssign() {
    if (!assigning || !pick) return;
    setBusy(true);
    try {
      await api.assignTask(assigning.id, pick);
      notify(`${assigning.id} assigned to ${dir.employeeName(pick)}.`);
      setAssigning(null);
      setPick('');
      state.reload();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Assignment failed', 'info');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isCustomer ? 'My requests' : 'Field Operations Task Board'}
        description={isCustomer ? 'Tasks requested by your organisation and their progress.' : 'Visual lifecycle management, employee assignment, and status dispatch.'}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="view-toggle" role="group" aria-label="Task layout view">
              <button
                type="button"
                className={`view-toggle__btn ${viewMode === 'board' ? 'view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode('board')}
                title="Kanban Board view"
                aria-pressed={viewMode === 'board'}
              >
                <LayoutGrid size={15} aria-hidden />
                <span>Board</span>
              </button>
              <button
                type="button"
                className={`view-toggle__btn ${viewMode === 'list' ? 'view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Table List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={15} aria-hidden />
                <span>List</span>
              </button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw size={14} />}
              onClick={state.reload}
              title="Refresh task records"
              aria-label="Refresh tasks"
            >
              Refresh
            </Button>
            {can('createTasks') && (
              <Link to="/tasks/new" className="btn btn--primary btn--md">
                <span className="btn__icon" aria-hidden><Plus size={16} /></span>
                Create task
              </Link>
            )}
          </div>
        }
      />

      <Card>
        <div className="toolbar">
          <div className="field-inline">
            <label htmlFor="task-status" className="field__label">Status</label>
            <select id="task-status" className="input input--compact" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | 'all')}>
              <option value="all">All statuses</option>
              {taskStatusOrder.map((s) => <option key={s} value={s}>{taskStatusLabel[s].label}</option>)}
            </select>
          </div>
          <div className="search">
            <Search size={16} aria-hidden />
            <label htmlFor="task-search" className="sr-only">Search tasks</label>
            <input id="task-search" type="search" className="input input--search" placeholder="Search title, ID or area" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <Async state={state} skeletonLines={6}>
          {() =>
            visible.length === 0 ? (
              <EmptyState title="No tasks found" description="Adjust your filters or search keywords to view tasks." />
            ) : viewMode === 'board' ? (
              <TaskBoard
                tasks={visible}
                canAssign={can('assignTasks')}
                onAssignTask={(t) => {
                  setAssigning(t);
                  setPick(t.assigneeId ?? '');
                }}
                employeeName={dir.employeeName}
                customerName={dir.customerName}
              />
            ) : (
              <div className="table-wrap" role="region" aria-label="Tasks" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Task</th>
                      {!isCustomer && <th scope="col">Customer</th>}
                      <th scope="col">Priority</th>
                      <th scope="col">Status</th>
                      <th scope="col">Assignee</th>
                      <th scope="col">Due</th>
                      {!isCustomer && <th scope="col" className="num">Reward</th>}
                      {can('assignTasks') && <th scope="col"><span className="sr-only">Actions</span></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Task">
                          <span className="cell-title">{t.title}</span>
                          <span className="cell-sub">{t.id} · {t.category} · {t.location.area}</span>
                        </td>
                        {!isCustomer && <td data-label="Customer">{dir.customerName(t.customerId)}</td>}
                        <td data-label="Priority"><Badge tone={priorityLabel[t.priority].tone}>{priorityLabel[t.priority].label}</Badge></td>
                        <td data-label="Status"><Badge tone={taskStatusLabel[t.status].tone}>{taskStatusLabel[t.status].label}</Badge></td>
                        <td data-label="Assignee">{t.assigneeId ? dir.employeeName(t.assigneeId) : <span className="muted">Unassigned</span>}</td>
                        <td data-label="Due">{formatDate(t.dueAt)}</td>
                        {!isCustomer && <td data-label="Reward" className="num">{formatInr(t.rewardInr)}</td>}
                        {can('assignTasks') && (
                          <td className="actions">
                            {ASSIGNABLE.includes(t.status) && (
                              <Button size="sm" icon={<UserPlus size={14} />} onClick={() => { setAssigning(t); setPick(t.assigneeId ?? ''); }} aria-label={`${t.assigneeId ? 'Reassign' : 'Assign'} ${t.title}`}>
                                {t.assigneeId ? 'Reassign' : 'Assign'}
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Async>
      </Card>

      <Dialog
        open={Boolean(assigning)}
        onClose={() => setAssigning(null)}
        title={assigning ? `Assign ${assigning.id}` : 'Assign task'}
        footer={
          <>
            <Button variant="primary" disabled={!pick || busy} onClick={confirmAssign}>Confirm assignment</Button>
            <Button variant="ghost" onClick={() => setAssigning(null)}>Cancel</Button>
          </>
        }
      >
        {assigning && (
          <div className="stack">
            <p className="muted">{assigning.title} · {assigning.location.area}</p>
            <SelectField label="Approved employee" hint="Sorted by distance to the task. Only approved employees can be assigned." value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Select an employee…</option>
              {candidates.map(({ e, km }) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {km.toFixed(1)} km · {e.availability === 'available' ? 'available' : e.availability === 'on_task' ? 'on a task' : 'offline'}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </Dialog>
    </>
  );
}
