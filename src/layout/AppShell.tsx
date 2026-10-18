import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { FlaskConical, Menu, ShieldAlert, X, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { ROLES, canAccessPath, navItems, roleMeta } from '@/config/access';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
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
          <span className="logo" aria-hidden>CH</span>
          <div>
            <p className="sidebar__name">ChaseHorse</p>
            <p className="sidebar__sub">Field operations & TMS</p>
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
          <p className="sidebar__foot-label">
            {user ? 'Authenticated User' : 'Active Persona'}
          </p>
          <div className="sidebar__who">
            <Avatar name={user ? (profile?.displayName || user.email || 'User') : actorName} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sidebar__who-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user ? (profile?.displayName || user.email?.split('@')[0]) : roleMeta[role].label}
              </p>
              <p className="sidebar__who-sub">
                {user ? (profile?.roles?.[0] || 'Member') : 'Demo preview'}
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
              <strong>Connected via Supabase Auth:</strong> Signed in as <code>{user.email}</code>. Backend operations authenticate with JWT verification.
            </p>
          </div>
        ) : (
          <div className="demo-banner" role="note">
            <FlaskConical size={16} aria-hidden />
            <p>
              <strong>Evaluation Mode:</strong> You can sign in with your enterprise credentials or preview workflows using the persona switcher.
            </p>
          </div>
        )}

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
              Role Switcher:
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--color-surface-sunken, #0f172a)',
                border: '1px solid var(--color-border, #334155)',
                color: 'var(--color-text-muted, #94a3b8)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
              }}
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
          <span>Role authorizations are verified through Spring Security and Supabase PostgreSQL Row Level Security.</span>
        </footer>
      </div>
    </div>
  );
}
