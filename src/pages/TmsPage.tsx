import { useState, type FormEvent } from 'react';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Shield,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';

interface Shipment {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  vehiclePlate: string;
  driverName: string;
  status: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELAYED';
  weightKg: number;
  estDelivery: string;
  priority: 'NORMAL' | 'EXPRESS' | 'CRITICAL';
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: 'HEAVY_TRUCK' | 'MEDIUM_VAN' | 'ELECTRIC_CARGO' | 'REEFER';
  driver: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'IDLE';
  fuelLevel: number;
  currentLocation: string;
}

const initialShipments: Shipment[] = [
  {
    id: 'shp-101',
    trackingNumber: 'CH-TRK-8821',
    sender: 'AeroTech Components Bangalore',
    recipient: 'Bharat Heavy Dynamics Hyderabad',
    origin: 'Bangalore Hub A',
    destination: 'Hyderabad Terminal 2',
    vehiclePlate: 'KA-01-MJ-9921',
    driverName: 'Vikramaditya Rao',
    status: 'IN_TRANSIT',
    weightKg: 1250,
    estDelivery: 'Today, 22:30',
    priority: 'EXPRESS',
  },
  {
    id: 'shp-102',
    trackingNumber: 'CH-TRK-8822',
    sender: 'FreshFarm Organics Pune',
    recipient: 'Star Retail Hypermarket Mumbai',
    origin: 'Pune Cold Storage Hub',
    destination: 'Mumbai Navi Port DC',
    vehiclePlate: 'MH-12-QC-4012',
    driverName: 'Suresh Patil',
    status: 'OUT_FOR_DELIVERY',
    weightKg: 850,
    estDelivery: 'Today, 18:45',
    priority: 'CRITICAL',
  },
  {
    id: 'shp-103',
    trackingNumber: 'CH-TRK-8823',
    sender: 'SolarPower Inverters Chennai',
    recipient: 'InfraGrid Greenfields Kochi',
    origin: 'Chennai Guindy Warehouse',
    destination: 'Kochi Marine Complex',
    vehiclePlate: 'TN-09-BK-1108',
    driverName: 'Murugan Pillai',
    status: 'DISPATCHED',
    weightKg: 3400,
    estDelivery: 'Tomorrow, 14:00',
    priority: 'NORMAL',
  },
  {
    id: 'shp-104',
    trackingNumber: 'CH-TRK-8824',
    sender: 'Apex Pharma Solan',
    recipient: 'Apollo Logistics Depot Delhi',
    origin: 'Baddi Industrial Area',
    destination: 'Okhla Phase III Depot',
    vehiclePlate: 'HP-12-AA-7744',
    driverName: 'Harjit Singh',
    status: 'DELIVERED',
    weightKg: 420,
    estDelivery: 'Completed at 14:15',
    priority: 'EXPRESS',
  },
];

const initialVehicles: Vehicle[] = [
  {
    id: 'veh-01',
    plateNumber: 'KA-01-MJ-9921',
    model: 'Tata Prima 4028',
    type: 'HEAVY_TRUCK',
    driver: 'Vikramaditya Rao',
    status: 'ACTIVE',
    fuelLevel: 78,
    currentLocation: 'NH 44, Kurnool Corridor',
  },
  {
    id: 'veh-02',
    plateNumber: 'MH-12-QC-4012',
    model: 'Ashok Leyland Dost Reefer',
    type: 'REEFER',
    driver: 'Suresh Patil',
    status: 'ACTIVE',
    fuelLevel: 62,
    currentLocation: 'Mumbai Expressway Toll 3',
  },
  {
    id: 'veh-03',
    plateNumber: 'TN-09-BK-1108',
    model: 'BharatBenz 2823R',
    type: 'HEAVY_TRUCK',
    driver: 'Murugan Pillai',
    status: 'ACTIVE',
    fuelLevel: 89,
    currentLocation: 'Salem Transit Junction',
  },
  {
    id: 'veh-04',
    plateNumber: 'DL-01-EE-3390',
    model: 'Mahindra Zor Grand Electric',
    type: 'ELECTRIC_CARGO',
    driver: 'Kunal Verma',
    status: 'IDLE',
    fuelLevel: 94,
    currentLocation: 'Delhi Central Hub Yard',
  },
];

export function TmsPage() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'fleet'>('shipments');
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Booking Form State
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newSender, setNewSender] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newWeight, setNewWeight] = useState('500');
  const [newPriority, setNewPriority] = useState<'NORMAL' | 'EXPRESS' | 'CRITICAL'>('NORMAL');

  const handleCreateBooking = (e: FormEvent) => {
    e.preventDefault();
    const newShp: Shipment = {
      id: `shp-${Date.now()}`,
      trackingNumber: `CH-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      sender: newSender || 'Corporate Dispatch',
      recipient: newRecipient || 'Consignee Enterprise',
      origin: newOrigin || 'Central Hub',
      destination: newDestination || 'Regional Center',
      vehiclePlate: vehicles[0].plateNumber,
      driverName: vehicles[0].driver,
      status: 'DISPATCHED',
      weightKg: Number(newWeight) || 500,
      estDelivery: 'In 24 Hours',
      priority: newPriority,
    };
    setShipments([newShp, ...shipments]);
    setIsModalOpen(false);
    setNewOrigin('');
    setNewDestination('');
    setNewSender('');
    setNewRecipient('');
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.driverName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge tone="success">Delivered</Badge>;
      case 'IN_TRANSIT':
        return <Badge tone="info">In Transit</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge tone="warning">Out for Delivery</Badge>;
      case 'DISPATCHED':
        return <Badge tone="neutral">Dispatched</Badge>;
      case 'DELAYED':
        return <Badge tone="danger">Delayed</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  const liveCount = shipments.filter(
    (s) => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY',
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
            Transport Management System (TMS)
          </h1>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', margin: 0, fontSize: '0.9rem' }}>
            Fleet routing, multi-modal dispatch, consignment tracking & real-time delivery checkpoints.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Transport Consignment
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          label="Active Fleet Units"
          value={`${vehicles.length} Vehicles`}
          icon={Truck}
          tone="brand"
        />
        <StatCard
          label="In-Transit Shipments"
          value={`${liveCount} Live`}
          icon={Package}
          tone="warning"
        />
        <StatCard
          label="On-Time SLA Delivery"
          value="99.2%"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Security Escort Rating"
          value="Level 4 (GPS Lock)"
          icon={Shield}
          tone="ai"
        />
      </div>

      {/* Tabs & Search Controls */}
      <Card>
        <CardHeader
          title="Transport Consignments & Fleet Overview"
          subtitle="Real-time freight telemetry, vehicle health, and delivery timelines"
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button
                variant={activeTab === 'shipments' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('shipments')}
              >
                <Package size={16} /> Shipments ({shipments.length})
              </Button>
              <Button
                variant={activeTab === 'fleet' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('fleet')}
              >
                <Truck size={16} /> Fleet ({vehicles.length})
              </Button>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Filter shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 32px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #334155)',
                    background: 'var(--color-surface-sunken, #0f172a)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          }
        />

        <div style={{ padding: '1rem 0 0 0' }}>
          {activeTab === 'shipments' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border, #334155)', background: 'var(--color-surface-sunken, #0f172a)', color: 'var(--color-text-muted, #94a3b8)' }}>
                    <th style={{ padding: '12px 16px' }}>Tracking #</th>
                    <th style={{ padding: '12px 16px' }}>Route</th>
                    <th style={{ padding: '12px 16px' }}>Parties</th>
                    <th style={{ padding: '12px 16px' }}>Vehicle / Driver</th>
                    <th style={{ padding: '12px 16px' }}>Cargo Weight</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>ETA / Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((shp) => (
                    <tr key={shp.id} style={{ borderBottom: '1px solid var(--color-border, #334155)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#60a5fa' }}>
                        {shp.trackingNumber}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                          <MapPin size={14} color="#3b82f6" /> {shp.origin}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', paddingLeft: '1.25rem' }}>
                          ↳ {shp.destination}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{shp.sender}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)' }}>To: {shp.recipient}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{shp.vehiclePlate}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)' }}>{shp.driverName}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>{shp.weightKg} kg</div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: shp.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : shp.priority === 'EXPRESS' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                          color: shp.priority === 'CRITICAL' ? '#f87171' : shp.priority === 'EXPRESS' ? '#facc15' : '#94a3b8',
                        }}>
                          {shp.priority}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {getStatusBadge(shp.status)}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.825rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={13} /> {shp.estDelivery}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' }}>
              {vehicles.map((v) => (
                <div key={v.id} style={{
                  background: 'var(--color-surface-sunken, #0f172a)',
                  border: '1px solid var(--color-border, #334155)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v.plateNumber}</span>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--color-text-muted, #94a3b8)' }}>{v.model}</p>
                    </div>
                    <Badge tone={v.status === 'ACTIVE' ? 'success' : 'neutral'}>{v.status}</Badge>
                  </div>

                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Driver:</span>
                      <span style={{ fontWeight: 500 }}>{v.driver}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Type:</span>
                      <span>{v.type.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Location:</span>
                      <span style={{ textAlign: 'right' }}>{v.currentLocation}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-border, #334155)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Fuel / Battery Level</span>
                      <span>{v.fuelLevel}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: '#334155', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${v.fuelLevel}%`,
                        background: v.fuelLevel > 50 ? '#22c55e' : v.fuelLevel > 25 ? '#eab308' : '#ef4444',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* New Booking Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #334155)',
            padding: '2rem',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Create Transport Consignment</h2>
            <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>Origin Hub</label>
                  <input
                    required
                    placeholder="e.g. Bangalore Hub A"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface-sunken, #0f172a)', border: '1px solid var(--color-border, #334155)', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>Destination Hub</label>
                  <input
                    required
                    placeholder="e.g. Hyderabad Depot"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface-sunken, #0f172a)', border: '1px solid var(--color-border, #334155)', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>Sender Entity</label>
                  <input
                    required
                    placeholder="e.g. Precision Industrial Ltd"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface-sunken, #0f172a)', border: '1px solid var(--color-border, #334155)', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>Recipient</label>
                  <input
                    required
                    placeholder="e.g. Delta Fab Solutions"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface-sunken, #0f172a)', border: '1px solid var(--color-border, #334155)', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>Cargo Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface-sunken, #0f172a)', border: '1px solid var(--color-border, #334155)', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'NORMAL' | 'EXPRESS' | 'CRITICAL')}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface-sunken, #0f172a)', border: '1px solid var(--color-border, #334155)', color: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="NORMAL">Normal Logistics</option>
                    <option value="EXPRESS">Express Transit</option>
                    <option value="CRITICAL">Critical Direct Corridor</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Confirm & Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
