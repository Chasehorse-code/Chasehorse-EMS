import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  HardHat,
  MapPin,
  Menu,
  Package,
  Phone,
  Search,
  Shield,
  Truck,
  Users,
  X,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { TmsTrackingDetails } from '@/types';

export function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick tracking input state
  const [trackingRef, setTrackingRef] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TmsTrackingDetails | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Live transport plans from real API
  const plansState = useAsync(() => api.listTransportPlans(), []);

  async function handleQuickTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackingRef.trim()) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingResult(null);

    try {
      const data = await api.getTracking(trackingRef.trim());
      setTrackingResult(data);
    } catch (err: any) {
      setTrackingError(err.message || 'No active shipment found with this reference number.');
    } finally {
      setTrackingLoading(false);
    }
  }

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header__inner">
          <Link to="/" className="landing-brand">
            <div className="landing-brand__logo">
              <Truck size={20} />
            </div>
            <span>CHASEHORSE</span>
          </Link>

          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#services" className="landing-nav__link">Services</a>
            <a href="#truck-plans" className="landing-nav__link">Truck Plans</a>
            <a href="#tracking" className="landing-nav__link">Tracking</a>
            <a href="#how-it-works" className="landing-nav__link">How It Works</a>
            <a href="#about" className="landing-nav__link">About</a>
            <a href="#contact" className="landing-nav__link">Contact</a>
          </nav>

          <div className="landing-header__actions">
            <ThemeToggle />

            {session ? (
              <Button onClick={() => navigate('/admin/dashboard')} tone="primary">
                Console <ArrowRight size={15} style={{ marginLeft: '4px' }} />
              </Button>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--md">
                  Sign In
                </Link>
                <Link to="/login" className="btn btn--primary btn--md">
                  Get Started
                </Link>
              </>
            )}

            <button
              type="button"
              className="landing-mobile-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <a href="#services" className="landing-nav__link" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#truck-plans" className="landing-nav__link" onClick={() => setMobileMenuOpen(false)}>Truck Plans</a>
            <a href="#tracking" className="landing-nav__link" onClick={() => setMobileMenuOpen(false)}>Tracking</a>
            <a href="#how-it-works" className="landing-nav__link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#about" className="landing-nav__link" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="#contact" className="landing-nav__link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <hr style={{ borderColor: 'var(--border)', margin: '0.5rem 0' }} />
            <Link to="/login" className="btn btn--primary btn--md" style={{ width: '100%', justifyContent: 'center' }}>
              Access Platform
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div className="landing-hero__content">
            <div className="hero-pill">
              <Shield size={14} />
              <span>Enterprise Freight & Workforce Orchestration</span>
            </div>

            <h1 className="landing-hero__title">
              Powering Modern Logistics with <span>Real-Time Intelligence</span>
            </h1>

            <p className="landing-hero__desc">
              ChaseHorse is India’s premier enterprise transportation management and field operations
              platform. Seamlessly dispatch freight, track high-value cargo, automate site verifications,
              and settle digital logistics workflows from a single unified portal.
            </p>

            <div className="landing-hero__ctas">
              <Link to="/bookings/new" className="btn btn--primary btn--lg">
                Book Transport <ArrowRight size={18} style={{ marginLeft: '6px' }} />
              </Link>
              <a href="#tracking" className="btn btn--secondary btn--lg">
                <Search size={18} style={{ marginRight: '6px' }} /> Track Shipment
              </a>
            </div>

            <div className="hero-features">
              <div className="hero-feature-item">
                <CheckCircle2 size={16} />
                <span>GPS Geofenced Verification</span>
              </div>
              <div className="hero-feature-item">
                <CheckCircle2 size={16} />
                <span>Multi-Axle Fleet Allocation</span>
              </div>
              <div className="hero-feature-item">
                <CheckCircle2 size={16} />
                <span>Zero-Trust Cryptographic Audit</span>
              </div>
            </div>
          </div>

          {/* Quick Tracking Widget */}
          <div className="landing-hero__visual" id="tracking">
            <div className="tracking-widget-card">
              <div className="tracking-widget-card__header">
                <div className="service-icon-wrap" style={{ margin: 0, width: 40, height: 40 }}>
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="tracking-widget-card__title">Live Shipment Lookup</h3>
                  <p className="tracking-widget-card__desc">Verify transport milestone status in real time</p>
                </div>
              </div>

              <form onSubmit={handleQuickTrack}>
                <div className="tracking-input-group">
                  <input
                    type="text"
                    className="tracking-input"
                    placeholder="Enter Booking Reference (e.g. CH-TMS-10293)"
                    value={trackingRef}
                    onChange={(e) => setTrackingRef(e.target.value)}
                    required
                  />
                  <Button type="submit" tone="primary" disabled={trackingLoading}>
                    {trackingLoading ? 'Checking...' : 'Track'}
                  </Button>
                </div>
              </form>

              {trackingError && (
                <div className="notice notice--warning" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                  {trackingError}
                </div>
              )}

              {trackingResult && (
                <div className="tracking-result-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>{trackingResult.bookingRef}</strong>
                    <Badge tone={trackingResult.status === 'DELIVERED' ? 'success' : 'info'}>
                      {trackingResult.status}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                    <strong>Route:</strong> {trackingResult.originAddress} → {trackingResult.destinationAddress}
                  </p>
                  {trackingResult.cargoDescription && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                      <strong>Cargo:</strong> {trackingResult.cargoDescription} ({trackingResult.cargoWeightKg} kg)
                    </p>
                  )}
                  <Link
                    to={`/tracking/${trackingResult.bookingRef}`}
                    style={{ fontSize: '0.875rem', color: 'var(--primary-blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    View detailed milestones timeline <ExternalLink size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="landing-section" id="services">
        <div className="landing-section__header">
          <span className="section-label">Enterprise Capabilities</span>
          <h2 className="section-title">End-to-End Transportation & Field Workforce Services</h2>
          <p className="section-desc">
            Engineered for high-volume enterprise supply chains, regional distribution networks,
            and field verification teams across urban and industrial corridors.
          </p>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon-wrap">
              <Truck size={24} />
            </div>
            <h3 className="service-card__title">Freight & Truck Transport</h3>
            <p className="service-card__desc">
              On-demand booking for Express Cargo Vans, Medium 14ft Freight, and Heavy Duty Multi-Axle
              trucks with pre-negotiated base rates and dynamic distance calculation.
            </p>
            <Link to="/bookings/new" className="service-card__link">
              Book Transport <ArrowRight size={14} />
            </Link>
          </div>

          <div className="service-card">
            <div className="service-icon-wrap">
              <Users size={24} />
            </div>
            <h3 className="service-card__title">Workforce & Field Operations</h3>
            <p className="service-card__desc">
              Empower ground personnel with GPS-validated tasks, standardized audit checklists,
              site survey questionnaires, and cryptographic proof of work.
            </p>
            <Link to="/tasks" className="service-card__link">
              View Task Operations <ArrowRight size={14} />
            </Link>
          </div>

          <div className="service-card">
            <div className="service-icon-wrap">
              <Compass size={24} />
            </div>
            <h3 className="service-card__title">Real-Time Milestone Tracking</h3>
            <p className="service-card__desc">
              Zero-latency shipment milestone updates, automatic event logging, transit checkpoint
              stamps, and instant customer notifications across delivery corridors.
            </p>
            <a href="#tracking" className="service-card__link">
              Track Consignment <ArrowRight size={14} />
            </a>
          </div>

          <div className="service-card">
            <div className="service-icon-wrap">
              <Package size={24} />
            </div>
            <h3 className="service-card__title">Enterprise Commerce & Supplies</h3>
            <p className="service-card__desc">
              Streamline multi-point B2B retail distribution, store replenishment, inventory audit
              verifications, and digital proof of delivery documentation.
            </p>
            <Link to="/login" className="service-card__link">
              Partner Integration <ArrowRight size={14} />
            </Link>
          </div>

          <div className="service-card">
            <div className="service-icon-wrap">
              <HardHat size={24} />
            </div>
            <h3 className="service-card__title">HSE & Vehicle Safety Audits</h3>
            <p className="service-card__desc">
              Pre-trip vehicle checklists, compliance surveys, health and safety inspections, and
              tamper-proof photo evidence collection with automated review queues.
            </p>
            <Link to="/checklists" className="service-card__link">
              Explore Checklists <ArrowRight size={14} />
            </Link>
          </div>

          <div className="service-card">
            <div className="service-icon-wrap">
              <FileCheck2 size={24} />
            </div>
            <h3 className="service-card__title">Digital Settlement & Wallet Ledger</h3>
            <p className="service-card__desc">
              Dual-entry financial ledger for task payouts, driver settlements, transporter billing,
              and verifiable audit trails backed by PostgreSQL row-level security.
            </p>
            <Link to="/wallet" className="service-card__link">
              Financial Overview <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Truck Plans Section */}
      <section className="landing-section landing-section--alt" id="truck-plans">
        <div className="landing-section__header">
          <span className="section-label">Fleet Specifications</span>
          <h2 className="section-title">Verified Transport Plans & Vehicle Classes</h2>
          <p className="section-desc">
            Directly provisioned from our live logistics database. Clear tonnage capacities,
            transparent base pricing, and guaranteed dispatch SLAs.
          </p>
        </div>

        <div className="plans-grid">
          {plansState.data && plansState.data.length > 0 ? (
            plansState.data.map((plan) => (
              <div key={plan.id} className="plan-card">
                <span className="plan-card__vehicle-type">{plan.vehicleType}</span>
                <h3 className="plan-card__title">{plan.planName}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  {plan.description}
                </p>

                <div className="plan-card__price-box">
                  <span className="plan-price-num">₹{plan.baseRateInr.toLocaleString()}</span>
                  <span className="plan-price-unit">base + ₹{plan.ratePerKmInr}/km</span>
                </div>

                <ul className="plan-specs">
                  <li className="plan-spec-item">
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span>Capacity: <strong>{plan.maxCapacityKg} kg</strong> payload</span>
                  </li>
                  <li className="plan-spec-item">
                    <Clock size={16} color="var(--primary-blue)" />
                    <span>Est. Transit: <strong>{plan.estimatedHours} Hours</strong></span>
                  </li>
                  <li className="plan-spec-item">
                    <Shield size={16} color="var(--accent-amber)" />
                    <span>Transit Cargo Insurance included</span>
                  </li>
                </ul>

                <Link
                  to={`/bookings/new?planId=${plan.id}`}
                  className="btn btn--primary btn--md"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Select Plan & Book
                </Link>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="muted">Loading live fleet availability...</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-section__header">
          <span className="section-label">Operational Workflow</span>
          <h2 className="section-title">Simple, Transparent Logistics in 4 Steps</h2>
          <p className="section-desc">
            From initial consignment booking to automated proof of delivery, our digital pipeline
            eliminates paperwork, manual check-calls, and billing disputes.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-badge">1</div>
            <h3 className="step-title">Specify Route & Cargo</h3>
            <p className="step-desc">
              Enter origin, destination, cargo classification, and weight. Our routing engine
              calculates precise rates and estimated transit times.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge">2</div>
            <h3 className="step-title">Automated Fleet Dispatch</h3>
            <p className="step-desc">
              System allocates certified vehicles and background-verified drivers. Driver receives
              route instructions on the ChaseHorse mobile app.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge">3</div>
            <h3 className="step-title">Real-Time Milestone Transit</h3>
            <p className="step-desc">
              Consignors and recipients monitor checkpoint arrivals, departure alerts, and
              geofenced timestamps on the tracking portal.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge">4</div>
            <h3 className="step-title">Verified ePOD & Settlement</h3>
            <p className="step-desc">
              Digital proof of delivery with photo evidence and consignee confirmation triggers
              instant ledger settlement and invoice generation.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="landing-section landing-section--alt" id="about">
        <div className="landing-hero__inner" style={{ alignItems: 'center' }}>
          <div>
            <span className="section-label">About ChaseHorse</span>
            <h2 className="section-title">Built for Enterprise Reliability and Speed</h2>
            <p className="section-desc" style={{ marginBottom: '1.5rem' }}>
              ChaseHorse is engineered as an enterprise-grade operating system for commerce, logistics,
              and workforce management. Powered by modern PostgreSQL with Row-Level Security, Spring Boot
              REST microservices, and React application architectures, we deliver 99.9% operational
              uptime across complex supply chains.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text)' }}>Zero Data Compromise</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Granular 7-role RBAC ensuring data isolation between consignors, drivers, and partners.
                </p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text)' }}>Continuous Auditability</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Immutable audit event stream logging every booking change, status transition, and approval.
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.25rem' }}>Operating Across Regional Hubs</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={18} color="var(--primary-blue)" />
                <span><strong>Bangalore Hub:</strong> Central Logistics Center, Whitefield Corridor</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={18} color="var(--primary-blue)" />
                <span><strong>Hyderabad Hub:</strong> HITEC City Dispatch & Outer Ring Road Depot</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={18} color="var(--primary-blue)" />
                <span><strong>Vijayawada Hub:</strong> Benz Circle Regional Terminal & Industrial Belt</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={18} color="var(--primary-blue)" />
                <span><strong>Chennai Hub:</strong> Guindy Industrial Park & Port Transit Link</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="landing-section" id="contact">
        <div className="landing-section__header">
          <span className="section-label">Get in Touch</span>
          <h2 className="section-title">Connect with Our Logistics Solutions Team</h2>
          <p className="section-desc">
            Have questions about enterprise fleet leasing, custom corridor contracts, or partner
            onboarding? Our dispatch and engineering desks are ready to assist.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.125rem' }}>Direct Inquiries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={18} color="var(--primary-blue)" />
                <span>+91 80 4920 0000 (Dispatch Line)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} color="var(--primary-blue)" />
                <span>enterprise@chasehorse.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={18} color="var(--primary-blue)" />
                <span>24/7 Fleet Control Room Support</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.125rem' }}>Ready to Deploy?</h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Register for an enterprise account or log in to manage your bookings, assigned tasks, and fleet operations.
            </p>
            <Link to="/login" className="btn btn--primary btn--md" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In to ChaseHorse
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div>
            <div className="landing-brand" style={{ marginBottom: '1rem' }}>
              <div className="landing-brand__logo">
                <Truck size={18} />
              </div>
              <span>CHASEHORSE</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '320px' }}>
              Next-generation enterprise logistics, transportation orchestration, and field workforce management platform.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/bookings/new" className="footer-link">Book Transport</Link></li>
              <li><a href="#tracking" className="footer-link">Track Shipment</a></li>
              <li><a href="#truck-plans" className="footer-link">Truck Plans</a></li>
              <li><Link to="/login" className="footer-link">Enterprise Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Operations</h4>
            <ul className="footer-links">
              <li><Link to="/login" className="footer-link">Employee Portal</Link></li>
              <li><Link to="/login" className="footer-link">Partner Fleet</Link></li>
              <li><Link to="/login" className="footer-link">Customer Dashboard</Link></li>
              <li><Link to="/login" className="footer-link">HSE Checklists</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#about" className="footer-link">About Us</a></li>
              <li><a href="#services" className="footer-link">Capabilities</a></li>
              <li><a href="#contact" className="footer-link">Contact Support</a></li>
              <li><span className="footer-link">Terms & Privacy</span></li>
            </ul>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <span>&copy; {new Date().getFullYear()} ChaseHorse Logistics Technologies Pvt. Ltd. All rights reserved.</span>
          <span>Verified Supabase Cloud & Spring Boot Engine</span>
        </div>
      </footer>
    </div>
  );
}
