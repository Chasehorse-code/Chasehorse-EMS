import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, ClipboardList, Clock, Hourglass, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useRole } from '@/context/RoleContext';
import { PageHeader, Card, CardHeader, StatCard } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { BarList, TrendChart } from '@/components/charts/Charts';
import { formatDate } from '@/utils/format';
import { priorityLabel, taskStatusLabel, taskStatusOrder } from '@/utils/labels';
import { CustomerDashboardPage } from '@/pages/CustomerDashboardPage';

export function OverviewPage() {
  const { role, customerId, can } = useRole();
  const isCustomer = role === 'customer';

  if (isCustomer) {
    return <CustomerDashboardPage />;
  }

  const stats = useAsync(() => api.getDashboardStats({ customerId }), [customerId]);
  const tasks = useAsync(() => api.listTasks({ customerId }), [customerId]);
  const evidence = useAsync(() => api.listEvidence({ customerId }), [customerId]);
  const dir = useDirectory();

  const awaitingManager = evidence.data?.filter((e) => e.managerDecision.status === 'pending').length;

  return (
    <>
      <PageHeader
        title="Operations Overview"
        description={
          isCustomer
            ? 'Real-time status of your service requests and shipments.'
            : 'Operational dashboard for field tasks, workforce, and transport execution.'
        }
        actions={
          can('createTasks') ? (
            <Link to="/tasks/new" className="btn btn--primary btn--md">
              Create task
            </Link>
          ) : undefined
        }
      />

      <Async state={stats} skeletonLines={3}>
        {(s) => (
          <>
            <div className="grid grid--stats" aria-label="Task statistics">
              <StatCard icon={ClipboardList} label={isCustomer ? 'Your requests' : 'Total tasks'} value={s.totalTasks} hint="All statuses" />
              <StatCard icon={Clock} tone="brand" label="Open" value={s.openTasks} hint="Not yet assigned" />
              <StatCard icon={Activity} tone="warning" label="In progress" value={s.inProgress} hint="Assigned or underway" />
              <StatCard icon={Hourglass} tone="warning" label="Awaiting review" value={s.awaitingReview} hint="Evidence submitted" />
              <StatCard icon={CheckCircle2} tone="success" label="Approved" value={s.approvedTotal} hint="Manager approved" />
              {!isCustomer && (
                <StatCard icon={Users} tone="ai" label="Active employees" value={s.activeEmployees} hint={`${s.pendingEmployeeApprovals} awaiting approval`} />
              )}
            </div>

            <div className="grid grid--two">
              <Card aria-labelledby="by-status">
                <CardHeader id="by-status" title="Tasks by status" subtitle={isCustomer ? 'Your requests' : 'All customers'} />
                <BarList
                  ariaLabel="Number of tasks per status"
                  data={taskStatusOrder.map((st) => ({
                    label: taskStatusLabel[st].label,
                    value: s.byStatus[st],
                    tone: taskStatusLabel[st].tone,
                  }))}
                />
              </Card>

              {!isCustomer ? (
                <Card aria-labelledby="trend">
                  <CardHeader id="trend" title="Created vs completed" subtitle="Last 14 days · sample series" />
                  <TrendChart data={s.completionTrend} />
                </Card>
              ) : (
                <Card aria-labelledby="your-evidence">
                  <CardHeader id="your-evidence" title="Evidence on your tasks" />
                  <p className="muted">
                    <Link to="/evidence">Review submitted photo evidence</Link> for your completed tasks. Your view is read-only.
                  </p>
                </Card>
              )}
            </div>

            {!isCustomer && (
              <Card aria-labelledby="attention">
                <CardHeader id="attention" title="Needs attention" subtitle="Queues waiting on a person" />
                <ul className="attention">
                  {can('manageEmployees') && (
                    <li>
                      <UserCheck size={18} aria-hidden />
                      <span><strong>{s.pendingEmployeeApprovals}</strong> employees pending approval</span>
                      <Link to="/employees">Review</Link>
                    </li>
                  )}
                  <li>
                    <Hourglass size={18} aria-hidden />
                    <span><strong>{awaitingManager ?? '…'}</strong> evidence submissions awaiting a manager decision</span>
                    <Link to="/evidence">Open evidence</Link>
                  </li>
                  {can('decideApprovals') && (
                    <li>
                      <ShieldCheck size={18} aria-hidden />
                      <span><strong>{s.awaitingOps}</strong> items in the operations approval queue</span>
                      <Link to="/approvals">Open queue</Link>
                    </li>
                  )}
                </ul>
              </Card>
            )}
          </>
        )}
      </Async>

      <Card aria-labelledby="recent">
        <CardHeader id="recent" title="Recent tasks" actions={<Link to="/tasks" className="link-btn">View all</Link>} />
        <Async state={tasks} skeletonLines={4}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState
                title="No tasks created yet"
                description="Create your first operations task or wait for incoming client requests."
                action={
                  can('createTasks') ? (
                    <Link to="/tasks/new" className="btn btn--primary btn--sm" style={{ marginTop: '0.75rem' }}>
                      Create first task
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="table-wrap" role="region" aria-label="Recent tasks" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Task</th>
                      {!isCustomer && <th scope="col">Customer</th>}
                      <th scope="col">Priority</th>
                      <th scope="col">Status</th>
                      <th scope="col">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...list]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
                      .slice(0, 6)
                      .map((t) => (
                        <tr key={t.id}>
                          <td data-label="Task">
                            <span className="cell-title">{t.title}</span>
                            <span className="cell-sub">{t.id} · {t.location.area}</span>
                          </td>
                          {!isCustomer && <td data-label="Customer">{dir.customerName(t.customerId)}</td>}
                          <td data-label="Priority"><Badge tone={priorityLabel[t.priority].tone}>{priorityLabel[t.priority].label}</Badge></td>
                          <td data-label="Status"><Badge tone={taskStatusLabel[t.status].tone}>{taskStatusLabel[t.status].label}</Badge></td>
                          <td data-label="Due">{formatDate(t.dueAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Async>
      </Card>
    </>
  );
}
