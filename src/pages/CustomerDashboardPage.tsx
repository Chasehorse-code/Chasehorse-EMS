import { useState, useMemo } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Activity,
  Hourglass,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '@/components/ui/States';
import { formatDate } from '@/utils/format';
import { priorityLabel, taskStatusLabel } from '@/utils/labels';
import type { Task } from '@/types';
import { CreateTaskModal } from '@/components/customer/CreateTaskModal';
import { TaskDetailsModal } from '@/components/customer/TaskDetailsModal';

export function CustomerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { customerId: contextCustomerId } = useRole();
  const location = useLocation();

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Derive active customer identity
  const customerId = user?.id || profile?.id || contextCustomerId;
  const customerName = useMemo(() => {
    if (profile?.displayName) return profile.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Customer';
  }, [profile, user]);

  // Load real customer tasks from shared API client
  const tasksState = useAsync(
    () => (customerId ? api.listTasks({ customerId }) : Promise.resolve([])),
    [customerId],
  );

  // 1. Unauthenticated gate: Redirect to login if user session is absent once resolved
  if (!authLoading && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Auth loading state
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader title="Customer Dashboard" description="Resolving session..." />
        <Card>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  // 3. Network error state (when initial load fails)
  if (tasksState.error && tasksState.data === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title={`Hello, ${customerName}`}
          description="Manage your field operations, track execution progress, and review live evidence."
        />
        <Card>
          <ErrorState message={tasksState.error} onRetry={tasksState.reload} />
        </Card>
      </div>
    );
  }

  // 4. Tasks data loading state
  if (tasksState.loading && tasksState.data === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title={`Hello, ${customerName}`}
          description="Manage your field operations, track execution progress, and review live evidence."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={i}>
              <Skeleton lines={2} />
            </Card>
          ))}
        </div>
        <Card>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  const tasks = tasksState.data || [];

  // 5. Empty state (when customer has 0 tasks)
  if (tasks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title={`Hello, ${customerName}!`}
          description="Manage your field operations, track execution progress, and review live evidence."
          actions={
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create New Task
            </Button>
          }
        />

        <Card>
          <EmptyState
            title="No field tasks yet"
            description="You have not created any field tasks yet. Post your first campaign to initiate store audits, surveys, or equipment checks."
            action={
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Your First Task
              </Button>
            }
          />
        </Card>

        <CreateTaskModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onTaskCreated={() => {
            tasksState.reload();
          }}
        />
      </div>
    );
  }

  // 6. Dynamic metrics calculated 100% from real task data (zero hardcoded numbers)
  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'open').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress' || t.status === 'assigned').length,
    underReview: tasks.filter((t) => t.status === 'submitted' || t.status === 'in_review').length,
    completed: tasks.filter((t) => t.status === 'approved').length,
  };

  // Recent tasks sorted by creation date or due date descending
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt || b.dueAt).getTime() - new Date(a.createdAt || a.dueAt).getTime())
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={`Hello, ${customerName}!`}
        description="Monitor field execution telemetry, track task statuses, and review verified evidence."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw size={14} className={tasksState.loading ? 'spin' : ''} />}
              onClick={() => tasksState.reload()}
              disabled={tasksState.loading}
              title="Refresh task data"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create New Task
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards derived from real counts by status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard
          icon={ClipboardList}
          tone="neutral"
          label="Total Tasks"
          value={stats.total}
          hint="All posted campaigns"
        />
        <StatCard
          icon={Clock}
          tone="brand"
          label="Open Tasks"
          value={stats.open}
          hint="Awaiting assignment"
        />
        <StatCard
          icon={Activity}
          tone="warning"
          label="In Progress"
          value={stats.inProgress}
          hint="Assigned or field active"
        />
        <StatCard
          icon={Hourglass}
          tone="ai"
          label="Under Review"
          value={stats.underReview}
          hint="Evidence submitted"
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          label="Completed"
          value={stats.completed}
          hint="Approved & verified"
        />
      </div>

      {/* Recent Tasks Card & Table */}
      <Card>
        <CardHeader
          title="Recent Tasks"
          subtitle="Latest updates from your posted field operations"
          actions={
            <Link to="/tasks" className="btn btn--secondary btn--sm">
              View All Tasks →
            </Link>
          }
        />

        <div className="table-wrap" role="region" aria-label="Customer Recent Tasks" tabIndex={0}>
          <table className="table table--stack">
            <thead>
              <tr>
                <th scope="col" style={{ width: '44px' }}>#</th>
                <th scope="col">Task Name</th>
                <th scope="col">Location Area</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Due Date</th>
                <th scope="col" className="actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((t, idx) => {
                const priorityInfo = priorityLabel[t.priority] || { label: t.priority, tone: 'neutral' };
                const statusInfo = taskStatusLabel[t.status] || { label: t.status, tone: 'neutral' };
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td data-label="#">{idx + 1}</td>
                    <td data-label="Task Name">
                      <div>
                        <span className="cell-title">{t.title}</span>
                        <span className="cell-sub">
                          {t.id} • {t.category}
                        </span>
                      </div>
                    </td>
                    <td data-label="Location Area">
                      <span className="cell-sub">{t.location?.area || t.location?.address || 'Field Location'}</span>
                    </td>
                    <td data-label="Priority">
                      <Badge tone={priorityInfo.tone}>
                        {priorityInfo.label}
                      </Badge>
                    </td>
                    <td data-label="Status">
                      <Badge tone={statusInfo.tone}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td data-label="Due Date">
                      <span className="cell-sub">{formatDate(t.dueAt)}</span>
                    </td>
                    <td data-label="Action" className="actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(t);
                        }}
                        className="icon-btn"
                        title="View Task Details"
                        aria-label={`View details for ${t.title}`}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={() => {
          tasksState.reload();
        }}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
