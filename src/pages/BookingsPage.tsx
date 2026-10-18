import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Plus, Search } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader, Card } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import type { TmsShipmentStatus } from '@/types';

function statusTone(status: TmsShipmentStatus): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
      return 'warning';
    case 'DISPATCHED':
    case 'ASSIGNED':
      return 'info';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function BookingsPage() {
  const bookingsState = useAsync(() => api.listShipments(), []);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const list = bookingsState.data || [];
  const filtered = list.filter((b) => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesSearch =
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.originAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.cargoDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <PageHeader
        title="Transport Bookings"
        description="Manage enterprise freight bookings, transport plans, and consignment dispatches."
        actions={
          <Link to="/bookings/new" className="btn btn--primary btn--md">
            <Plus size={16} style={{ marginRight: '4px' }} /> New Booking
          </Link>
        }
      />

      <Card>
        <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by reference, route, or cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.875rem',
                color: 'var(--text)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['ALL', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`btn btn--sm ${filterStatus === st ? 'btn--primary' : 'btn--ghost'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <Async state={bookingsState}>
          {() =>
            filtered.length === 0 ? (
              <EmptyState
                title="No bookings found"
                description={
                  searchQuery || filterStatus !== 'ALL'
                    ? 'No shipments match your current filter criteria.'
                    : 'Get started by creating your first freight booking.'
                }
                action={
                  <Link to="/bookings/new" className="btn btn--primary btn--sm" style={{ marginTop: '0.75rem' }}>
                    <Plus size={14} style={{ marginRight: '4px' }} /> Create Booking
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap" role="region" aria-label="Bookings table" tabIndex={0}>
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <th scope="col">Booking Ref</th>
                      <th scope="col">Route</th>
                      <th scope="col">Cargo & Weight</th>
                      <th scope="col">Status</th>
                      <th scope="col">Total Price</th>
                      <th scope="col">Created Date</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id}>
                        <td data-label="Booking Ref">
                          <span className="cell-title">{b.bookingRef}</span>
                        </td>
                        <td data-label="Route">
                          <span className="cell-title">{b.originAddress}</span>
                          <span className="cell-sub">→ {b.destinationAddress}</span>
                        </td>
                        <td data-label="Cargo & Weight">
                          <span className="cell-title">{b.cargoDescription || 'General Cargo'}</span>
                          <span className="cell-sub">{b.cargoWeightKg} kg</span>
                        </td>
                        <td data-label="Status">
                          <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                        </td>
                        <td data-label="Total Price">
                          <strong>₹{b.totalPrice.toLocaleString()}</strong>
                        </td>
                        <td data-label="Created Date">
                          {formatDate(b.createdAt)}
                        </td>
                        <td data-label="Actions">
                          <Link
                            to={`/tracking/${b.bookingRef}`}
                            className="btn btn--ghost btn--sm"
                            title="View tracking milestones"
                          >
                            <Compass size={14} style={{ marginRight: '4px' }} /> Track
                          </Link>
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
