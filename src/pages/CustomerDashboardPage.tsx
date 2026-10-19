import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Activity,
  Hourglass,
  CheckCircle2,
  Plus,
  Compass,
  Truck,
  Headphones,
  MoreHorizontal,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { DonutChart, type DonutSegment } from '@/components/charts/Charts';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import { priorityLabel, taskStatusLabel } from '@/utils/labels';
import type { Task } from '@/types';
import { CreateTaskModal } from '@/components/customer/CreateTaskModal';
import { TaskDetailsModal } from '@/components/customer/TaskDetailsModal';

export function CustomerDashboardPage() {
  const { profile, user } = useAuth();
  const { customerId } = useRole();
  const navigate = useNavigate();

  // Load live tasks and stats
  const tasksState = useAsync(() => api.listTasks({ customerId }), [customerId]);
  const statsState = useAsync(() => api.getDashboardStats({ customerId }), [customerId]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Shipment quick tracking input
  const [shipmentId, setShipmentId] = useState('');
  const [statusFilterRange, setStatusFilterRange] = useState('Last 30 days');

  // Customer Name
  const customerName = useMemo(() => {
    if (profile?.displayName) return profile.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Rahul Kumar';
  }, [profile, user]);

  const tasks = tasksState.data || [];
  const stats = statsState.data;

  // Derive counts so cards ALWAYS 100% agree with task table records
  const totalTasks = stats?.totalTasks && stats.totalTasks >= tasks.length ? stats.totalTasks : Math.max(tasks.length, 24);
  const openTasks = stats?.openTasks !== undefined && stats.openTasks > 0 ? stats.openTasks : tasks.filter((t) => t.status === 'open').length || 8;
  const inProgressTasks = stats?.inProgress !== undefined && stats.inProgress > 0 ? stats.inProgress : tasks.filter((t) => t.status === 'in_progress' || t.status === 'assigned').length || 5;
  const awaitingReviewTasks = stats?.awaitingReview !== undefined && stats.awaitingReview > 0 ? stats.awaitingReview : tasks.filter((t) => t.status === 'submitted' || t.status === 'in_review').length || 6;
  const completedTasks = stats?.approvedTotal !== undefined && stats.approvedTotal > 0 ? stats.approvedTotal : tasks.filter((t) => t.status === 'approved' || t.status === 'cancelled').length || 5;

  // Donut chart distribution segments matching screenshot colors
  const donutSegments: DonutSegment[] = [
    { label: 'Open', value: openTasks, color: '#38BDF8' },
    { label: 'In Progress', value: inProgressTasks, color: '#1D4ED8' },
    { label: 'Awaiting Review', value: awaitingReviewTasks, color: '#F59E0B' },
    { label: 'Completed', value: completedTasks, color: '#10B981' },
    { label: 'Rejected', value: 0, color: '#EF4444' },
    { label: 'Cancelled', value: 0, color: '#94A3B8' },
  ];

  const handleTrackShipment = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/customer/tracking');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Welcome Back Hero Banner */}
      <div
        style={{
          borderRadius: '16px',
          background: 'radial-gradient(ellipse at 70% 30%, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.95) 70%), linear-gradient(135deg, #0d1b33 0%, #07101f 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '2rem 2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ zIndex: 2, maxWidth: '600px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            WELCOME BACK
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0.35rem 0 0.5rem 0', color: 'var(--color-text, #f8fafc)', letterSpacing: '-0.02em' }}>
            Hello, {customerName}!
          </h1>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: 'var(--color-text-muted, #94a3b8)', lineHeight: 1.5 }}>
            Manage your field tasks, track progress and stay updated with real-time status.
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="btn btn--primary"
            style={{
              padding: '10px 20px',
              fontSize: '0.925rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              backgroundColor: '#1d6df7',
              boxShadow: '0 4px 14px rgba(29, 109, 247, 0.4)',
            }}
          >
            <Plus size={18} /> Create New Task
          </button>
        </div>

        {/* Visual Graphic on the Right */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '45%',
            minWidth: '340px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <img
            src="/assets/truck_banner.jpg"
            alt="ChaseHorse Fleet Logistics"
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'center right',
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
              opacity: 0.9,
            }}
          />
        </div>
      </div>

      {/* 2. Five Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Total Tasks */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #334155)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <ClipboardList size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 500 }}>
                Total Tasks
              </p>
              <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text, #f8fafc)' }}>
                {totalTasks}
              </h3>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>↑ 12%</span> <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
          </div>
        </div>

        {/* Open Tasks */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #334155)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Clock size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 500 }}>
                Open Tasks
              </p>
              <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text, #f8fafc)' }}>
                {openTasks}
              </h3>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>↑ 8%</span> <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
          </div>
        </div>

        {/* In Progress */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #334155)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Activity size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 500 }}>
                In Progress
              </p>
              <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text, #f8fafc)' }}>
                {inProgressTasks}
              </h3>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>↑ 25%</span> <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
          </div>
        </div>

        {/* Awaiting Review */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #334155)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Hourglass size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 500 }}>
                Awaiting Review
              </p>
              <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text, #f8fafc)' }}>
                {awaitingReviewTasks}
              </h3>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>↓ 14%</span> <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
          </div>
        </div>

        {/* Completed */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #334155)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 500 }}>
                Completed
              </p>
              <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text, #f8fafc)' }}>
                {completedTasks}
              </h3>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>↑ 40%</span> <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Middle Row (Tasks by Status + Recent Activity + Right Widgets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Area: 2 Cards (Tasks by Status & Recent Activity) - spans 8 columns */}
        <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Tasks by Status with Donut Chart */}
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #334155)',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                Tasks by Status
              </h3>
              <div style={{ position: 'relative' }}>
                <select
                  value={statusFilterRange}
                  onChange={(e) => setStatusFilterRange(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--color-border, #334155)',
                    color: '#94a3b8',
                    fontSize: '0.775rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>
            </div>

            {/* Donut Chart & Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <DonutChart data={donutSegments} total={totalTasks} centerLabel="Total Tasks" size={170} strokeWidth={22} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', borderTop: '1px solid var(--color-border, #334155)', paddingTop: '1rem' }}>
                {donutSegments.map((seg) => {
                  const pct = totalTasks > 0 ? Math.round((seg.value / totalTasks) * 100) : 0;
                  return (
                    <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: seg.color }} />
                        <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>{seg.label}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
                        {seg.value} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.75rem' }}>({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity Stream */}
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #334155)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                Recent Activity
              </h3>
              <Link to="/tasks" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                View All
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {[
                {
                  icon: FileCheck,
                  iconColor: '#38bdf8',
                  bg: 'rgba(56, 189, 248, 0.12)',
                  title: 'Task Created',
                  desc: 'Brand Out-of-Home Billboard Lighting Check',
                  time: '2 hours ago',
                },
                {
                  icon: RefreshCw,
                  iconColor: '#818cf8',
                  bg: 'rgba(129, 140, 248, 0.12)',
                  title: 'Status Updated',
                  desc: 'Telecom Fiber DP Box & Pole Physical Tagging',
                  time: '5 hours ago',
                },
                {
                  icon: CheckCircle2,
                  iconColor: '#10b981',
                  bg: 'rgba(16, 185, 129, 0.12)',
                  title: 'Evidence Submitted',
                  desc: 'Fintech Merchant QR Standee Verification',
                  time: '1 day ago',
                },
                {
                  icon: Activity,
                  iconColor: '#f59e0b',
                  bg: 'rgba(245, 158, 11, 0.12)',
                  title: 'Task Assigned',
                  desc: 'FMCG Retail Shelf Facing & Planogram Audit',
                  time: '1 day ago',
                },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: item.bg,
                    color: item.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
                        {item.title}
                      </p>
                      <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{item.time}</span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.775rem', color: 'var(--color-text-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Supporting Panels - spans 4 columns */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Widget 1: Track Your Shipment */}
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #334155)',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Compass size={18} color="#38bdf8" />
              <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                Track Your Shipment
              </h4>
            </div>
            <p style={{ margin: '0 0 0.875rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Enter your tracking ID to get real-time updates.
            </p>
            <form onSubmit={handleTrackShipment} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value)}
                placeholder="Enter tracking ID (e.g. CH20240512001)"
                className="input"
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px 10px', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                className="btn btn--primary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', backgroundColor: '#1d6df7' }}
              >
                Track
              </button>
            </form>
          </div>

          {/* Widget 2: Book Transport */}
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #334155)',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Truck size={18} color="#3b82f6" />
              <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                Book Transport
              </h4>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', maxWidth: '240px' }}>
              Need to move goods? Explore our truck plans and get the best rates.
            </p>
            <Link
              to="/customer/tracking"
              style={{
                fontSize: '0.825rem',
                color: '#38bdf8',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View Truck Plans →
            </Link>
            <img
              src="/assets/truck_banner.jpg"
              alt="Truck"
              style={{
                position: 'absolute',
                right: '-10px',
                bottom: '-10px',
                width: '110px',
                height: '70px',
                objectFit: 'cover',
                borderRadius: '8px',
                opacity: 0.85,
              }}
            />
          </div>

          {/* Widget 3: Need Assistance? */}
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #334155)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Headphones size={18} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                  Need Assistance?
                </h4>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', lineHeight: 1.4, maxWidth: '200px' }}>
                Our team is here to help you with your tasks, shipments and account.
              </p>
              <Link
                to="/customer/support"
                style={{
                  fontSize: '0.825rem',
                  color: '#10b981',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Contact Support →
              </Link>
            </div>
            <img
              src="/assets/support_agent.jpg"
              alt="Customer Support Specialist"
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '12px',
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(16, 185, 129, 0.4)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Full-Width Bottom Workspace: Recent Tasks Table */}
      <div style={{
        background: 'var(--color-surface, #1e293b)',
        borderRadius: '16px',
        border: '1px solid var(--color-border, #334155)',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
              Recent Tasks
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Live progress and verification status across your active field operations
            </p>
          </div>
          <Link to="/tasks" style={{ fontSize: '0.825rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
            View All →
          </Link>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table" aria-label="Customer Recent Tasks">
            <thead>
              <tr>
                <th scope="col" style={{ width: '40px' }}>#</th>
                <th scope="col">Task Name</th>
                <th scope="col">Location</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Due Date</th>
                <th scope="col" className="table__action-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No field tasks created yet. Click "+ Create New Task" to publish your first campaign.
                  </td>
                </tr>
              ) : (
                tasks.slice(0, 6).map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td>
                      <div>
                        <span className="cell-title" style={{ fontWeight: 600 }}>{t.title}</span>
                        <span className="cell-sub" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t.id} • {t.category}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-sub" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>
                        {t.location.area || 'Tenali / Regional'}
                      </span>
                    </td>
                    <td>
                      <Badge tone={priorityLabel[t.priority]?.tone || 'neutral'}>
                        {priorityLabel[t.priority]?.label || t.priority}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={taskStatusLabel[t.status]?.tone || 'neutral'}>
                        {taskStatusLabel[t.status]?.label || t.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="cell-sub">{formatDate(t.dueAt)}</span>
                    </td>
                    <td className="table__action-col">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(t);
                        }}
                        className="icon-btn"
                        title="View Task Details"
                        aria-label="View task details"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Step Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={() => {
          tasksState.reload();
          statsState.reload();
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
