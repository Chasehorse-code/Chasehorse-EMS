import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Truck,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/Fields';
import { OPERATIONAL_HUBS } from '@/config/locations';
import type { TmsShipment } from '@/types';

type Step = 1 | 2 | 3 | 4;

export function NewBookingPage() {
  const [searchParams] = useSearchParams();
  const initialPlanId = searchParams.get('planId') || '';
  const { notify } = useToast();

  const plansState = useAsync(() => api.listTransportPlans(), []);
  const plans = plansState.data || [];

  const [step, setStep] = useState<Step>(1);

  // Step 1: Route
  const [originHub, setOriginHub] = useState('central');
  const [originAddress, setOriginAddress] = useState('Bangalore Central Logistics Hub, Indiranagar');
  const [destinationHub, setDestinationHub] = useState('whitefield');
  const [destinationAddress, setDestinationAddress] = useState('Whitefield Industrial Zone, Export Park');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return d.toISOString().slice(0, 16);
  });

  // Step 2: Cargo
  const [cargoCategory, setCargoCategory] = useState('FMCG / Packaged Goods');
  const [cargoWeightKg, setCargoWeightKg] = useState('850');
  const [cargoDescription, setCargoDescription] = useState('Standard packaged retail carton boxes');
  const [specialInstructions, setSpecialInstructions] = useState('Handle with care. Dry container.');

  // Step 3: Plan
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);

  // Auto-select first plan when plans load if none selected
  useMemo(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  // Price calculation
  const calculatedPrice = useMemo(() => {
    if (!selectedPlan) return 2400;
    const base = Number(selectedPlan.baseRateInr) || 2400;
    const estKm = 35; // Standard metropolitan corridor distance
    const ratePerKm = Number(selectedPlan.ratePerKmInr) || 24;
    return base + estKm * ratePerKm;
  }, [selectedPlan]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<TmsShipment | null>(null);

  // Validation
  function canAdvance(): boolean {
    if (step === 1) {
      return originAddress.trim().length > 3 && destinationAddress.trim().length > 3;
    }
    if (step === 2) {
      return Number(cargoWeightKg) > 0 && cargoDescription.trim().length > 3;
    }
    if (step === 3) {
      return Boolean(selectedPlan);
    }
    return true;
  }

  async function handleConfirmBooking() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await api.createShipment({
        originAddress: `${originAddress} (${OPERATIONAL_HUBS[originHub]?.name || originHub})`,
        destinationAddress: `${destinationAddress} (${OPERATIONAL_HUBS[destinationHub]?.name || destinationHub})`,
        cargoDescription: `${cargoCategory} - ${cargoDescription}`,
        cargoWeightKg: Number(cargoWeightKg),
        totalPrice: calculatedPrice,
        transportPlanId: selectedPlan?.id,
      });

      setConfirmedBooking(res);
      notify({
        title: 'Booking Confirmed',
        message: `Shipment ${res.bookingRef} registered successfully.`,
        tone: 'success',
      });
    } catch (err: any) {
      notify({
        title: 'Booking Failed',
        message: err.message || 'Unable to register booking. Please verify inputs.',
        tone: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedBooking) {
    return (
      <div style={{ maxWidth: '680px', margin: '2rem auto' }}>
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Transport Booking Confirmed!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            Booking Reference: <strong style={{ color: 'var(--primary-blue)', fontSize: '1.25rem' }}>{confirmedBooking.bookingRef}</strong>
          </p>

          <div
            style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Origin</span>
                <strong>{confirmedBooking.originAddress}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Destination</span>
                <strong>{confirmedBooking.destinationAddress}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cargo & Weight</span>
                <strong>{confirmedBooking.cargoDescription} ({confirmedBooking.cargoWeightKg} kg)</strong>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Amount</span>
                <strong style={{ color: 'var(--success)' }}>₹{confirmedBooking.totalPrice.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/tracking/${confirmedBooking.bookingRef}`} className="btn btn--primary btn--md">
              <Compass size={16} style={{ marginRight: '6px' }} /> Track Shipment Live
            </Link>
            <Link to="/bookings" className="btn btn--ghost btn--md">
              View All Bookings
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="New Freight Transport Booking"
        description="Book on-demand commercial fleet transport with instant rate calculation."
        actions={
          <Link to="/bookings" className="btn btn--ghost btn--md">
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to Bookings
          </Link>
        }
      />

      {/* Wizard Progress Steps */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '640px', width: '100%', padding: '0 1rem' }}>
          {[
            { num: 1, label: 'Route' },
            { num: 2, label: 'Cargo' },
            { num: 3, label: 'Plan' },
            { num: 4, label: 'Review' },
          ].map((s, idx, arr) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: step >= s.num ? 'var(--primary-blue)' : 'var(--text-muted)',
                  fontWeight: step === s.num ? 700 : 500,
                  fontSize: '0.875rem',
                }}
              >
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: step >= s.num ? 'var(--primary-blue)' : 'var(--border)',
                    color: step >= s.num ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                  }}
                >
                  {s.num}
                </span>
                <span>{s.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: step > s.num ? 'var(--primary-blue)' : 'var(--border)',
                    margin: '0 0.5rem',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Step 1: Route */}
        {step === 1 && (
          <Card>
            <CardHeader title="Step 1: Dispatch Route & Schedule" subtitle="Select pickup and delivery locations" />
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form__row">
                <SelectField
                  label="Origin Operational Hub"
                  value={originHub}
                  onChange={(e) => setOriginHub(e.target.value)}
                >
                  {Object.entries(OPERATIONAL_HUBS).map(([k, h]) => (
                    <option key={k} value={k}>{h.name}</option>
                  ))}
                </SelectField>

                <SelectField
                  label="Destination Hub Corridor"
                  value={destinationHub}
                  onChange={(e) => setDestinationHub(e.target.value)}
                >
                  {Object.entries(OPERATIONAL_HUBS).map(([k, h]) => (
                    <option key={k} value={k}>{h.name}</option>
                  ))}
                </SelectField>
              </div>

              <TextField
                label="Pickup Address & Dock Details"
                required
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                placeholder="e.g. Warehouse 4B, Central Logistics Hub"
              />

              <TextField
                label="Destination Delivery Address"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="e.g. Retail Distribution Center, Sector 3"
              />

              <TextField
                label="Scheduled Pickup Date & Time"
                type="datetime-local"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
          </Card>
        )}

        {/* Step 2: Cargo */}
        {step === 2 && (
          <Card>
            <CardHeader title="Step 2: Cargo & Material Specifications" subtitle="Detail shipment payload parameters" />
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form__row">
                <SelectField
                  label="Cargo Classification"
                  value={cargoCategory}
                  onChange={(e) => setCargoCategory(e.target.value)}
                >
                  <option value="FMCG / Packaged Goods">FMCG / Packaged Goods</option>
                  <option value="Consumer Electronics">Consumer Electronics</option>
                  <option value="Industrial Machinery & Parts">Industrial Machinery & Parts</option>
                  <option value="Pharmaceuticals / Cold Chain">Pharmaceuticals / Cold Chain</option>
                  <option value="Apparel & Textiles">Apparel & Textiles</option>
                  <option value="Raw Materials / Hardware">Raw Materials / Hardware</option>
                </SelectField>

                <TextField
                  label="Estimated Payload Weight (kg)"
                  type="number"
                  min={1}
                  required
                  value={cargoWeightKg}
                  onChange={(e) => setCargoWeightKg(e.target.value)}
                  placeholder="e.g. 850"
                />
              </div>

              <TextField
                label="Cargo Description"
                required
                value={cargoDescription}
                onChange={(e) => setCargoDescription(e.target.value)}
                placeholder="Brief item description (e.g. 40 master cartons of packaged foodstuffs)"
              />

              <TextAreaField
                label="Special Handling / Packaging Instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                placeholder="e.g. Temperature requirement, fragile, liftgate required at delivery dock"
              />
            </div>
          </Card>
        )}

        {/* Step 3: Plan */}
        {step === 3 && (
          <Card>
            <CardHeader title="Step 3: Choose Fleet Transport Plan" subtitle="Select vehicle class suited to payload" />
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {plans.map((p) => {
                const isSelected = p.id === (selectedPlan?.id || selectedPlanId);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    style={{
                      border: `2px solid ${isSelected ? 'var(--primary-blue)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--info-bg)' : 'var(--surface)',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--primary-blue)' : 'var(--surface-2)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Truck size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.0625rem', color: 'var(--text)' }}>{p.planName}</strong>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--border)', color: 'var(--text-muted)' }}>
                            {p.vehicleType}
                          </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', display: 'block' }}>
                        ₹{Number(p.baseRateInr).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        + ₹{p.ratePerKmInr}/km · {p.maxCapacityKg} kg max
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card>
            <CardHeader title="Step 4: Review Booking & Estimate" subtitle="Confirm dispatch specifications before submitting" />
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--surface-2)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div>
                  <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Route Details</span>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)', fontWeight: 600 }}>
                    {originAddress}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    ↓ To: {destinationAddress}
                  </p>
                </div>

                <div>
                  <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Cargo Specification</span>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)', fontWeight: 600 }}>
                    {cargoCategory} ({cargoWeightKg} kg)
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {cargoDescription}
                  </p>
                </div>

                <div>
                  <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Selected Fleet Plan</span>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)', fontWeight: 600 }}>
                    {selectedPlan?.planName}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Est. Transit: {selectedPlan?.estimatedHours || 6} Hours
                  </p>
                </div>

                <div>
                  <span className="muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Pickup Time</span>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)', fontWeight: 600 }}>
                    {new Date(pickupDate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--info-bg)', borderRadius: 'var(--radius)' }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--info-fg)', textTransform: 'uppercase', fontWeight: 700 }}>Total Calculated Freight Price</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Includes base fare, corridor fuel surcharge, and transit insurance
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                    ₹{calculatedPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Wizard Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          {step > 1 ? (
            <Button
              type="button"
              tone="ghost"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Previous
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              tone="primary"
              disabled={!canAdvance()}
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              Continue <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </Button>
          ) : (
            <Button
              type="button"
              tone="primary"
              disabled={submitting}
              onClick={handleConfirmBooking}
            >
              {submitting ? 'Confirming Dispatch...' : 'Confirm & Book Transport'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
