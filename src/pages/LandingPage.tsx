import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Camera,
  HardHat,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const { session } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg, #0b1120)',
      color: 'var(--color-text, #f8fafc)',
      fontFamily: 'inherit',
    }}>
      {/* Navigation Topbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        background: 'rgba(11, 17, 32, 0.85)',
        borderBottom: '1px solid var(--color-border, #1e293b)',
        padding: '0.875rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            }}>
              CH
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'block' }}>ChaseHorse</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Field Ops ERP</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a href="#how-it-works" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
              Task Lifecycle
            </a>
            <a href="#roles" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
              Platform Roles
            </a>
            <a href="#evidence-ai" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
              Geo-Tag & Gemini AI
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
              <ThemeToggle />
              {session ? (
                <Link to="/overview" className="btn btn--primary btn--sm" style={{ textDecoration: 'none' }}>
                  Launch Console →
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn--ghost btn--sm" style={{ textDecoration: 'none' }}>
                    Sign In
                  </Link>
                  <Link to="/register/employee" className="btn btn--primary btn--sm" style={{ textDecoration: 'none' }}>
                    Join as Worker
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 1.5rem 4rem 1.5rem',
        maxWidth: '1240px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(37, 99, 235, 0.12)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          color: '#60a5fa',
          fontSize: '0.8125rem',
          fontWeight: 600,
          marginBottom: '1.75rem',
        }}>
          <Sparkles size={14} />
          <span>Pan-India Field Operations • AI Evidence Validation • Instant Wallet Ledgers</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          maxWidth: '960px',
          margin: '0 auto 1.5rem auto',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Nationwide Field Tasks Executed With Real GPS & AI Verification
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#94a3b8',
          maxWidth: '740px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.6,
        }}>
          Empowering enterprises to create field tasks and on-field workers to discover nearby work, capture geo-tagged proof, verify compliance with Gemini AI, and earn instant rewards.
        </p>

        {/* Action CTAs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '3.5rem',
        }}>
          <Link
            to="/register/employee"
            className="btn btn--primary"
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              boxShadow: '0 8px 25px -4px rgba(37, 99, 235, 0.5)',
            }}
          >
            <Briefcase size={18} />
            Join as On-Field Worker
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/register/customer"
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <Building2 size={18} />
            Post Tasks (Customer Portal)
          </Link>

          <Link
            to="/login"
            className="btn btn--ghost"
            style={{
              padding: '14px 24px',
              fontSize: '0.95rem',
              textDecoration: 'none',
              color: '#cbd5e1',
            }}
          >
            Operations Login →
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          textAlign: 'left',
          marginTop: '2rem',
        }}>
          <div style={{
            background: 'var(--color-surface, #131d31)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#60a5fa' }}>
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Real GPS Range Discovery</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              On-field workers discover open tasks within an exact radius from their live device location using HTML5 Geolocation & PostGIS range queries.
            </p>
          </div>

          <div style={{
            background: 'var(--color-surface, #131d31)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#c084fc' }}>
              <Camera size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Geo-Tagged Camera Evidence</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Every evidence photo is stamped with live GPS coordinates, accuracy, address, and ISO timestamp directly onto a presentation overlay.
            </p>
          </div>

          <div style={{
            background: 'var(--color-surface, #131d31)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#facc15' }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Gemini AI Verification</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Multimodal AI cross-checks image relevance, detects duplicates, verifies GPS proximity against task requirements, and flags exceptions for manager review.
            </p>
          </div>

          <div style={{
            background: 'var(--color-surface, #131d31)',
            border: '1px solid var(--color-border, #1e293b)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#34d399' }}>
              <Wallet size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Immutable Ledger Rewards</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Upon Operations Manager approval, rewards credit idempotently into the worker's wallet with cryptographic reference to task and evidence IDs.
            </p>
          </div>
        </div>
      </section>

      {/* Task Lifecycle Section */}
      <section id="how-it-works" style={{
        padding: '5rem 1.5rem',
        background: 'var(--color-surface-sunken, #080d19)',
        borderTop: '1px solid var(--color-border, #1e293b)',
        borderBottom: '1px solid var(--color-border, #1e293b)',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              End-to-End Task Lifecycle
            </h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem' }}>
              Built according to the ChaseHorse ERP Implementation Blueprint
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            <div style={{
              background: 'var(--color-surface, #131d31)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid var(--color-border, #1e293b)',
              position: 'relative',
            }}>
              <div style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>STEP 01</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Task Creation & Radius</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Customer or Admin defines task title, description, reward (INR), address, target coordinates, allowed radius, and checklist template (e.g., Shelf Audit).
              </p>
            </div>

            <div style={{
              background: 'var(--color-surface, #131d31)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid var(--color-border, #1e293b)',
              position: 'relative',
            }}>
              <div style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>STEP 02</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Location Discovery & Accept</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Eligible approved on-field workers discover tasks nearby their GPS location. Acceptance is atomic so exclusive tasks cannot be claimed twice.
              </p>
            </div>

            <div style={{
              background: 'var(--color-surface, #131d31)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid var(--color-border, #1e293b)',
              position: 'relative',
            }}>
              <div style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>STEP 03</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Geo-Tag & Checklist Work</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Worker navigates to site, completes checklist items, and captures camera evidence stamped with timestamp, location, and address metadata.
              </p>
            </div>

            <div style={{
              background: 'var(--color-surface, #131d31)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid var(--color-border, #1e293b)',
              position: 'relative',
            }}>
              <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>STEP 04</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Manager Review & Reward</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Operations Manager reviews AI verification signals and evidence photos, approves task completion, and server releases reward credit to employee wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Architecture Section */}
      <section id="roles" style={{ padding: '5rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Four Distinct Platform Roles
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem' }}>
            Governed by Spring Security & Supabase PostgreSQL Row Level Security
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div style={{
            background: 'var(--color-surface, #131d31)',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid var(--color-border, #1e293b)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                <Shield size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Platform Admin</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>Full platform configuration and audit logs</li>
              <li>Assigns roles: Manager vs On-Field Worker</li>
              <li>Approves or revokes managerial credentials</li>
              <li>Manages checklist templates and system policies</li>
            </ul>
          </div>

          <div style={{
            background: 'var(--color-surface, #131d31)',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid var(--color-border, #1e293b)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Operations Manager</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>Approves on-field worker registrations</li>
              <li>Operates the task exception review queue</li>
              <li>Reviews AI verification results and evidence photos</li>
              <li>Approves completion, requests rework, or rejects</li>
            </ul>
          </div>

          <div style={{
            background: 'var(--color-surface, #131d31)',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid var(--color-border, #1e293b)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <HardHat size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>On-Field Worker</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>Self-registers (starts in Pending Approval state)</li>
              <li>Discovers nearby tasks with live device GPS</li>
              <li>Executes mandatory checklist activities</li>
              <li>Uploads geo-tagged photos and tracks wallet balance</li>
            </ul>
          </div>

          <div style={{
            background: 'var(--color-surface, #131d31)',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid var(--color-border, #1e293b)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
                <Building2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Business Customer</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>Instant registration and dashboard access</li>
              <li>Creates pan-India field audit and inspection tasks</li>
              <li>Tracks live execution progress in real-time</li>
              <li>Inspects verified photographic evidence deliverables</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 1.5rem 2rem 1.5rem',
        borderTop: '1px solid var(--color-border, #1e293b)',
        background: 'var(--color-surface-sunken, #080d19)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#64748b',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            ChaseHorse Field Task & Employee Operations Platform • Built on Spring Boot, PostgreSQL, and Supabase Auth.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8125rem' }}>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Login</Link>
            <Link to="/register/employee" style={{ color: '#94a3b8', textDecoration: 'none' }}>Worker Registration</Link>
            <Link to="/register/customer" style={{ color: '#94a3b8', textDecoration: 'none' }}>Customer Registration</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
