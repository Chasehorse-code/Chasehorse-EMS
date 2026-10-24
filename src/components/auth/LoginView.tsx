import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { FormField } from '@/components/ui/FormField';
import { PasswordField } from '@/components/ui/PasswordField';
import type { Role } from '@/types';

export interface LoginViewProps {
  onSwitchView: (view: 'worker' | 'customer') => void;
  onClose: () => void;
  initialEmail?: string;
  initialMessage?: string | null;
}

export function LoginView({ onSwitchView, onClose, initialEmail = '', initialMessage = null }: LoginViewProps) {
  const { signIn, resetPassword, profile, refreshProfile, error: authError } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [localError, setLocalError] = useState<string | null>(null);

  const routeUser = (userProfile: any) => {
    if (userProfile?.accountStatus === 'PENDING') return navigate('/pending-approval', { replace: true });
    if (['SUSPENDED', 'REJECTED'].includes(userProfile?.accountStatus)) {
      setLocalError(`Account status is ${userProfile.accountStatus}. Please contact Operations.`);
      return;
    }
    const role = (userProfile?.roles?.[0] || 'employee').toLowerCase() as Role;
    setRole(role);
    navigate(role === 'customer' ? '/customer/dashboard' : ['admin', 'operations_manager', 'manager', 'operations'].includes(role) ? '/overview' : '/employee/dashboard', { replace: true });
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null); setMessage(null); setLoading(true);
    try {
      await signIn(email.trim(), password);
      const currentProfile = await refreshProfile();
      onClose();
      routeUser(currentProfile || profile);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null); setLoading(true);
    try {
      await resetPassword(email.trim());
      setMessage('Password reset instructions have been sent to your email.');
      setMode('login');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to send password reset instructions.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-view">
      <p className="auth-view__eyebrow">{mode === 'login' ? 'ACCOUNT ACCESS' : 'PASSWORD RECOVERY'}</p>
      <h2 className="auth-view__title">{mode === 'login' ? 'Sign in' : 'Reset your password'}</h2>
      <p className="auth-view__subtitle">{mode === 'login' ? 'Use your registered email and password to access your workspace.' : 'We will email a secure password-reset link.'}</p>
      {(localError || authError) && <div className="auth-feedback auth-feedback--error"><AlertCircle size={16} />{localError || authError}</div>}
      {message && <div className="auth-feedback auth-feedback--success"><CheckCircle2 size={16} />{message}</div>}
      <form onSubmit={mode === 'login' ? submitLogin : submitReset} className="auth-form" noValidate>
        <FormField id="login-email" label="Email address" required icon={<Mail size={18} />}>
          <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </FormField>
        {mode === 'login' && <PasswordField id="login-password" label="Password" required value={password} onChange={setPassword} autoComplete="current-password" />}
        <button className="btn btn--primary btn--block auth-submit" type="submit" disabled={loading}>
          {loading ? <><Loader2 size={17} className="spin" /> Please wait</> : <>{mode === 'login' ? 'Sign in' : 'Send reset link'} <ArrowRight size={17} /></>}
        </button>
      </form>
      <div className="auth-view__links">
        {mode === 'login' ? <button type="button" onClick={() => setMode('forgot')}>Forgot password?</button> : <button type="button" onClick={() => setMode('login')}>Back to sign in</button>}
      </div>
      {mode === 'login' && <div className="auth-view__footer"><span>New to ChaseHorse?</span><button type="button" onClick={() => onSwitchView('customer')}>Business account</button><button type="button" onClick={() => onSwitchView('worker')}>Join as field worker</button></div>}
    </div>
  );
}
