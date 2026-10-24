import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  Menu,
  ShieldAlert,
  X,
  LogIn,
  LogOut,
  Home,
  Search,
  Bell,
  ChevronDown,
  Headphones,
  User,
} from 'lucide-react';
import { canAccessPath, navItems, customerNavItems, roleMeta } from '@/config/access';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ChaseHorseLogo } from '@/components/ui/ChaseHorseLogo';
import { AccessDenied } from '@/pages/AccessDenied';

export function AppShell() {
  const { role, actorName } = useRole();
  const { user, profile, loading, signOut, signInAsDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Fail closed: enforce authentication and approved status for all protected routes
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#60a5fa',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        Verifying authenticated credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && profile.accountStatus?.toUpperCase() === 'PENDING') {
    return <Navigate to="/pending-approval" replace />;
  }

  // Use specialized enterprise customer navigation when role is customer
  const items = role === 'customer' ? customerNavItems : navItems.filter((n) => n.roles.includes(role));
  const allowed = canAccessPath(role, location.pathname);

  // Close drawers & dropdowns on route changes
  useEffect(() => {
    setNavOpen(false);
    setProfileMenuOpen(false);
    setNotifMenuOpen(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Handle ESC key for popovers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
        setProfileMenuOpen(false);
        setNotifMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchQuery.toUpperCase().startsWith('CH')) {
        navigate('/customer/tracking');
      } else {
        navigate('/tasks');
      }
    }
  };

  const displayName = profile?.displayName || (user?.email ? user.email.split('@')[0] : actorName);
  const userInitials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CH';

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* Primary Sidebar */}
      <aside id="primary-nav" className={`sidebar ${navOpen ? 'sidebar--open' : ''}`} aria-label="Primary">
        {/* Brand */}
        <div className="sidebar__brand" style={{ padding: '1.25rem 1.15rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
            <ChaseHorseLogo size={32} />
            <div>
              <p className="sidebar__name" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                ChaseHorse
              </p>
              <p className="sidebar__sub" style={{ fontSize: '0.75rem', margin: 0, color: '#94a3b8' }}>
                Field Task & Operations
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="sidebar__nav" aria-label="Main navigation" style={{ flex: 1, padding: '0.5rem 0.85rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? '#1d6df7' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(29, 109, 247, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <Icon size={18} aria-hidden />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Customer Sidebar Bottom Widget: Need Help? */}
        {role === 'customer' && (
          <div style={{ padding: '0.85rem 1.15rem 1rem 1.15rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}>
                  <Headphones size={15} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    Need Help?
                  </p>
                  <p style={{ margin: 0, fontSize: '0.725rem', color: '#94a3b8' }}>
                    Get support for your tasks
                  </p>
                </div>
              </div>
              <Link
                to="/customer/support"
                className="btn btn--primary"
                style={{
                  width: '100%',
                  fontSize: '0.775rem',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#1d6df7',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  boxSizing: 'border-box',
                }}
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Sidebar Footer Identity */}
        <div className="sidebar__foot" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <p className="sidebar__foot-label" style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
              {user ? 'Verified Account' : 'Guest Session'}
            </p>
            <Link to="/" className="icon-btn" title="Back to Public Site" aria-label="Public website" style={{ color: '#94a3b8' }}>
              <Home size={14} />
            </Link>
          </div>
          <div className="sidebar__who" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar name={displayName} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sidebar__who-name" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </p>
              <p className="sidebar__who-sub" style={{ margin: 0, fontSize: '0.75rem', color: '#38bdf8' }}>
                {roleMeta[role]?.label || role}
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => signOut()}
                className="icon-btn"
                title="Sign Out"
                aria-label="Sign out"
                style={{ color: '#94a3b8', cursor: 'pointer' }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden />}

      {/* Main Shell Content & Topbar */}
      <div className="shell__main">
        {/* Polished Topbar Navigation */}
        <header
          className="topbar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '12px clamp(16px, 3vw, 32px)',
            background: 'var(--surface, #0f1b30)',
            borderBottom: '1px solid var(--border, #1e3354)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Mobile hamburger menu */}
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            style={{ color: 'var(--color-text, #f8fafc)' }}
          >
            <Menu size={20} aria-hidden />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1', maxWidth: '420px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, tracking ID, or support..."
              className="input"
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                fontSize: '0.825rem',
                borderRadius: '8px',
                height: '38px',
                boxSizing: 'border-box',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--color-border, #334155)',
              }}
            />
          </form>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Demo Persona Switcher for Evaluation & Testing */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                gap: '2px',
              }}
            >
              <button
                type="button"
                title="Switch to Operations Portal (Chaitanya)"
                onClick={() => {
                  signInAsDemo('operations');
                  navigate('/overview');
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: (role === 'operations_manager' || role === 'admin' || role === 'manager' || role === 'operations') ? '#1d6df7' : 'transparent',
                  color: (role === 'operations_manager' || role === 'admin' || role === 'manager' || role === 'operations') ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🛡️</span>
                <span>Ops (Chaitanya)</span>
              </button>

              <button
                type="button"
                title="Switch to Customer Portal (Liyana)"
                onClick={() => {
                  signInAsDemo('customer');
                  navigate('/customer/dashboard');
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: role === 'customer' ? '#10b981' : 'transparent',
                  color: role === 'customer' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🏢</span>
                <span>Customer (Liyana)</span>
              </button>

              <button
                type="button"
                title="Switch to Worker Portal (Manu)"
                onClick={() => {
                  signInAsDemo('employee');
                  navigate('/employee/dashboard');
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: (role === 'employee' || role === 'field_worker') ? '#f59e0b' : 'transparent',
                  color: (role === 'employee' || role === 'field_worker') ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>⚡</span>
                <span>Worker (Manu)</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Menu */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="icon-btn"
                aria-label="Notifications"
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted, #94a3b8)',
                  background: notifMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: '1px solid var(--color-border, #334155)',
                  cursor: 'pointer',
                }}
              >
                <Bell size={18} />
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  3
                </span>
              </button>

              {/* Notification Popover */}
              {notifMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '320px',
                    background: 'var(--color-surface, #1e293b)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border, #334155)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                    padding: '1rem',
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                      Field Notifications
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: '#38bdf8', cursor: 'pointer' }}>Mark all read</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', fontSize: '0.8rem' }}>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>Evidence Uploaded</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>Photo proof submitted for TSK-FLD-8822 (Tenali Station Road)</p>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', fontSize: '0.8rem' }}>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>Task Approved & Verified</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>Operations Manager approved FMCG Retail Shelf Planogram</p>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', fontSize: '0.8rem' }}>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>Carrier In-Transit</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>Fleet truck AP-07-TY-4091 is 4.2 km from destination hub</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #102443 0%, #1769F5 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                }}>
                  {userInitials}
                </div>
                <div style={{ textAlign: 'left', display: 'none', minWidth: '80px' }} className="user-text-wrap">
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)', lineHeight: 1.2 }}>
                    {displayName}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                    {roleMeta[role]?.label || 'Customer'}
                  </p>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </button>

              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '230px',
                    background: 'var(--color-surface, #1e293b)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border, #334155)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                    padding: '0.75rem',
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border, #334155)', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text, #f8fafc)' }}>
                      {displayName}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {user?.email || 'customer@chasehorse.com'}
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.725rem', color: '#10b981', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      Account Status: Active
                    </div>
                  </div>

                  <Link
                    to="/customer/profile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: 'var(--color-text, #f8fafc)',
                      fontSize: '0.825rem',
                      textDecoration: 'none',
                    }}
                  >
                    <User size={15} color="#94a3b8" /> Profile & Account
                  </Link>
                  <Link
                    to="/customer/support"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: 'var(--color-text, #f8fafc)',
                      fontSize: '0.825rem',
                      textDecoration: 'none',
                    }}
                  >
                    <Headphones size={15} color="#94a3b8" /> Operations Support
                  </Link>

                  <div style={{ borderTop: '1px solid var(--color-border, #334155)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                    {user ? (
                      <button
                        type="button"
                        onClick={() => signOut()}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          color: '#f87171',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          color: '#38bdf8',
                          fontSize: '0.825rem',
                          textDecoration: 'none',
                        }}
                      >
                        <LogIn size={15} /> Sign In
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
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
          <span>ChaseHorse ERP • End-to-End Field Task Lifecycle & Immutable Reward Ledger • Pan-India</span>
        </footer>
      </div>
    </div>
  );
}
