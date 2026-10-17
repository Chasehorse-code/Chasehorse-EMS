import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { roleMeta } from '@/config/access';
import { useRole } from '@/context/RoleContext';

export function AccessDenied() {
  const { role } = useRole();
  return (
    <div className="empty empty--page">
      <Lock size={32} aria-hidden />
      <h1 className="empty__title">Not available for the {roleMeta[role].label} role</h1>
      <p className="empty__desc">
        This area is hidden for the current demo role. (In a real deployment the API would also refuse the request.)
      </p>
      <Link to="/" className="btn btn--primary btn--md">Back to overview</Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="empty empty--page">
      <h1 className="empty__title">Page not found</h1>
      <p className="empty__desc">That address doesn’t match any screen in this prototype.</p>
      <Link to="/" className="btn btn--primary btn--md">Back to overview</Link>
    </div>
  );
}
