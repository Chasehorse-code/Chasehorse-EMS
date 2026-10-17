import { useMemo, useState } from 'react';
import { BadgeCheck, MapPin, Search, Star } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card } from '@/components/ui/Card';
import { Async, EmptyState, Notice } from '@/components/ui/States';
import { Badge, DemoTag } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatDate } from '@/utils/format';
import { availabilityLabel, employeeApprovalLabel } from '@/utils/labels';
import type { Employee, EmployeeApprovalStatus } from '@/types';

const FILTERS: { value: EmployeeApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
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
  const [busy, setBusy] = useState(false);

  const list = state.data;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list?.length ?? 0, pending: 0, approved: 0, suspended: 0, rejected: 0 };
    list?.forEach((e) => (c[e.approvalStatus] += 1));
    return c;
  }, [list]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list ?? []).filter(
      (e) =>
        (filter === 'all' || e.approvalStatus === filter) &&
        (!q || e.name.toLowerCase().includes(q) || e.region.toLowerCase().includes(q) || e.skills.some((s) => s.toLowerCase().includes(q))),
    );
  }, [list, filter, query]);

  const selected: Employee | undefined = list?.find((e) => e.id === selectedId);

  async function change(status: EmployeeApprovalStatus, verb: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.setEmployeeApproval(selected.id, status);
      notify(`${selected.name} ${verb} (demo state only — not saved).`);
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
        title="Employees"
        description="Manage field staff and their onboarding approval status."
        actions={<DemoTag />}
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
            <input id="emp-search" type="search" className="input input--search" placeholder="Search name, area or skill" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <Async state={state} skeletonLines={5}>
          {() =>
            visible.length === 0 ? (
              <EmptyState title="No employees match" description="Try a different filter or search term." />
            ) : (
              <div className="table-wrap" role="region" aria-label="Employees" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Employee</th>
                      <th scope="col">Region</th>
                      <th scope="col">Skills</th>
                      <th scope="col">Approval</th>
                      <th scope="col">Availability</th>
                      <th scope="col" className="num">Tasks</th>
                      <th scope="col" className="num">Rating</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => (
                      <tr key={e.id}>
                        <td data-label="Employee">
                          <div className="person">
                            <Avatar name={e.name} />
                            <div>
                              <span className="cell-title">{e.name}</span>
                              <span className="cell-sub">{e.email}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Region">{e.region}</td>
                        <td data-label="Skills">
                          <span className="chips">{e.skills.map((s) => <span key={s} className="chip">{s}</span>)}</span>
                        </td>
                        <td data-label="Approval"><Badge tone={employeeApprovalLabel[e.approvalStatus].tone}>{employeeApprovalLabel[e.approvalStatus].label}</Badge></td>
                        <td data-label="Availability"><Badge tone={availabilityLabel[e.availability].tone}>{availabilityLabel[e.availability].label}</Badge></td>
                        <td data-label="Tasks" className="num">{e.tasksCompleted}</td>
                        <td data-label="Rating" className="num">{e.rating > 0 ? e.rating.toFixed(1) : '—'}</td>
                        <td className="actions">
                          <Button size="sm" onClick={() => setSelectedId(e.id)} aria-label={`Review ${e.name}`}>Review</Button>
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

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? selected.name : 'Employee'}
        footer={
          selected && can('manageEmployees') ? (
            <>
              {selected.approvalStatus !== 'approved' && (
                <Button variant="success" disabled={busy || !selected.documentsVerified} onClick={() => change('approved', selected.approvalStatus === 'suspended' ? 'reinstated' : 'approved')}>
                  {selected.approvalStatus === 'suspended' ? 'Reinstate' : 'Approve'}
                </Button>
              )}
              {selected.approvalStatus === 'approved' && (
                <Button variant="secondary" disabled={busy} onClick={() => change('suspended', 'suspended')}>Suspend</Button>
              )}
              {(selected.approvalStatus === 'pending' || selected.approvalStatus === 'approved') && (
                <Button variant="danger" disabled={busy} onClick={() => change('rejected', 'rejected')}>Reject</Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="stack">
            <div className="person person--lg">
              <Avatar name={selected.name} size={52} />
              <div>
                <Badge tone={employeeApprovalLabel[selected.approvalStatus].tone}>{employeeApprovalLabel[selected.approvalStatus].label}</Badge>
                <p className="cell-sub">{selected.email} · {selected.phone}</p>
              </div>
            </div>
            <dl className="defs">
              <div><dt>Region</dt><dd><MapPin size={14} aria-hidden /> {selected.region}</dd></div>
              <div><dt>Joined</dt><dd>{formatDate(selected.joinedAt)}</dd></div>
              <div><dt>Tasks completed</dt><dd>{selected.tasksCompleted}</dd></div>
              <div><dt>Rating</dt><dd><Star size={14} aria-hidden /> {selected.rating > 0 ? selected.rating.toFixed(1) : 'No ratings yet'}</dd></div>
              <div>
                <dt>Documents</dt>
                <dd>{selected.documentsVerified ? <><BadgeCheck size={14} aria-hidden /> Verified (sample)</> : 'Not verified'}</dd>
              </div>
              <div><dt>Skills</dt><dd>{selected.skills.join(', ')}</dd></div>
            </dl>
            {!selected.documentsVerified && selected.approvalStatus !== 'approved' && (
              <Notice tone="warning" title="Approval blocked">
                Identity documents aren’t verified for this person, so approval is disabled — mirroring the check a real onboarding flow would enforce.
              </Notice>
            )}
            {!can('manageEmployees') && <Notice>Your demo role can view employees but not change approval status.</Notice>}
            <p className="muted small">Changes here live in browser memory only and reset on refresh.</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
