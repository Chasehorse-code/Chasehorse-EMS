import { BarChart3, TrendingUp, CheckCircle, Clock, Download } from 'lucide-react';
import { PageHeader, Card, StatCard } from '@/components/ui/Card';

export function CustomerReportsPage() {
  const regionalMetrics = [
    { region: 'Tenali Urban Cluster', total: 14, completed: 12, sla: '98.2%' },
    { region: 'Guntur Industrial Corridor', total: 6, completed: 5, sla: '95.0%' },
    { region: 'Vijayawada Highway Outskirts', total: 4, completed: 4, sla: '100%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Field Operations & SLA Reports"
        description="Comprehensive audit volume, turnaround time compliance, and regional field verification statistics."
        actions={
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => alert('Exporting audit compliance summary CSV...')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Export CSV
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid--stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard icon={CheckCircle} tone="success" label="SLA Compliance Rate" value="97.4%" hint="Target SLA: 95%" />
        <StatCard icon={Clock} tone="brand" label="Avg Turnaround Time" value="3.8 hrs" hint="From publish to verified approval" />
        <StatCard icon={TrendingUp} tone="warning" label="First-Time Pass Rate" value="91.2%" hint="AI and Manager verification" />
        <StatCard icon={BarChart3} tone="ai" label="Active Operating Hubs" value="3 Hubs" hint="Krishna & Guntur districts" />
      </div>

      {/* Regional Performance Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
              Regional Field Execution Summary
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Aggregated across all posted audit campaigns
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Updated 10 mins ago</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Region / Cluster</th>
                <th className="num">Tasks Dispatched</th>
                <th className="num">Verified Completed</th>
                <th className="num">SLA Adherence</th>
              </tr>
            </thead>
            <tbody>
              {regionalMetrics.map((r) => (
                <tr key={r.region}>
                  <td><strong>{r.region}</strong></td>
                  <td className="num">{r.total}</td>
                  <td className="num">{r.completed}</td>
                  <td className="num" style={{ color: '#10b981', fontWeight: 600 }}>{r.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
