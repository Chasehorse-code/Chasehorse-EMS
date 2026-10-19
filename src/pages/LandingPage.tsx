import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Camera,
  HardHat,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Check,
  Compass,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LiveRadarCard } from '@/components/landing/LiveRadarCard';
import { AuthModal, type AuthModalView } from '@/components/auth/AuthModal';

export interface LandingPageProps {
  initialAuthView?: AuthModalView;
}

export function LandingPage({ initialAuthView }: LandingPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(Boolean(initialAuthView));
  const [authView, setAuthView] = useState<AuthModalView>(initialAuthView || 'login');

  // Sync deep link if route changed
  useEffect(() => {
    if (initialAuthView) {
      setAuthView(initialAuthView);
      setAuthModalOpen(true);
    }
  }, [initialAuthView]);

  const handleOpenAuth = (view: AuthModalView) => {
    setAuthView(view);
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
    // If user arrived via deep-link (e.g. /login), smoothly replace URL with /
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="landing-page-root">
      {/* Sticky Glass Top Header */}
      <LandingHeader onOpenAuth={handleOpenAuth} />

      <main id="main-content">
        {/* ==========================================================================
            Hero Section (Two Columns, Staggered Load Animation)
            ========================================================================== */}
        <section className="hero-section" aria-labelledby="hero-heading">
          <div className="hero-section__container">
            {/* Left Column: Copy & Triggers */}
            <div className="hero-content">
              {/* Top Pill with Pulsing Green Dot */}
              <div className="hero-pill-badge" role="status">
                <span className="hero-pill-pulse-dot" aria-hidden="true" />
                <span>Pan-India field operations · AI evidence checks · Instant wallet credit</span>
              </div>

              {/* Main Heading with Animated Underline on "paid on approval." */}
              <h1 id="hero-heading" className="hero-title">
                Field tasks done on site, proven on camera,{' '}
                <span className="hero-title-highlight">
                  paid on approval.
                  <svg
                    className="hero-underline-svg"
                    viewBox="0 0 280 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M 4 10 C 60 4, 180 3, 276 9"
                      stroke="var(--blue)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Supporting Paragraph */}
              <p className="hero-lead">
                Empowering enterprises to create field tasks and on-field workers to discover nearby work, capture geo-tagged proof, verify compliance with Gemini AI, and earn instant rewards.
              </p>

              {/* Three Action CTAs */}
              <div className="hero-ctas">
                <button
                  type="button"
                  onClick={() => handleOpenAuth('worker')}
                  className="btn btn--primary btn--hero-lg btn--sheen"
                >
                  <Briefcase size={18} />
                  <span>Join as On-Field Worker</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuth('customer')}
                  className="btn btn--secondary btn--hero-lg"
                >
                  <Building2 size={18} />
                  <span>Post Tasks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="btn btn--ghost btn--hero-lg"
                >
                  <span>Operations Login</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </button>
              </div>

              {/* Hero Micro Value Props */}
              <div className="hero-check-row">
                <div className="hero-check-item">
                  <CheckCircle2 size={16} className="hero-check-icon" />
                  <span>PostGIS 2 km Geofencing</span>
                </div>
                <div className="hero-check-item">
                  <CheckCircle2 size={16} className="hero-check-icon" />
                  <span>Exif GPS Coordinate Overlay</span>
                </div>
                <div className="hero-check-item">
                  <CheckCircle2 size={16} className="hero-check-icon" />
                  <span>Idempotent INR Wallet Credit</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Task Radius Map Card */}
            <div className="hero-visual">
              <LiveRadarCard />
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Feature Row (4 Cards with 6px lift & icon flip)
            ========================================================================== */}
        <section className="features-section" aria-labelledby="features-heading">
          <div className="landing-container">
            <div className="section-header">
              <div className="section-pill">ENTERPRISE CAPABILITIES</div>
              <h2 id="features-heading" className="section-title">
                Engineered for High-Integrity Ground Operations
              </h2>
              <p className="section-subtitle">
                Robust field data infrastructure ensuring cryptographic verification from dispatch to settlement.
              </p>
            </div>

            <div className="features-grid">
              {/* Feature 1 */}
              <div className="feature-card">
                <div className="feature-card__icon-box">
                  <MapPin size={24} />
                </div>
                <h3 className="feature-card__title">Real GPS Range Discovery</h3>
                <p className="feature-card__desc">
                  On-field workers discover open tasks within an exact radius from their live device location using HTML5 Geolocation & PostGIS range queries.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card">
                <div className="feature-card__icon-box">
                  <Camera size={24} />
                </div>
                <h3 className="feature-card__title">Geo-Tagged Camera Evidence</h3>
                <p className="feature-card__desc">
                  Every evidence photo is stamped with live GPS coordinates, accuracy, address, and ISO timestamp directly onto a presentation overlay.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card" id="evidence-ai">
                <div className="feature-card__icon-box">
                  <Sparkles size={24} />
                </div>
                <h3 className="feature-card__title">Gemini AI Verification</h3>
                <p className="feature-card__desc">
                  Multimodal AI cross-checks image relevance, detects duplicates, verifies GPS proximity against task requirements, and flags exceptions for manager review.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-card">
                <div className="feature-card__icon-box">
                  <Wallet size={24} />
                </div>
                <h3 className="feature-card__title">Immutable Ledger Rewards</h3>
                <p className="feature-card__desc">
                  Upon Operations Manager approval, rewards credit idempotently into the worker's wallet with cryptographic reference to task and evidence IDs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Task Lifecycle (4 Numbered Cards joined by dashed line)
            ========================================================================== */}
        <section id="how-it-works" className="lifecycle-section" aria-labelledby="lifecycle-heading">
          <div className="landing-container">
            <div className="section-header">
              <div className="section-pill">STEP-BY-STEP PROCESS</div>
              <h2 id="lifecycle-heading" className="section-title">
                End-to-End Task Lifecycle
              </h2>
              <p className="section-subtitle">
                Built according to the ChaseHorse ERP Implementation Blueprint
              </p>
            </div>

            <div className="lifecycle-grid">
              {/* Step 1 */}
              <div className="lifecycle-card">
                <div className="lifecycle-card__step-num">01</div>
                <h3 className="lifecycle-card__title">Task Creation & Radius</h3>
                <p className="lifecycle-card__desc">
                  Customer or Admin defines task title, description, reward (INR), address, target coordinates, allowed radius, and checklist template (e.g., Shelf Audit).
                </p>
              </div>

              {/* Step 2 */}
              <div className="lifecycle-card">
                <div className="lifecycle-card__step-num">02</div>
                <h3 className="lifecycle-card__title">Location Discovery & Accept</h3>
                <p className="lifecycle-card__desc">
                  Eligible approved on-field workers discover tasks nearby their GPS location. Acceptance is atomic so exclusive tasks cannot be claimed twice.
                </p>
              </div>

              {/* Step 3 */}
              <div className="lifecycle-card">
                <div className="lifecycle-card__step-num">03</div>
                <h3 className="lifecycle-card__title">Geo-Tag & Checklist Work</h3>
                <p className="lifecycle-card__desc">
                  Worker navigates to site, completes checklist items, and captures camera evidence stamped with timestamp, location, and address metadata.
                </p>
              </div>

              {/* Step 4 (Green) */}
              <div className="lifecycle-card lifecycle-card--success">
                <div className="lifecycle-card__step-num lifecycle-card__step-num--good">04</div>
                <h3 className="lifecycle-card__title">Manager Review & Reward</h3>
                <p className="lifecycle-card__desc">
                  Operations Manager reviews AI verification signals and evidence photos, approves task completion, and server releases reward credit to employee wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Platform Roles (4 Cards with Icons & checkmarks)
            ========================================================================== */}
        <section id="roles" className="roles-section" aria-labelledby="roles-heading">
          <div className="landing-container">
            <div className="section-header">
              <div className="section-pill">SECURITY & RBAC</div>
              <h2 id="roles-heading" className="section-title">
                Four Distinct Platform Roles
              </h2>
              <p className="section-subtitle">
                Governed by Spring Security & Supabase PostgreSQL Row Level Security
              </p>
            </div>

            <div className="roles-grid">
              {/* Role 1: Platform Admin (Red) */}
              <div className="role-card role-card--admin">
                <div className="role-card__header">
                  <div className="role-card__icon-box role-card__icon-box--admin">
                    <Shield size={22} />
                  </div>
                  <h3 className="role-card__title">Platform Admin</h3>
                </div>
                <ul className="role-card__list">
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Full platform configuration and audit logs</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Assigns roles: Manager vs On-Field Worker</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Approves or revokes managerial credentials</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Manages checklist templates and system policies</span>
                  </li>
                </ul>
              </div>

              {/* Role 2: Operations Manager (Blue) */}
              <div className="role-card role-card--manager">
                <div className="role-card__header">
                  <div className="role-card__icon-box role-card__icon-box--manager">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="role-card__title">Operations Manager</h3>
                </div>
                <ul className="role-card__list">
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Approves on-field worker registrations</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Operates the task exception review queue</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Reviews AI verification results and evidence photos</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Approves completion, requests rework, or rejects</span>
                  </li>
                </ul>
              </div>

              {/* Role 3: On-Field Worker (Green) */}
              <div className="role-card role-card--worker">
                <div className="role-card__header">
                  <div className="role-card__icon-box role-card__icon-box--worker">
                    <HardHat size={22} />
                  </div>
                  <h3 className="role-card__title">On-Field Worker</h3>
                </div>
                <ul className="role-card__list">
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Self-registers (starts in Pending Approval state)</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Discovers nearby tasks with live device GPS</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Executes mandatory checklist activities</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Uploads geo-tagged photos and tracks wallet balance</span>
                  </li>
                </ul>
              </div>

              {/* Role 4: Business Customer (Amber) */}
              <div className="role-card role-card--customer">
                <div className="role-card__header">
                  <div className="role-card__icon-box role-card__icon-box--customer">
                    <Building2 size={22} />
                  </div>
                  <h3 className="role-card__title">Business Customer</h3>
                </div>
                <ul className="role-card__list">
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Instant registration and dashboard access</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Creates pan-India field audit and inspection tasks</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Tracks live execution progress in real-time</span>
                  </li>
                  <li>
                    <Check size={16} className="role-check-icon" />
                    <span>Inspects verified photographic evidence deliverables</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Closing Blue Gradient CTA Band
            ========================================================================== */}
        <section className="cta-band" aria-labelledby="cta-band-heading">
          <div className="cta-band__inner">
            <div className="cta-band__content">
              <div className="cta-band__badge">
                <Compass size={14} />
                <span>EXPAND GROUND OPERATIONS</span>
              </div>
              <h2 id="cta-band-heading" className="cta-band__title">
                Ready to put your field work on the map?
              </h2>
              <p className="cta-band__desc">
                Deploy high-assurance verified workforce audits or earn competitive rewards as a certified ground operations specialist.
              </p>
            </div>

            <div className="cta-band__actions">
              <button
                type="button"
                onClick={() => handleOpenAuth('customer')}
                className="btn btn--cta-white btn--hero-lg"
              >
                <Building2 size={18} />
                <span>Post Tasks</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth('worker')}
                className="btn btn--cta-outline btn--hero-lg"
              >
                <Briefcase size={18} />
                <span>Join as Worker</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================================================
          Footer with Platform Description and Modal Triggers
          ========================================================================== */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer__grid">
            {/* Brand Col */}
            <div className="landing-footer__brand-col">
              <div className="landing-brand">
                <div className="landing-brand__logo" aria-hidden="true">CH</div>
                <div className="landing-brand__text">
                  <span className="landing-brand__name">ChaseHorse</span>
                  <span className="landing-brand__tag">FIELD OPS ERP</span>
                </div>
              </div>
              <p className="landing-footer__desc">
                Enterprise field task orchestration, verified geo-stamped photo intelligence, and instant idempotent wallet ledgers across pan-India territories.
              </p>
            </div>

            {/* Quick Links with Unified Modal Triggers */}
            <div className="landing-footer__nav-col">
              <h4 className="landing-footer__title">Access Portals</h4>
              <ul className="landing-footer__links">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('login')}
                    className="footer-btn-link"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('worker')}
                    className="footer-btn-link"
                  >
                    Worker Registration
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('customer')}
                    className="footer-btn-link"
                  >
                    Customer Registration
                  </button>
                </li>
              </ul>
            </div>

            {/* Security Stack */}
            <div className="landing-footer__nav-col">
              <h4 className="landing-footer__title">Platform Stack</h4>
              <ul className="landing-footer__meta-list">
                <li>Spring Boot & Java 21</li>
                <li>Supabase Auth & PostgreSQL RLS</li>
                <li>PostGIS Geolocation & Range Engine</li>
                <li>Google Gemini Multimodal AI</li>
              </ul>
            </div>
          </div>

          <div className="landing-footer__bottom-row">
            <span>© {new Date().getFullYear()} ChaseHorse Field Ops Platform. All rights reserved.</span>
            <div className="landing-footer__bottom-badges">
              <span className="security-pill">SOC-2 Type II Certified Architecture</span>
              <span className="security-pill">ISO 27001 Compliant</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ==========================================================================
          Unified Auth Modal Shell (Login, Worker, Customer)
          ========================================================================== */}
      <AuthModal
        isOpen={authModalOpen}
        initialView={authView}
        onClose={handleCloseAuth}
      />
    </div>
  );
}
