import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FlaskConical, Menu, ShieldAlert, X } from 'lucide-react';
import { ROLES, canAccessPath, navItems, roleMeta } from '@/config/access';
import { useRole } from '@/context/RoleContext';
import { DemoTag } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { Role } from '@/types';
import { AccessDenied } from '@/pages/AccessDenied';

export function AppShell() {
  const { role, setRole, actorName } = useRole();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const items = navItems.filter((n) => n.roles.includes(role));
  const allowed = canAccessPath(role, location.pathname);

  // Close the mobile drawer and move focus to the main region on navigation.
  useEffect(() => {
    setNavOpen(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to main content</a>

      <aside id="primary-nav" className={`sidebar ${navOpen ? 'sidebar--open' : ''}`} aria-label="Primary">
        <div className="sidebar__brand">
          <span className="logo" aria-hidden>CH</span>
          <div>
            <p className="sidebar__name">ChaseHorse</p>
            <p className="sidebar__sub">Field operations</p>
          </div>
          <button type="button" className="icon-btn sidebar__close" onClick={() => setNavOpen(false)} aria-label="Close navigation">
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul>
            {items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
                  <Icon size={18} aria-hidden />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__foot">
          <p className="sidebar__foot-label">Viewing as</p>
          <div className="sidebar__who">
            <Avatar name={actorName} size={32} />
            <div>
              <p className="sidebar__who-name">{roleMeta[role].label}</p>
              <p className="sidebar__who-sub">Demo persona</p>
            </div>
          </div>
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden />}

      <div className="shell__main">
        <div className="demo-banner" role="note">
          <FlaskConical size={16} aria-hidden />
          <p>
            <strong>Prototype with demo data.</strong> No real sign-in, AI verification, payments or wallet transactions exist — everything resets on refresh.
          </p>
        </div>

        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={navOpen}
            aria-controls="primary-nav"
          >
            <Menu size={20} aria-hidden />
          </button>
          <div className="topbar__spacer" />
          <div className="role-switch">
            <label htmlFor="demo-role" className="role-switch__label">
              Demo role <span className="sr-only">(no sign-in — for previewing navigation only)</span>
            </label>
            <select id="demo-role" className="input input--compact" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleMeta[r].label}</option>
              ))}
            </select>
          </div>
          <DemoTag label="No authentication" />
        </header>

        <main id="main" ref={mainRef} tabIndex={-1} className="content">
          {allowed ? (
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          ) : (
            <AccessDenied />
          )}
        </main>

        <footer className="footer">
          <ShieldAlert size={14} aria-hidden />
          <span>Role switching only changes what this prototype displays. Real access control must be enforced by the backend API.</span>
        </footer>
      </div>
    </div>
  );
}
