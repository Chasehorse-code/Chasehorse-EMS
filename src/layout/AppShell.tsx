import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, ShieldAlert, X, LogIn, LogOut, ShieldCheck, Home } from 'lucide-react';
import { ROLES, canAccessPath, navItems, roleMeta } from '@/config/access';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { Role } from '@/types';
import { AccessDenied } from '@/pages/AccessDenied';

export function AppShell() {
  const { role, setRole, actorName } = useRole();
  const { user, profile, signOut } = useAuth();
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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', color: 'inherit' }}>
            <span className="logo" aria-hidden>CH</span>
            <div>
              <p className="sidebar__name">ChaseHorse</p>
              <p className="sidebar__sub">Operations & Logistics</p>
            </div>
          </Link>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <p className="sidebar__foot-label" style={{ margin: 0 }}>
              {user ? 'Verified Session' : 'Active Role View'}
            </p>
            <Link to="/" className="icon-btn" title="Back to Public Site" aria-label="Public website">
              <Home size={15} />
            </Link>
          </div>
          <div className="sidebar__who">
            <Avatar name={user ? (profile?.displayName || user.email || 'User') : actorName} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sidebar__who-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user ? (profile?.displayName || user.email?.split('@')[0]) : roleMeta[role].label}
              </p>
              <p className="sidebar__who-sub">
                {user ? (profile?.roles?.[0] || 'Enterprise') : 'Console Preview'}
              </p>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="icon-btn"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <Link to="/login" className="icon-btn" title="Sign In" aria-label="Sign in">
                <LogIn size={16} />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden />}

      <div className="shell__main">
        {user ? (
          <div className="demo-banner" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.25)' }} role="note">
            <ShieldCheck size={16} aria-hidden />
            <p>
              <strong>Connected via Supabase Auth:</strong> Signed in as <code>{user.email}</code>. Live API operations verified with JWT tokens.
            </p>
          </div>
        ) : null}

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

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Role switcher for evaluation & multi-role testing */}
          <div className="role-switch">
            <label htmlFor="demo-role" className="role-switch__label">
              Role:
            </label>
            <select id="demo-role" className="input input--compact" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleMeta[r].label}</option>
              ))}
            </select>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="btn btn--ghost btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn--primary btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <LogIn size={14} /> Sign In
            </Link>
          )}
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
          <span>Role authorizations enforced via Spring Security & Supabase PostgreSQL Row Level Security.</span>
        </footer>
      </div>
    </div>
  );
}
