import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hourglass,
  MapPin,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatDate, formatInr } from '@/utils/format';
import { priorityLabel } from '@/utils/labels';

interface ColumnDef {
  id: string;
  title: string;
  icon: typeof Clock;
  statuses: TaskStatus[];
  color: string;
}

const BOARD_COLUMNS: ColumnDef[] = [
  {
    id: 'col-open',
    title: 'Open / Unassigned',
    icon: Clock,
    statuses: ['open'],
    color: 'var(--blue)',
  },
  {
    id: 'col-assigned',
    title: 'Assigned',
    icon: UserCheck,
    statuses: ['assigned'],
    color: 'var(--blue-deep)',
  },
  {
    id: 'col-progress',
    title: 'In Progress',
    icon: Activity,
    statuses: ['in_progress'],
    color: 'var(--warn)',
  },
  {
    id: 'col-review',
    title: 'Under Review',
    icon: Hourglass,
    statuses: ['submitted', 'in_review'],
    color: 'var(--purple, #7c3aed)',
  },
  {
    id: 'col-rework',
    title: 'Flagged / Needs Attention',
    icon: AlertTriangle,
    statuses: ['rejected'],
    color: 'var(--bad)',
  },
  {
    id: 'col-approved',
    title: 'Approved',
    icon: CheckCircle2,
    statuses: ['approved'],
    color: 'var(--good)',
  },
];

interface TaskBoardProps {
  tasks: Task[];
  canAssign: boolean;
  onAssignTask: (task: Task) => void;
  employeeName: (id?: string) => string;
  customerName: (id?: string) => string;
}

export function TaskBoard({
  tasks,
  canAssign,
  onAssignTask,
  employeeName,
  customerName,
}: TaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columnTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of BOARD_COLUMNS) {
      map[col.id] = [];
    }

    for (const task of tasks) {
      let matched = false;
      for (const col of BOARD_COLUMNS) {
        if (col.statuses.includes(task.status)) {
          map[col.id].push(task);
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Fallback for rejected/cancelled or unexpected status
        map['col-open'].push(task);
      }
    }
    return map;
  }, [tasks]);

  const isOverdue = (dueAt: string, status: TaskStatus) => {
    if (status === 'approved') return false;
    return new Date(dueAt).getTime() < Date.now();
  };

  return (
    <>
      <div className="task-board" role="region" aria-label="Operations Task Board">
        {BOARD_COLUMNS.map((col) => {
          const list = columnTasks[col.id] || [];
          const Icon = col.icon;
          return (
            <div key={col.id} className="task-column">
              <div className="task-column__header">
                <div className="task-column__title">
                  <Icon size={16} style={{ color: col.color }} aria-hidden />
                  <span>{col.title}</span>
                </div>
                <span className="task-column__count">{list.length}</span>
              </div>

              <div className="task-column__list">
                {list.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      fontStyle: 'italic',
                    }}
                  >
                    No tasks in this stage
                  </div>
                ) : (
                  list.map((task) => {
                    const overdue = isOverdue(task.dueAt, task.status);
                    const assignee = task.assigneeId ? employeeName(task.assigneeId) : null;
                    return (
                      <div
                        key={task.id}
                        className="task-card"
                        tabIndex={0}
                        role="button"
                        onClick={() => setSelectedTask(task)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedTask(task);
                          }
                        }}
                        aria-label={`Task ${task.id}: ${task.title}`}
                      >
                        <div className="task-card__top">
                          <span className="task-card__id">{task.id}</span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {overdue && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: 'var(--bad)',
                                  fontWeight: 700,
                                  background: 'var(--danger-bg)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                Overdue
                              </span>
                            )}
                            <Badge tone={priorityLabel[task.priority as TaskPriority]?.tone || 'neutral'}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="task-card__title" title={task.title}>
                          {task.title}
                        </div>

                        <div className="task-card__meta">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} aria-hidden />
                            {task.location.area}
                          </span>
                        </div>

                        <div className="task-card__footer">
                          <span className="task-card__reward">{formatInr(task.rewardInr)}</span>
                          <div className="task-card__assignee">
                            {assignee ? (
                              <>
                                <Avatar name={assignee} size={20} />
                                <span title={assignee}>{assignee.split(' ')[0]}</span>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>

                        {canAssign && (task.status === 'open' || task.status === 'assigned') && (
                          <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '11px', height: '26px' }}
                              icon={<UserPlus size={12} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignTask(task);
                              }}
                            >
                              {task.assigneeId ? 'Reassign' : 'Assign Worker'}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Inspection Drawer / Modal */}
      <Dialog
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? `${selectedTask.id} · Details` : 'Task Details'}
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            {canAssign &&
              selectedTask &&
              (selectedTask.status === 'open' || selectedTask.status === 'assigned') && (
                <Button
                  variant="primary"
                  icon={<UserPlus size={14} />}
                  onClick={() => {
                    const t = selectedTask;
                    setSelectedTask(null);
                    onAssignTask(t);
                  }}
                >
                  {selectedTask.assigneeId ? 'Reassign Task' : 'Assign to Worker'}
                </Button>
              )}
            <Button variant="ghost" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedTask && (
          <div className="stack" style={{ gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
                {selectedTask.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                {selectedTask.description}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                background: 'var(--surface-2)',
                padding: '12px',
                borderRadius: 'var(--radius)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Category & Template
                </span>
                <strong style={{ fontSize: '13px' }}>{selectedTask.category}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Customer
                </span>
                <strong style={{ fontSize: '13px' }}>
                  {customerName(selectedTask.customerId)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Reward Payout
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--blue-deep)' }}>
                  {formatInr(selectedTask.rewardInr)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Due Deadline
                </span>
                <strong style={{ fontSize: '13px' }}>{formatDate(selectedTask.dueAt)}</strong>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Field Location & Address
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text)',
                }}
              >
                <MapPin size={16} style={{ color: 'var(--blue)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>{selectedTask.location.area}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {selectedTask.location.address || 'Standard GPS verified site'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Assignment Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedTask.assigneeId ? (
                  <>
                    <Avatar name={employeeName(selectedTask.assigneeId)} size={32} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px' }}>
                        {employeeName(selectedTask.assigneeId)}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--good)' }}>
                        Assigned Field Operator
                      </span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: 'var(--warn)', fontSize: '13px', fontWeight: 600 }}>
                    Unassigned — Awaiting operator allocation
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
