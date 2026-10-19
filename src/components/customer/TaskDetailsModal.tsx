import { X, MapPin, Calendar, Shield } from 'lucide-react';
import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { priorityLabel, taskStatusLabel } from '@/utils/labels';
import { formatDate } from '@/utils/format';

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  if (!task) return null;

  const steps = [
    { label: 'Created', done: true, current: task.status === 'open' },
    { label: 'Assigned', done: task.status !== 'open', current: task.status === 'assigned' },
    { label: 'In Progress', done: ['in_progress', 'submitted', 'in_review', 'approved'].includes(task.status), current: task.status === 'in_progress' },
    { label: 'Evidence Submitted', done: ['submitted', 'in_review', 'approved'].includes(task.status), current: task.status === 'submitted' || task.status === 'in_review' },
    { label: 'Approved & Completed', done: task.status === 'approved', current: task.status === 'approved' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 24, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fade 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                {task.id}
              </span>
              <Badge tone={taskStatusLabel[task.status]?.tone || 'neutral'}>
                {taskStatusLabel[task.status]?.label || task.status}
              </Badge>
              <Badge tone={priorityLabel[task.priority]?.tone || 'neutral'}>
                {priorityLabel[task.priority]?.label || task.priority} Priority
              </Badge>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            style={{ color: 'var(--color-text-muted, #94a3b8)', padding: '6px', cursor: 'pointer' }}
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Task Lifecycle Timeline */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid var(--color-border, #334155)',
          marginBottom: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lifecycle Status Track
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {steps.map((st, i) => (
              <div key={st.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: st.done ? '#10b981' : st.current ? '#3b82f6' : '#334155',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: st.current ? '0 0 0 4px rgba(59, 130, 246, 0.25)' : undefined,
                }}>
                  {st.done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  marginTop: '6px',
                  color: st.done || st.current ? 'var(--color-text, #f8fafc)' : '#64748b',
                  fontWeight: st.current ? 700 : 500,
                  textAlign: 'center',
                }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted, #94a3b8)', margin: '0 0 4px 0' }}>
            Task Objective & Description
          </p>
          <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--color-text, #f8fafc)', lineHeight: 1.5 }}>
            {task.description || 'No additional instructions provided for this field assignment.'}
          </p>
        </div>

        {/* Grid Meta Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.875rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border, #334155)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
              <MapPin size={15} /> Operational Location
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
              {task.location.area || 'Designated Area'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              {task.location.address || 'Field Location, Tenali, Andhra Pradesh'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
              GPS: {task.location.lat.toFixed(4)}°N, {task.location.lng.toFixed(4)}°E (±50m geo-fence)
            </p>
          </div>

          <div style={{ padding: '0.875rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border, #334155)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
              <Calendar size={15} /> Execution Schedule & SLA
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
              Target Deadline: {formatDate(task.dueAt)}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Created: {formatDate(task.createdAt)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                Allocated Reward: ₹{task.rewardInr}
              </span>
            </div>
          </div>
        </div>

        {/* Verification & Evidence Notice */}
        <div style={{
          padding: '0.875rem',
          borderRadius: '10px',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '1.25rem',
        }}>
          <Shield size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
            <strong style={{ color: '#e2e8f0' }}>Customer Review Permissions:</strong> Per ChaseHorse implementation blueprint, customer accounts have view-only access to audit logs and verified photographic evidence once uploaded by assigned field staff.
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '1rem', borderTop: '1px solid var(--color-border, #334155)' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--secondary"
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
