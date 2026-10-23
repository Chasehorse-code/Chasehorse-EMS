import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowRight,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '@/components/ui/States';
import { formatDate } from '@/utils/format';
import { priorityLabel, taskStatusLabel, taskStatusOrder } from '@/utils/labels';
import type { TaskStatus } from '@/types';

export function CustomerTasksPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { customerId: contextCustomerId } = useRole();
  const location = useLocation();

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active customer identifier
  const customerId = user?.id || profile?.id || contextCustomerId;

  // Load tasks for active customer from shared API client
  const tasksState = useAsync(
    () => (customerId ? api.listTasks({ customerId }) : Promise.resolve([])),
    [customerId],
  );

  // 1. Unauthenticated gate: Block users who are not logged in
  if (!authLoading && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Auth loading state
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader title="My Tasks" description="Loading your profile..." />
        <Card>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  // 3. Network error state
  if (tasksState.error && tasksState.data === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title="My Tasks"
          description="Track and inspect the live execution status of all your field operations."
        />
        <Card>
          <ErrorState message={tasksState.error} onRetry={tasksState.reload} />
        </Card>
      </div>
    );
  }

  const rawTasks = tasksState.data || [];

  // Filter strictly to logged-in customer's tasks
  const customerTasks = rawTasks.filter((t) => {
    if (!customerId) return true;
    return !t.customerId || t.customerId === customerId || t.customerId === user?.id || t.customerId === profile?.id;
  });

  // Apply search & status filters
  const filteredTasks = customerTasks
    .filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.location?.area || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt || b.dueAt).getTime() - new Date(a.createdAt || a.dueAt).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <PageHeader
        title="My Tasks"
        description="Monitor field execution telemetry, task lifecycles, and verification milestones for your campaigns."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw size={14} className={tasksState.loading ? 'spin' : ''} />}
              onClick={() => tasksState.reload()}
              disabled={tasksState.loading}
              title="Refresh task list"
            >
              Refresh
            </Button>
            <Link to="/tasks/new" className="btn btn--primary btn--md">
              <span className="btn__icon" aria-hidden>
                <Plus size={16} />
              </span>
              Create Task
            </Link>
          </div>
        }
      />

      <Card>
        {/* Filters and Search Toolbar */}
        <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} aria-hidden />
            <label htmlFor="task-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="task-status-filter"
              className="input input--compact"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            >
              <option value="all">All statuses ({customerTasks.length})</option>
              {taskStatusOrder.map((s) => {
                const count = customerTasks.filter((t) => t.status === s).length;
                return (
                  <option key={s} value={s}>
                    {taskStatusLabel[s].label} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="search" style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden />
            <label htmlFor="task-search-input" className="sr-only">
              Search tasks
            </label>
            <input
              id="task-search-input"
              type="search"
              className="input input--search"
              placeholder="Search title, ID, category or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* 4. Loading state */}
        {tasksState.loading && tasksState.data === undefined ? (
          <Skeleton lines={6} />
        ) : customerTasks.length === 0 ? (
          /* 5. Empty state when customer has no tasks */
          <EmptyState
            title="No field tasks yet"
            description="You have not published any field operations yet. Create your first task to start collecting verified evidence."
            action={
              <Link to="/tasks/new" className="btn btn--primary btn--md">
                <span className="btn__icon" aria-hidden>
                  <Plus size={16} />
                </span>
                Create Your First Task
              </Link>
            }
          />
        ) : filteredTasks.length === 0 ? (
          /* Filtered empty state */
          <EmptyState
            title="No tasks match your filters"
            description="Try clearing your search query or selecting 'All statuses'."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : (
          /* 6. Tasks Table */
          <div className="table-wrap" role="region" aria-label="Customer Tasks Table" tabIndex={0}>
            <table className="table table--stack">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '44px' }}>#</th>
                  <th scope="col">Task Details</th>
                  <th scope="col">Operational Location</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Due Date</th>
                  <th scope="col" className="actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, idx) => {
                  const statusInfo = taskStatusLabel[task.status] || { label: task.status, tone: 'neutral' };
                  const priorityInfo = priorityLabel[task.priority] || { label: task.priority, tone: 'neutral' };
                  return (
                    <tr key={task.id}>
                      <td data-label="#">{idx + 1}</td>
                      <td data-label="Task Details">
                        <Link
                          to={`/customer/tasks/${task.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <span className="cell-title" style={{ fontWeight: 600 }}>{task.title}</span>
                          <span className="cell-sub">
                            {task.id} • {task.category}
                          </span>
                        </Link>
                      </td>
                      <td data-label="Operational Location">
                        <div>
                          <span className="cell-title" style={{ fontSize: '13px' }}>
                            {task.location?.area || 'Operational Area'}
                          </span>
                          <span className="cell-sub" style={{ fontSize: '12px' }}>
                            {task.location?.address || 'Field Location'}
                          </span>
                        </div>
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
                        <span className="cell-sub">{formatDate(task.dueAt)}</span>
                      </td>
                      <td data-label="Action" className="actions">
                        <Link
                          to={`/customer/tasks/${task.id}`}
                          className="btn btn--secondary btn--sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title={`View details for ${task.title}`}
                        >
                          <span>Details</span>
                          <ArrowRight size={14} aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
