import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import type { AuthModalView } from '@/components/auth/AuthModal';

export interface LandingHeaderProps {
  onOpenAuth: (view: AuthModalView) => void;
}

export function LandingHeader({ onOpenAuth }: LandingHeaderProps) {
  const { session } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Scroll listener for sticky glass header border/shadow & scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsScrolled(scrollPos > 10);

      // Scroll-spy section tracking
      const sections = ['how-it-works', 'roles', 'evidence-ai'];
      const scrollY = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      if (scrollPos < 200) {
        setActiveSection('');
      }
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
        {/* Brand / Logo Mark */}
        <Link to="/" className="landing-brand" aria-label="ChaseHorse Field Ops ERP">
          <div className="landing-brand__logo" aria-hidden="true">
            CH
          </div>
          <div className="landing-brand__text">
            <span className="landing-brand__name">ChaseHorse</span>
            <span className="landing-brand__tag">FIELD OPS ERP</span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Scroll-Spy Highlighting */}
        <nav className="landing-nav" aria-label="Primary site navigation">
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, 'how-it-works')}
            className={`landing-nav__link ${activeSection === 'how-it-works' ? 'landing-nav__link--active' : ''}`}
          >
            Task Lifecycle
          </a>
          <a
            href="#roles"
            onClick={(e) => handleNavClick(e, 'roles')}
            className={`landing-nav__link ${activeSection === 'roles' ? 'landing-nav__link--active' : ''}`}
          >
            Platform Roles
          </a>
          <a
            href="#evidence-ai"
            onClick={(e) => handleNavClick(e, 'evidence-ai')}
            className={`landing-nav__link ${activeSection === 'evidence-ai' ? 'landing-nav__link--active' : ''}`}
          >
            Geo-Tag & Gemini AI
          </a>
        </nav>

        {/* Header Action Controls */}
        <div className="landing-header__actions">
          <ThemeToggle />

          {session ? (
            <Link to="/overview" className="btn btn--primary btn--sm btn--sheen">
              Launch Console <ArrowRight size={14} className="btn-arrow" />
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="btn btn--ghost btn--sm btn--header-login"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('worker')}
                className="btn btn--primary btn--sm btn--sheen"
              >
                Join as Worker
              </button>
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
              className={`landing-mobile-nav__link ${activeSection === 'how-it-works' ? 'landing-mobile-nav__link--active' : ''}`}
            >
              Task Lifecycle
            </a>
            <a
              href="#roles"
              onClick={(e) => handleNavClick(e, 'roles')}
              className={`landing-mobile-nav__link ${activeSection === 'roles' ? 'landing-mobile-nav__link--active' : ''}`}
            >
              Platform Roles
            </a>
            <a
              href="#evidence-ai"
              onClick={(e) => handleNavClick(e, 'evidence-ai')}
              className={`landing-mobile-nav__link ${activeSection === 'evidence-ai' ? 'landing-mobile-nav__link--active' : ''}`}
            >
              Geo-Tag & Gemini AI
            </a>
          </nav>

          <div className="landing-mobile-drawer__actions">
            {!session ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="btn btn--secondary btn--block"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('worker');
                  }}
                  className="btn btn--primary btn--block btn--sheen"
                >
                  Join as On-Field Worker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('customer');
                  }}
                  className="btn btn--ghost btn--block"
                >
                  Post Tasks as Customer →
                </button>
              </>
            ) : (
              <Link
                to="/overview"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn--primary btn--block"
              >
                Launch Console →
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
