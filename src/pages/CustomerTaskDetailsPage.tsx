import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  FileCheck,
  Camera,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, Notice, ErrorState } from '@/components/ui/States';
import { formatDate, formatInr } from '@/utils/format';
import { priorityLabel, taskStatusLabel } from '@/utils/labels';
import type { TaskStatus } from '@/types';

// Milestone pipeline definition for tracking
interface MilestoneStep {
  statusKey: TaskStatus;
  label: string;
  description: string;
  icon: typeof Clock;
}

const MILESTONES: MilestoneStep[] = [
  {
    statusKey: 'open',
    label: 'Published',
    description: 'Task request broadcast to operational hub network',
    icon: Clock,
  },
  {
    statusKey: 'assigned',
    label: 'Assigned',
    description: 'Field worker matched and scheduled',
    icon: Activity,
  },
  {
    statusKey: 'in_progress',
    label: 'In Progress',
    description: 'Worker on-site executing verification checklist',
    icon: Activity,
  },
  {
    statusKey: 'submitted',
    label: 'Evidence Submitted',
    description: 'Geotagged photos & checklist uploaded for review',
    icon: FileCheck,
  },
  {
    statusKey: 'approved',
    label: 'Approved & Completed',
    description: 'Verification confirmed and bounty released',
    icon: CheckCircle2,
  },
];

export function CustomerTaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const { customerId: contextCustomerId } = useRole();
  const location = useLocation();

  // Active customer identifier
  const customerId = user?.id || profile?.id || contextCustomerId;

  // Load customer tasks
  const tasksState = useAsync(
    () => (customerId ? api.listTasks({ customerId }) : Promise.resolve([])),
    [customerId],
  );

  // Load checklists for template inspection
  const checklistsState = useAsync(() => api.listChecklists(), []);

  // 1. Unauthenticated gate: Block users who are not logged in
  if (!authLoading && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Auth loading state
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader title="Task Details" description="Resolving session..." />
        <Card>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  // 3. Network error state with retry option
  if (tasksState.error && tasksState.data === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title="Task Details"
          description="View task execution telemetry, status milestones, and verified evidence."
          actions={
            <Link to="/customer/tasks" className="btn btn--ghost btn--md">
              <span className="btn__icon" aria-hidden><ArrowLeft size={16} /></span>
              Back to My Tasks
            </Link>
          }
        />
        <Card>
          <ErrorState message={tasksState.error} onRetry={tasksState.reload} />
        </Card>
      </div>
    );
  }

  // 4. Data loading state
  if (tasksState.loading && tasksState.data === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title="Loading Task Details..."
          description="Fetching task telemetry and evidence from the server..."
        />
        <Card>
          <Skeleton lines={8} />
        </Card>
      </div>
    );
  }

  const allTasks = tasksState.data || [];
  const task = allTasks.find((t) => t.id === taskId);

  // 5. Not Found or Not Allowed check
  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title="Task Not Found"
          description="The requested task could not be located in your organization's records."
          actions={
            <Link to="/customer/tasks" className="btn btn--primary btn--md">
              <span className="btn__icon" aria-hidden><ArrowLeft size={16} /></span>
              Back to My Tasks
            </Link>
          }
        />
        <Card>
          <Notice tone="warning" title="Task Not Found">
            <p style={{ margin: 0 }}>
              Task ID <strong>{taskId}</strong> was not found. It may have been removed or does not exist.
            </p>
          </Notice>
        </Card>
      </div>
    );
  }

  // Verify ownership: Task must belong to the logged-in customer
  const isOwner =
    !task.customerId ||
    task.customerId === customerId ||
    task.customerId === user?.id ||
    task.customerId === profile?.id;

  if (!isOwner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title="Access Not Allowed"
          description="Security policy restricts viewing tasks from outside your customer workspace."
          actions={
            <Link to="/customer/tasks" className="btn btn--primary btn--md">
              <span className="btn__icon" aria-hidden><ArrowLeft size={16} /></span>
              Back to My Tasks
            </Link>
          }
        />
        <Card>
          <Notice tone="warning" title="Access Not Allowed">
            <p style={{ margin: 0 }}>
              You do not have permission to inspect task <strong>{task.id}</strong> because it belongs to another organization.
            </p>
          </Notice>
        </Card>
      </div>
    );
  }

  // Derive template details
  const templates = checklistsState.data || [];
  const checklist = templates.find((t) => t.id === task.checklistTemplateId);

  const statusInfo = taskStatusLabel[task.status] || { label: task.status, tone: 'neutral' };
  const priorityInfo = priorityLabel[task.priority] || { label: task.priority, tone: 'neutral' };

  // Calculate milestone index
  const statusIndexMap: Record<string, number> = {
    open: 0,
    assigned: 1,
    in_progress: 2,
    submitted: 3,
    in_review: 3,
    approved: 4,
    rejected: 3,
    cancelled: 0,
  };
  const currentStepIndex = statusIndexMap[task.status] ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={task.title}
        description={`Reference ID: ${task.id} • Posted by your organization`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link to="/customer/tasks" className="btn btn--secondary btn--md">
              <span className="btn__icon" aria-hidden><ArrowLeft size={16} /></span>
              Back to My Tasks
            </Link>
          </div>
        }
      />

      {/* Status & Lifecycle Tracking Pipeline */}
      <Card aria-labelledby="milestone-pipeline-title">
        <CardHeader
          id="milestone-pipeline-title"
          title="Execution Status & Progress Tracking"
          subtitle="Real-time operational status milestones across the task lifecycle"
          actions={<Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>}
        />

        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              position: 'relative',
            }}
          >
            {MILESTONES.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;

              let iconBg = 'var(--surface-2)';
              let iconColor = 'var(--text-faint)';
              let borderStyle = '1px solid var(--border)';

              if (isPast) {
                iconBg = 'var(--success-bg, #dcfce7)';
                iconColor = 'var(--success-fg, #15803d)';
                borderStyle = '1px solid var(--success-fg, #15803d)';
              } else if (isCurrent) {
                iconBg = 'var(--blue-soft, #e0f2fe)';
                iconColor = 'var(--blue, #0284c7)';
                borderStyle = '2px solid var(--blue, #0284c7)';
              }

              return (
                <div
                  key={step.statusKey}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    background: isCurrent ? 'var(--surface-hover)' : 'transparent',
                    border: borderStyle,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: iconBg,
                        color: iconColor,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isPast ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                    </div>
                    <span style={{ fontWeight: isCurrent ? 700 : 600, fontSize: '13.5px' }}>
                      {step.label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    {step.description}
                  </p>
                  {isCurrent && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--blue)' }}>
                      ● Active State
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Task Details Grid */}
      <div className="grid grid--form">
        {/* Left Column: Full Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card aria-labelledby="details-heading">
            <CardHeader
              id="details-heading"
              title="Task Information"
              subtitle="Full campaign scope and execution parameters"
            />

            <dl className="defs defs--wide">
              <div>
                <dt>Task ID</dt>
                <dd style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{task.id}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{task.category}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>
                  <Badge tone={priorityInfo.tone}>{priorityInfo.label}</Badge>
                </dd>
              </div>
              <div>
                <dt>Current Status</dt>
                <dd>
                  <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                </dd>
              </div>
              <div>
                <dt>Due Date</dt>
                <dd>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} aria-hidden />
                    {formatDate(task.dueAt)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Reward Payout</dt>
                <dd style={{ fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <IndianRupee size={14} aria-hidden />
                    {formatInr(task.rewardInr)}
                  </span>
                </dd>
              </div>
            </dl>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Instructions / Scope of Work
              </strong>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--text)' }}>
                {task.description || 'No special instructions provided.'}
              </p>
            </div>
          </Card>

          {/* Location Details */}
          <Card aria-labelledby="location-heading">
            <CardHeader
              id="location-heading"
              title="Operational Location & Geotag"
              subtitle="On-site GPS boundaries where field workers must check in"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={18} style={{ color: 'var(--blue)', marginTop: '2px', flexShrink: 0 }} aria-hidden />
                <div>
                  <strong style={{ fontSize: '14px' }}>{task.location?.area || 'Operational Area'}</strong>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {task.location?.address || 'Field Location Landmark'}
                  </p>
                </div>
              </div>

              {task.location?.lat && task.location?.lng && (
                <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                  Coordinates: {task.location.lat.toFixed(5)}, {task.location.lng.toFixed(5)}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Required Verification Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card aria-labelledby="checklist-spec-heading">
            <CardHeader
              id="checklist-spec-heading"
              title="Verification Checklist"
              subtitle={checklist ? checklist.name : 'Category Checklist'}
            />

            {checklistsState.loading ? (
              <Skeleton lines={4} />
            ) : checklist && checklist.items.length > 0 ? (
              <ol className="preview-list" style={{ listStylePosition: 'inside', paddingLeft: 0, margin: 0 }}>
                {checklist.items.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '13.5px',
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="chips" style={{ display: 'flex', gap: '4px' }}>
                      {item.required ? (
                        <span className="chip chip--strong">Required</span>
                      ) : (
                        <span className="chip">Optional</span>
                      )}
                      {item.requiresPhoto && (
                        <span className="chip chip--photo">
                          <Camera size={11} aria-hidden /> Photo Proof
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Standard verification checklist will be completed by the assigned field worker.
              </p>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--good, #10b981)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                  Enterprise Verification Guarantee
                </strong>
                Evidence uploaded by field workers undergoes GPS geo-fence validation, camera metadata cross-checking, and manager verification before final payout approval.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
