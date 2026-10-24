import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ChaseHorseLogo } from '@/components/ui/ChaseHorseLogo';
import { useAuth } from '@/context/AuthContext';
import type { AuthModalView } from '@/components/auth/AuthModal';

export interface LandingHeaderProps {
  onOpenAuth?: (view: AuthModalView) => void;
}

export function LandingHeader({ onOpenAuth: _onOpenAuth }: LandingHeaderProps) {
  const { session } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
      <div className="landing-header__inner">
        {/* Brand Logo matching Screenshot 3 */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ChaseHorseLogo theme="light" size="md" />
        </Link>

        {/* Desktop Navigation Links matching Screenshot 3 */}
        <nav className="landing-nav" aria-label="Primary site navigation">
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, 'how-it-works')}
            className="landing-nav__link"
          >
            How it works
          </a>
          <a
            href="#businesses"
            onClick={(e) => handleNavClick(e, 'businesses')}
            className="landing-nav__link"
          >
            Businesses
          </a>
          <a
            href="#field-workers"
            onClick={(e) => handleNavClick(e, 'field-workers')}
            className="landing-nav__link"
          >
            Field workers
          </a>
          <a
            href="#verification"
            onClick={(e) => handleNavClick(e, 'verification')}
            className="landing-nav__link"
          >
            Verification
          </a>
          <a
            href="#rewards"
            onClick={(e) => handleNavClick(e, 'rewards')}
            className="landing-nav__link"
          >
            Rewards
          </a>
        </nav>

        {/* Header Action Controls */}
        <div className="landing-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {session ? (
            <Link
              to="/overview"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#111315',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Console <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--ink, #111315)',
                  textDecoration: 'none',
                  padding: '8px 10px',
                }}
              >
                Sign in
              </Link>

              <Link
                to="/register/worker"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--ink, #111315)',
                  textDecoration: 'none',
                  padding: '8px 10px',
                }}
              >
                Join as worker
              </Link>

              <Link
                to="/register/customer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#111315',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#262930')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#111315')}
              >
                <span>Post a task</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Collapsed Mobile Menu (<1020px) */}
      {mobileMenuOpen && (
        <div className="landing-mobile-drawer" role="dialog" aria-label="Mobile Navigation">
          <nav className="landing-mobile-nav">
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="landing-mobile-nav__link"
            >
              How it works
            </a>
            <a
              href="#businesses"
              onClick={(e) => handleNavClick(e, 'businesses')}
              className="landing-mobile-nav__link"
            >
              Businesses
            </a>
            <a
              href="#field-workers"
              onClick={(e) => handleNavClick(e, 'field-workers')}
              className="landing-mobile-nav__link"
            >
              Field workers
            </a>
            <a
              href="#verification"
              onClick={(e) => handleNavClick(e, 'verification')}
              className="landing-mobile-nav__link"
            >
              Verification
            </a>
            <a
              href="#rewards"
              onClick={(e) => handleNavClick(e, 'rewards')}
              className="landing-mobile-nav__link"
            >
              Rewards
            </a>
          </nav>

          <div className="landing-mobile-drawer__actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem' }}>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn--secondary btn--block"
            >
              Sign in
            </Link>
            <Link
              to="/register/worker"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn--block"
              style={{ background: '#ffffff', border: '1px solid #dcd7cc', color: '#111315', fontWeight: 600 }}
            >
              Join as worker
            </Link>
            <Link
              to="/register/customer"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn--block"
              style={{ background: '#111315', color: '#ffffff', fontWeight: 600 }}
            >
              Post a task →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
