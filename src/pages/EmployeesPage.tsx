import { useMemo, useState } from 'react';
import { MapPin, Search, Shield, HardHat } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatDate } from '@/utils/format';
import { employeeApprovalLabel } from '@/utils/labels';
import type { Employee, EmployeeApprovalStatus, EmployeeSubRole } from '@/types';

const FILTERS: { value: EmployeeApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Staff' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Active & Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

export function EmployeesPage() {
  const { can } = useRole();
  const { notify } = useToast();
  const state = useAsync(() => api.listEmployees(), []);
  const [filter, setFilter] = useState<EmployeeApprovalStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignedRole, setAssignedRole] = useState<EmployeeSubRole>('field_worker');
  const [busy, setBusy] = useState(false);

  const list = state.data;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list?.length ?? 0, pending: 0, approved: 0, suspended: 0, rejected: 0 };
    list?.forEach((e) => {
      if (c[e.approvalStatus] !== undefined) c[e.approvalStatus] += 1;
    });
    return c;
  }, [list]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list ?? []).filter(
      (e) =>
        (filter === 'all' || e.approvalStatus === filter) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          e.region.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.phone && e.phone.includes(q))),
    );
  }, [list, filter, query]);

  const selected: Employee | undefined = list?.find((e) => e.id === selectedId);

  // Sync assigned role when opening modal
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedId(emp.id);
    setAssignedRole(emp.subRole || 'field_worker');
  };

  async function handleApprovalAction(status: EmployeeApprovalStatus, verb: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.setEmployeeApproval(selected.id, status, assignedRole);
      notify(`${selected.name} ${verb} as ${assignedRole === 'manager' ? 'Operations Manager' : 'On-Field Worker'}.`);
      state.reload();
      setSelectedId(null);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Update failed', 'info');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Field Workers & Operational Staff"
        description="Review registrations, assign roles (Operations Manager vs On-Field Worker), and manage activation approvals."
      />

      <Card>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Filter by approval status">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`segmented__btn ${filter === f.value ? 'segmented__btn--on' : ''}`}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label} <span className="segmented__count">{counts[f.value]}</span>
              </button>
            ))}
          </div>
          <div className="search">
            <Search size={16} aria-hidden />
            <label htmlFor="emp-search" className="sr-only">Search employees</label>
            <input
              id="emp-search"
              type="search"
              className="input input--search"
              placeholder="Search name, region or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Async state={state} skeletonLines={5}>
          {() =>
            visible.length === 0 ? (
              <EmptyState title="No employees match" description="Try a different filter or search term." />
            ) : (
              <div className="table-wrap">
                <table className="table" aria-label="Employees table">
                  <thead>
                    <tr>
                      <th scope="col">Staff Member</th>
                      <th scope="col">Assigned Role</th>
                      <th scope="col">Region</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Status</th>
                      <th scope="col">Joined</th>
                      <th scope="col" className="table__action-col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="person">
                            <Avatar name={e.name} size={36} />
                            <div>
                              <span className="cell-title">{e.name}</span>
                              <span className="cell-sub">{e.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: e.subRole === 'manager' ? '#93c5fd' : '#86efac',
                            background: e.subRole === 'manager' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}>
                            {e.subRole === 'manager' ? <Shield size={12} /> : <HardHat size={12} />}
                            {e.subRole === 'manager' ? 'Manager' : 'On-Field Worker'}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} /> {e.region}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub">{e.phone || '—'}</span>
                        </td>
                        <td>
                          <Badge tone={employeeApprovalLabel[e.approvalStatus].tone}>
                            {employeeApprovalLabel[e.approvalStatus].label}
                          </Badge>
                        </td>
                        <td>
                          <span className="cell-sub">{formatDate(e.joinedAt)}</span>
                        </td>
                        <td className="table__action-col">
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => handleSelectEmployee(e)}
                          >
                            Review / Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Async>
      </Card>

      {/* Review & Role Assignment Modal */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `${selected.name} — Review & Role Assignment` : 'Employee'}
        footer={
          selected && can('manageEmployees') ? (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
              {selected.approvalStatus !== 'approved' && (
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={() => handleApprovalAction('approved', selected.approvalStatus === 'suspended' ? 'reinstated' : 'approved')}
                >
                  ✓ Approve Account
                </Button>
              )}
              {selected.approvalStatus === 'approved' && (
                <>
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => handleApprovalAction('approved', 'updated')}
                  >
                    Save Role Assignment
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => handleApprovalAction('suspended', 'suspended')}
                  >
                    Suspend
                  </Button>
                </>
              )}
              {(selected.approvalStatus === 'pending' || selected.approvalStatus === 'approved') && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => handleApprovalAction('rejected', 'rejected')}
                >
                  Reject
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          )
        }
      >
        {selected && (
          <div className="stack">
            <div className="person person--lg">
              <Avatar name={selected.name} size={52} />
              <div>
                <Badge tone={employeeApprovalLabel[selected.approvalStatus].tone}>
                  {employeeApprovalLabel[selected.approvalStatus].label}
                </Badge>
                <p className="cell-sub">{selected.email} • {selected.phone}</p>
              </div>
            </div>

            {/* Role Assignment Option */}
            <div style={{
              background: 'var(--color-surface-sunken, #0f172a)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--color-border, #334155)',
            }}>
              <label className="field__label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Operational Role Assignment
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAssignedRole('field_worker')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: assignedRole === 'field_worker' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                    border: assignedRole === 'field_worker' ? '1px solid #22c55e' : '1px solid var(--color-border, #334155)',
                    color: assignedRole === 'field_worker' ? '#4ade80' : 'var(--color-text-muted, #94a3b8)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  <HardHat size={18} /> On-Field Worker
                </button>

                <button
                  type="button"
                  onClick={() => setAssignedRole('manager')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: assignedRole === 'manager' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: assignedRole === 'manager' ? '1px solid #3b82f6' : '1px solid var(--color-border, #334155)',
                    color: assignedRole === 'manager' ? '#60a5fa' : 'var(--color-text-muted, #94a3b8)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  <Shield size={18} /> Operations Manager
                </button>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                {assignedRole === 'field_worker'
                  ? 'On-field workers discover nearby range tasks, complete checklists, and submit geo-tagged camera evidence.'
                  : 'Operations Managers review task evidence, inspect AI validation results, and approve worker payouts.'}
              </p>
            </div>

            <dl className="defs">
              <div>
                <dt>Region</dt>
                <dd><MapPin size={14} /> {selected.region}</dd>
              </div>
              <div>
                <dt>Registered Date</dt>
                <dd>{formatDate(selected.joinedAt)}</dd>
              </div>
              <div>
                <dt>Tasks Completed</dt>
                <dd>{selected.tasksCompleted}</dd>
              </div>
              <div>
                <dt>Contact Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
    </>
  );
}
