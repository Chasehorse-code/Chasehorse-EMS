import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';

export function TruckPlansPage() {
  const plansState = useAsync(() => api.listTransportPlans(), []);
  const vehiclesState = useAsync(() => api.listVehicles(), []);

  return (
    <>
      <PageHeader
        title="Fleet Transport Plans & Vehicles"
        description="Active logistics service plans, tonnage payload limits, and certified fleet capacity."
        actions={
          <Link to="/bookings/new" className="btn btn--primary btn--md">
            <Plus size={16} style={{ marginRight: '4px' }} /> Book Transport
          </Link>
        }
      />

      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader
          title="Standard Transport Plans"
          subtitle="Pre-configured commercial freight plans for express, bulk, and cold chain movement"
        />

        <Async state={plansState}>
          {(plans) =>
            plans.length === 0 ? (
              <EmptyState
                title="No transport plans available"
                description="Fleet operations has not registered any active plans."
              />
            ) : (
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
                {plans.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'var(--surface)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                      {p.vehicleType}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0', color: 'var(--text)' }}>
                      {p.planName}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', flex: 1 }}>
                      {p.description}
                    </p>

                    <div style={{ background: 'var(--surface-2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
                        ₹{Number(p.baseRateInr).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        base + ₹{p.ratePerKmInr}/km
                      </span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} color="var(--success)" />
                        <span>Payload: <strong>{p.maxCapacityKg} kg</strong> max</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--primary-blue)" />
                        <span>SLA: <strong>{p.estimatedHours} Hours</strong></span>
                      </li>
                    </ul>

                    <Link
                      to={`/bookings/new?planId=${p.id}`}
                      className="btn btn--primary btn--sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Book with this Plan <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </Link>
                  </div>
                ))}
              </div>
            )
          }
        </Async>
      </Card>

      <Card>
        <CardHeader
          title="Registered Fleet Vehicles"
          subtitle="Commercial vehicles available for route allocation and transport execution"
        />

        <Async state={vehiclesState}>
          {(vehicles) =>
            vehicles.length === 0 ? (
              <EmptyState
                title="No fleet vehicles registered"
                description="Commercial transport vehicles will appear here once added to the fleet inventory."
              />
            ) : (
              <div className="table-wrap" role="region" aria-label="Fleet vehicles table" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Registration</th>
                      <th scope="col">Vehicle Type</th>
                      <th scope="col">Capacity</th>
                      <th scope="col">Make & Model</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td data-label="Registration">
                          <strong className="cell-title">{v.registrationNumber}</strong>
                        </td>
                        <td data-label="Vehicle Type">
                          {v.vehicleType}
                        </td>
                        <td data-label="Capacity">
                          {v.capacityKg} kg
                        </td>
                        <td data-label="Make & Model">
                          {v.make} {v.model}
                        </td>
                        <td data-label="Status">
                          <Badge tone={v.status === 'AVAILABLE' ? 'success' : 'neutral'}>
                            {v.status}
                          </Badge>
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
    </>
  );
}
